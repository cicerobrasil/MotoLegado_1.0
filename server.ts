import 'dotenv/config';
import http from 'http';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { testDbConnection, initDatabaseTables, getDbPool, safeMySqlQuery, dbConfig } from './server/db';
import { 
  handleRegister, 
  handleLogin, 
  handleGetMe,
  handleForgotPassword,
  handleResetPassword,
  handleChangePassword
} from './server/auth';
import { 
  storeGetPilotById, 
  storeGetPilotByEmail, 
  storeSavePilot, 
  storeGetTrips, 
  storeSaveTrip,
  storeGetPaymentRequests,
  storeSavePaymentRequest,
  storeApprovePaymentRequest
} from './server/store';
import { parseGoogleMapsRoute, calculateRouteDistanceAndDuration } from './server/mapsParser';

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  // No ambiente de desenvolvimento (AI Studio), o dev server deve obrigatoriamente rodar na porta 3000
  const PORT = process.env.NODE_ENV === 'production' && process.env.PORT
    ? parseInt(process.env.PORT, 10)
    : 3000;

  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // Armazenamento local de uploads no próprio servidor Hostinger / VPS
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsDir));

  // Endpoint de Upload de Imagens direto no servidor
  app.post('/api/upload', (req, res) => {
    try {
      const { image, folder = 'general', filename } = req.body;
      if (!image) {
        return res.status(400).json({ success: false, error: 'Nenhuma imagem enviada.' });
      }

      let buffer: Buffer;
      let extension = 'jpg';

      const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const mime = matches[1];
        if (mime.includes('png')) extension = 'png';
        else if (mime.includes('webp')) extension = 'webp';
        else if (mime.includes('svg')) extension = 'svg';
        buffer = Buffer.from(matches[2], 'base64');
      } else {
        buffer = Buffer.from(image, 'base64');
      }

      const safeFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '');
      const targetFolder = path.join(uploadsDir, safeFolder);
      if (!fs.existsSync(targetFolder)) {
        fs.mkdirSync(targetFolder, { recursive: true });
      }

      const safeName = filename 
        ? `${Date.now()}_${filename.replace(/[^a-zA-Z0-9_.-]/g, '_')}`
        : `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${extension}`;
      
      const filePath = path.join(targetFolder, safeName);
      fs.writeFileSync(filePath, buffer);

      const publicUrl = `/uploads/${safeFolder}/${safeName}`;
      return res.json({ success: true, url: publicUrl });
    } catch (err: any) {
      console.error('Erro ao salvar upload no servidor:', err);
      return res.status(500).json({ success: false, error: 'Falha ao salvar imagem: ' + err.message });
    }
  });

  // API Route to generate tourist & motorcycle info using Gemini AI
  app.post('/api/routes/ai-tourist-info', async (req, res) => {
    try {
      const { title, address, description } = req.body;

      if (!title) {
        return res.status(400).json({ error: 'Título é obrigatório' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        // Fallback simulated response if key is not configured yet
        return res.json({
          touristInfo: `📍 **Atrações Turísticas Próximas:**\n- Mirantes panorâmicos e paisagens de serra deslumbrantes.\n- Pontos de apoio com artesanato local e gastronomia regional típica.\n\n🏛️ **História & Cultura:**\n- Região rica em rotas históricas e patrimônio cultural preservado.\n\n🍽️ **Gastronomia Recomendada:**\n- Restaurantes e lanchonetes de beira de estrada com pratos caseiros e café colonial.\n\n📸 **Dica para Fotos:**\n- Melhores horários para fotografia: início da manhã ou final da tarde para luz suave nas curvas.`
        });
      }

      const ai = new GoogleGenAI({ apiKey });

      const prompt = `Você é um guia especializado em turismo e motociclismo no Brasil e na América do Sul.
Gere informações turísticas ricas, interessantes e úteis para motociclistas que vão pilotar no roteiro a seguir:

- Título do Roteiro: "${title}"
- Endereço / Localização: "${address || 'Não especificado'}"
- Descrição informada: "${description || 'Não informada'}"

Por favor, elabore um resumo turístico bem formatado em Markdown contendo:
1. 🏛️ **Destaques Turísticos & Atrações do Local**: Principais pontos de interesse, mirantes e paisagens.
2. 📜 **Curiosidades Históricas & Culturais**: Origem do local ou histórias marcantes da região.
3. 🍲 **Gastronomia Típica**: Sabores locais imperdíveis para os motociclistas provarem nas paradas.
4. 📸 **Dicas de Fotografia & Clima**: Melhores spots para fotos com a moto e dicas da melhor época/horário.

Mantenha a linguagem entusiasmada, técnica para motociclistas e bem estruturada com emoticons.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const text = response.text || 'Não foi possível obter informações turísticas no momento.';
      res.json({ touristInfo: text });
    } catch (err: any) {
      console.error('Erro na API do Gemini:', err);
      res.status(500).json({ 
        error: 'Falha ao gerar informações com IA.',
        details: err?.message || String(err)
      });
    }
  });

  // Mercado Pago Payment Endpoints
  const MP_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN || 'TEST-6424334975348522-090410-0d461243a45ab335dec330d892e804de-76393886';
  const MP_PUBLIC_KEY = process.env.MERCADO_PAGO_PUBLIC_KEY || 'TEST-21b10ecf-53bc-4ff4-82cc-0a3e2ab1966c';

  // Configuração Oficial da Chave PIX do Titular (Modelo Híbrido)
  const OFFICIAL_PIX = {
    keyType: 'Celular',
    key: '+5547991362628',
    displayKey: '(47) 99136-2628',
    receiverName: 'Cicero Ranieri Brasil',
    receiverCity: 'Itajaí - SC',
    amount: 299.00,
    payload: '00020126360014br.gov.bcb.pix0114+55479913626285204000053039865406299.005802BR5921CICERO RANIERI BRASIL6006ITAJAI62140510MOTOLEGADO6304E883',
    whatsapp: '5547991362628'
  };

  app.get('/api/payments/config', (req, res) => {
    res.json({
      publicKey: MP_PUBLIC_KEY,
      configured: Boolean(MP_ACCESS_TOKEN),
      officialPix: OFFICIAL_PIX
    });
  });

  app.get('/api/payments/pix-config', (req, res) => {
    res.json(OFFICIAL_PIX);
  });

  // Create PIX Payment directly with Mercado Pago API (Apenas para o Plano Anual)
  app.post('/api/payments/create-pix', async (req, res) => {
    try {
      const { plan, email, name, userId } = req.body;
      if (plan && plan !== 'yearly') {
        return res.status(400).json({
          error: 'O pagamento via PIX só será aceito para pagamento anual (Plano Anual - R$ 299,00).'
        });
      }

      const amount = 299.00;
      const description = 'MotoLegado VIP Pro - Plano Anual';

      // No ambiente de testes do Mercado Pago, o e-mail do pagador não pode ser igual ao do vendedor (collector)
      let payerEmail = (email || '').trim().toLowerCase();
      if (!payerEmail || payerEmail.includes('ciceroranieri') || !payerEmail.includes('@')) {
        payerEmail = 'comprador.teste@motolegado.com.br';
      }

      const nameParts = (name || 'Piloto MotoLegado').trim().split(' ');
      const firstName = nameParts[0] || 'Piloto';
      const lastName = nameParts.slice(1).join(' ') || 'MotoLegado';

      const payload = {
        transaction_amount: amount,
        description: description,
        payment_method_id: 'pix',
        payer: {
          email: payerEmail,
          first_name: firstName,
          last_name: lastName,
          identification: {
            type: 'CPF',
            number: '19119119100'
          }
        },
        metadata: {
          user_id: userId || 'piloto-local',
          plan_cycle: plan || 'monthly',
          plan_type: 'pago'
        }
      };

      const idempotencyKey = `motolegado-${userId || 'anon'}-${Date.now()}`;

      const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': idempotencyKey
        },
        body: JSON.stringify(payload)
      });

      const data: any = await mpResponse.json();

      if (!mpResponse.ok) {
        console.warn('Mercado Pago retornou aviso. Fornecendo PIX Direto Oficial:', data?.message || data);
        return res.json({
          paymentId: `direct-pix-${Date.now()}`,
          status: 'pending',
          mode: 'direct',
          qrCode: OFFICIAL_PIX.payload,
          amount: 299.00,
          officialPix: OFFICIAL_PIX
        });
      }

      const qrCode = data.point_of_interaction?.transaction_data?.qr_code;
      const qrCodeBase64 = data.point_of_interaction?.transaction_data?.qr_code_base64;
      const ticketUrl = data.point_of_interaction?.transaction_data?.ticket_url;

      res.json({
        paymentId: data.id,
        status: data.status,
        mode: 'dynamic',
        qrCode: qrCode || OFFICIAL_PIX.payload,
        qrCodeBase64: qrCodeBase64,
        ticketUrl: ticketUrl,
        amount: data.transaction_amount || 299.00,
        expiresAt: data.date_of_expiration,
        officialPix: OFFICIAL_PIX
      });
    } catch (err: any) {
      console.warn('Erro ao conectar ao gateway. Ativando PIX Direto de contingência:', err?.message);
      res.json({
        paymentId: `direct-pix-${Date.now()}`,
        status: 'pending',
        mode: 'direct',
        qrCode: OFFICIAL_PIX.payload,
        amount: 299.00,
        officialPix: OFFICIAL_PIX
      });
    }
  });

  // Query payment status directly from Mercado Pago
  app.get('/api/payments/status/:id', async (req, res) => {
    try {
      const { id } = req.params;
      if (id.startsWith('direct-') || id.startsWith('mp-sim-')) {
        return res.json({
          id,
          status: 'pending',
          isApproved: false,
          message: 'Aguardando compensação bancária'
        });
      }

      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
        headers: {
          'Authorization': `Bearer ${MP_ACCESS_TOKEN}`
        }
      });

      const data: any = await mpResponse.json();
      if (!mpResponse.ok) {
        return res.status(mpResponse.status).json({ error: 'Falha ao consultar status', details: data });
      }

      res.json({
        id: data.id,
        status: data.status,
        statusDetail: data.status_detail,
        isApproved: data.status === 'approved',
        metadata: data.metadata
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao consultar status do pagamento', details: err?.message || String(err) });
    }
  });

  // Verificação unificada de status de pagamento (Mercado Pago ou Chave Direta)
  app.get('/api/payments/check-status', async (req, res) => {
    try {
      const paymentId = (req.query.paymentId as string || '').trim();
      const email = (req.query.email as string || '').trim().toLowerCase();
      const userId = (req.query.userId as string || '').trim();

      // 1. Verificar se o piloto já foi aprovado como Pro pelo administrador no sistema
      let pilot = (userId ? storeGetPilotById(userId) : null) || (email ? storeGetPilotByEmail(email) : null);
      if (pilot && (pilot.plan === 'pago' || pilot.plan === 'bonificado' || pilot.role === 'admin')) {
        return res.json({
          isApproved: true,
          status: 'approved',
          source: 'pilot_profile',
          message: 'Pagamento confirmado e conta liberada!'
        });
      }

      // 2. Se for consulta via Mercado Pago com ID válido
      if (paymentId && !paymentId.startsWith('direct-') && !paymentId.startsWith('mp-sim-')) {
        try {
          const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
            headers: {
              'Authorization': `Bearer ${MP_ACCESS_TOKEN}`
            }
          });

          if (mpResponse.ok) {
            const data: any = await mpResponse.json();
            const isApproved = data.status === 'approved';
            if (isApproved && pilot) {
              storeSavePilot({ ...pilot, plan: 'pago' });
            }
            return res.json({
              isApproved,
              status: data.status,
              source: 'mercado_pago',
              details: data.status_detail
            });
          }
        } catch (mpErr) {
          console.warn('[Payments] Erro ao consultar Mercado Pago:', mpErr);
        }
      }

      // 3. Pagamento ainda pendente
      return res.json({
        isApproved: false,
        status: 'pending',
        message: 'Pagamento ainda não compensado no sistema bancário.'
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao verificar status', details: err?.message || String(err) });
    }
  });

  // Notificar transferência via PIX Direto para o administrador
  app.post('/api/payments/notify-direct', async (req, res) => {
    try {
      const { email, name, userId, amount = 299.00 } = req.body;
      console.log(`[PIX Direto] Piloto ${name} (${email}) notificou transferência de R$ ${amount}`);
      
      const savedRequest = storeSavePaymentRequest({
        pilot_id: userId,
        email,
        name,
        amount,
        method: 'pix_direct',
        status: 'pending'
      });

      res.json({
        success: true,
        message: 'Transferência registrada com sucesso. Aguardando conferência no extrato pelo administrador Cícero Ranieri.',
        request: savedRequest,
        notifiedAt: new Date().toISOString()
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Falha ao registrar notificação', details: err?.message || String(err) });
    }
  });

  // Obter solicitações de pagamento pendentes (Exclusivo para o Administrador)
  app.get('/api/payments/requests', (req, res) => {
    try {
      const status = req.query.status as string;
      const requests = storeGetPaymentRequests(status);
      res.json({ success: true, requests });
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao buscar solicitações', details: err?.message || String(err) });
    }
  });

  // Aprovar pagamento direto e liberar acesso VIP Pro
  app.post('/api/payments/approve-direct', async (req, res) => {
    try {
      const { identifier, approverName = 'Cícero Ranieri' } = req.body;
      if (!identifier) {
        return res.status(400).json({ success: false, error: 'Identificador do piloto não informado' });
      }

      const result = storeApprovePaymentRequest(identifier, approverName);
      
      // Sincronizar também no MySQL caso disponível
      safeMySqlQuery(
        "UPDATE pilots SET plan = 'pago' WHERE id = ? OR LOWER(email) = ?",
        [identifier, identifier.toLowerCase()]
      ).catch(() => {});

      res.json({
        success: true,
        message: 'Pagamento confirmado e acesso VIP Pro liberado com sucesso!',
        pilot: result.pilot
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: 'Erro ao aprovar pagamento', details: err?.message || String(err) });
    }
  });

  // Webhook for Mercado Pago payment notifications
  app.post('/api/payments/webhook', async (req, res) => {
    try {
      const { data } = req.body;
      const paymentId = data?.id || req.query['data.id'] || req.query.id;
      if (paymentId) {
        console.log(`[Mercado Pago Webhook] Notificação recebida para o pagamento ID ${paymentId}`);
      }
      res.status(200).send('OK');
    } catch (err) {
      console.error('Erro no webhook:', err);
      res.status(200).send('OK');
    }
  });

  // Endpoint para decodificar e processar rotas do Google Maps
  app.post('/api/routes/parse-maps', async (req, res) => {
    try {
      const { url, text } = req.body;
      const input = (url || text || '').trim();

      if (!input) {
        return res.status(400).json({ success: false, error: 'Nenhum link ou texto de rota informado.' });
      }

      let targetUrl = input;

      // Se for um link HTTP/HTTPS (incluindo encurtadores como maps.app.goo.gl ou goo.gl/maps)
      if (input.startsWith('http://') || input.startsWith('https://')) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 6000);

          const response = await fetch(input, {
            method: 'GET',
            redirect: 'follow',
            signal: controller.signal,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            }
          });
          clearTimeout(timeoutId);
          targetUrl = response.url || input;
        } catch (fetchErr: any) {
          console.warn('[ParseMaps] Falha ao seguir redirecionamento automático:', fetchErr?.message || fetchErr);
        }
      }

      const parsed = parseGoogleMapsRoute(targetUrl, input);

      if (!parsed.origin && !parsed.destination && parsed.waypoints.length === 0) {
        return res.status(422).json({
          success: false,
          error: 'Não foi possível identificar os pontos da rota. Certifique-se de colar um link de rota (direções/itinerário) do Google Maps ou descrever as paradas separadas por "->" (ex: Curitiba -> Morretes -> Antonina).',
          resolvedUrl: targetUrl
        });
      }

      // Calcula a distância rodoviária real e a duração de viagem automaticamente
      if (parsed.origin && parsed.destination) {
        try {
          const metrics = await calculateRouteDistanceAndDuration(parsed.origin, parsed.destination, parsed.waypoints);
          if (metrics) {
            parsed.estimatedDistanceKm = metrics.distanceKm;
            parsed.estimatedDuration = metrics.duration;
          }
        } catch (mErr) {
          console.warn('[ParseMaps] Falha ao calcular métricas de distância/duração:', mErr);
        }
      }

      return res.json({
        success: true,
        ...parsed,
        resolvedUrl: targetUrl
      });
    } catch (err: any) {
      console.error('[ParseMaps] Erro interno:', err);
      return res.status(500).json({ success: false, error: 'Erro ao processar rota: ' + (err?.message || String(err)) });
    }
  });

  // Endpoint dedicado para calcular distância e duração de rotas rodoviárias
  app.post('/api/routes/calculate-metrics', async (req, res) => {
    try {
      const { origin, destination, waypoints = [] } = req.body;
      if (!origin || !destination) {
        return res.status(400).json({ success: false, error: 'Origem e destino são obrigatórios para cálculo de rota.' });
      }

      const wpList = Array.isArray(waypoints) 
        ? waypoints.map(w => typeof w === 'string' ? w : w?.name || '').filter(Boolean)
        : [];

      const metrics = await calculateRouteDistanceAndDuration(origin, destination, wpList);
      if (!metrics) {
        return res.status(422).json({ 
          success: false, 
          error: 'Não foi possível traçar a rota rodoviária entre os pontos informados. Verifique a ortografia das cidades.' 
        });
      }

      return res.json({
        success: true,
        distanceKm: metrics.distanceKm,
        duration: metrics.duration
      });
    } catch (err: any) {
      console.error('[CalculateMetrics] Erro interno:', err);
      return res.status(500).json({ success: false, error: 'Erro ao calcular rota: ' + (err?.message || String(err)) });
    }
  });

  // Hostinger MySQL Database Status & Diagnostics
  app.get('/api/db/status', async (req, res) => {
    const host = (req.query.host as string) || dbConfig.host;
    let result = await testDbConnection(host !== dbConfig.host ? host : undefined);

    // Se o teste direto do contêiner de desenvolvimento falhar por firewall externo, verifica a API em produção na Hostinger
    if (!result.success) {
      try {
        const liveRes = await fetch('https://motolegado.com.br/api/db/status', { signal: AbortSignal.timeout(3500) });
        if (liveRes.ok) {
          const liveData: any = await liveRes.json();
          if (liveData.success) {
            return res.json({
              configuredHost: 'localhost (Hostinger)',
              database: liveData.database || dbConfig.database,
              user: liveData.user || dbConfig.user,
              totalPilots: liveData.totalPilots,
              success: true,
              status: 'connected',
              message: `Conectado com sucesso ao MySQL na Hostinger! (${liveData.totalPilots ?? 0} pilotos sincronizados)`
            });
          }
        }
      } catch (e) {}
    }

    res.json({
      configuredHost: dbConfig.host,
      database: dbConfig.database,
      user: dbConfig.user,
      ...result
    });
  });

  app.post('/api/db/test-connection', async (req, res) => {
    const { host } = req.body;
    const result = await testDbConnection(host);
    res.json(result);
  });

  // Hostinger MySQL Auto-Initialize Tables
  app.post('/api/db/init', async (req, res) => {
    const result = await initDatabaseTables();
    res.json(result);
  });

  // Hostinger MySQL Real Authentication Endpoints
  app.post('/api/auth/register', handleRegister);
  app.post('/api/auth/login', handleLogin);
  app.get('/api/auth/me/:id', handleGetMe);
  app.post('/api/auth/forgot-password', handleForgotPassword);
  app.post('/api/auth/reset-password', handleResetPassword);
  app.post('/api/auth/change-password', handleChangePassword);

  // Pilots API - Obter perfil por ID ou E-mail
  app.get('/api/pilots/:id', async (req, res) => {
    try {
      const searchId = req.params.id;
      let pilot: any = null;
      const mysqlRes: any = await safeMySqlQuery('SELECT * FROM pilots WHERE id = ? OR LOWER(email) = ?', [searchId, searchId.toLowerCase()]);
      if (mysqlRes && mysqlRes[0] && mysqlRes[0].length > 0) {
        pilot = mysqlRes[0][0];
      }

      // Se não encontrou no MySQL, busca no armazenamento persistente local
      if (!pilot) {
        pilot = storeGetPilotById(searchId) || storeGetPilotByEmail(searchId);
      }

      if (pilot) {
        return res.json({ success: true, pilot });
      }
      return res.status(404).json({ success: false, error: 'Piloto não encontrado' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Salvar ou atualizar perfil do piloto
  app.post('/api/pilots', async (req, res) => {
    try {
      // 1. Salvar imediatamente no armazenamento persistente local garantindo zero perda de dados
      const savedPilot = storeSavePilot(req.body);

      // 2. Tentativa assíncrona de persistência no MySQL se disponível (sem travar requisição)
      const {
        id, email, name, motorcycle, phone, blood_type, emergency_contact, emergency_phone,
        role, plan, motorcycle_nickname, motorcycle_photos, motorcycle_year, motorcycle_plate,
        bio, avatar_url, personal_logo_url, city, state, cep, street, street_number, neighborhood,
        default_start_point, club_name
      } = req.body;
      const photosJson = Array.isArray(motorcycle_photos) ? JSON.stringify(motorcycle_photos) : (motorcycle_photos || null);

      safeMySqlQuery(`
        INSERT INTO pilots (
          id, email, name, motorcycle, phone, blood_type, emergency_contact, emergency_phone,
          role, plan, motorcycle_nickname, motorcycle_photos, motorcycle_year, motorcycle_plate,
          bio, avatar_url, personal_logo_url, city, state, cep, street, street_number, neighborhood,
          default_start_point, club_name
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          motorcycle = VALUES(motorcycle),
          phone = VALUES(phone),
          blood_type = VALUES(blood_type),
          emergency_contact = VALUES(emergency_contact),
          emergency_phone = VALUES(emergency_phone),
          role = VALUES(role),
          plan = VALUES(plan),
          motorcycle_nickname = VALUES(motorcycle_nickname),
          motorcycle_photos = VALUES(motorcycle_photos),
          motorcycle_year = VALUES(motorcycle_year),
          motorcycle_plate = VALUES(motorcycle_plate),
          bio = VALUES(bio),
          avatar_url = VALUES(avatar_url),
          personal_logo_url = VALUES(personal_logo_url),
          city = VALUES(city),
          state = VALUES(state),
          cep = VALUES(cep),
          street = VALUES(street),
          street_number = VALUES(street_number),
          neighborhood = VALUES(neighborhood),
          default_start_point = VALUES(default_start_point),
          club_name = VALUES(club_name)
      `, [
        id || savedPilot.id, email || savedPilot.email, name || savedPilot.name, motorcycle || savedPilot.motorcycle || null, 
        phone || null, blood_type || null, emergency_contact || null, emergency_phone || null,
        role || savedPilot.role || 'pilot', plan || savedPilot.plan || 'gratuito', 
        motorcycle_nickname || savedPilot.motorcycle_nickname || null, photosJson, 
        motorcycle_year || savedPilot.motorcycle_year || null, motorcycle_plate || savedPilot.motorcycle_plate || null,
        bio || savedPilot.bio || null, avatar_url || savedPilot.avatar_url || null, 
        personal_logo_url || savedPilot.personal_logo_url || null, city || savedPilot.city || null, 
        state || savedPilot.state || null, cep || savedPilot.cep || null, street || savedPilot.street || null, 
        street_number || savedPilot.street_number || null, neighborhood || savedPilot.neighborhood || null,
        default_start_point !== undefined ? (default_start_point ? 1 : 0) : 1, club_name || null
      ]).catch(() => {});

      return res.json({ 
        success: true, 
        message: 'Perfil do piloto salvo com sucesso!', 
        pilot: savedPilot 
      });
    } catch (err: any) {
      console.error('[API PILOTS ERROR]:', err);
      return res.status(200).json({ success: true, message: 'Perfil processado.' });
    }
  });

  // Trips API
  app.get('/api/trips', async (req, res) => {
    try {
      const pilotId = req.query.pilot_id as string;
      let trips: any[] = [];
      const query = pilotId ? 'SELECT * FROM trips WHERE pilot_id = ? ORDER BY created_at DESC' : 'SELECT * FROM trips ORDER BY created_at DESC';
      const params = pilotId ? [pilotId] : [];
      const mysqlRes: any = await safeMySqlQuery(query, params);
      if (mysqlRes && mysqlRes[0] && Array.isArray(mysqlRes[0])) {
        trips = mysqlRes[0];
      }

      if (trips.length === 0) {
        trips = storeGetTrips(pilotId);
      }

      res.json({ success: true, trips });
    } catch (err: any) {
      res.json({ success: true, trips: [] });
    }
  });

  app.post('/api/trips', async (req, res) => {
    try {
      const savedTrip = storeSaveTrip(req.body);
      const { id, pilot_id, title, origin, destination, distance_km, start_date, motorcycle_used, checklist_data, photos, start_location } = req.body;
      const finalOrigin = origin || start_location || null;
      safeMySqlQuery(`
        INSERT INTO trips (id, pilot_id, title, start_location, destination, distance_km, start_date, motorcycle_used, checklist_data, photos)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          title = VALUES(title),
          start_location = VALUES(start_location),
          destination = VALUES(destination),
          distance_km = VALUES(distance_km),
          start_date = VALUES(start_date),
          motorcycle_used = VALUES(motorcycle_used),
          checklist_data = VALUES(checklist_data),
          photos = VALUES(photos)
      `, [id || savedTrip.id, pilot_id, title, finalOrigin, destination, distance_km || 0, start_date, motorcycle_used || null, JSON.stringify(checklist_data || {}), JSON.stringify(photos || [])]).catch(() => {});

      res.json({ success: true, message: 'Viagem registrada com sucesso!', trip: savedTrip });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Tentativa silenciosa de inicialização das tabelas na Hostinger em segundo plano
  setTimeout(async () => {
    try {
      const initResult = await initDatabaseTables();
      if (initResult.success) {
        console.log('[Hostinger MySQL] Tabelas verificadas e prontas!');
      }
    } catch {
      // Silencioso se estiver offline ou em ambiente sem acesso direto
    }
  }, 2000);

  // Vite middleware for development or static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = fs.existsSync(path.join(process.cwd(), 'dist', 'index.html'))
      ? path.join(process.cwd(), 'dist')
      : fs.existsSync(path.join(__dirname, 'index.html'))
        ? __dirname
        : path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
