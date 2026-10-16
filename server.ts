import 'dotenv/config';
import http from 'http';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { testDbConnection, initDatabaseTables, getDbPool, safeMySqlQuery, dbConfig } from './server/db';
import dbService from './server/dbService';
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
  storeGetAllPilots,
  storeGetTrips, 
  storeSyncTripsFromDb,
  storeSaveTrip,
  storeDeleteTrip,
  storeGetPaymentRequests,
  storeSavePaymentRequest,
  storeApprovePaymentRequest
} from './server/store';
import { parseGoogleMapsRoute, calculateRouteDistanceAndDuration, extractMetricsFromText } from './server/mapsParser';

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

  // API Route to suggest route description & riding techniques using Gemini AI
  app.post('/api/routes/ai-suggest-route', async (req, res) => {
    try {
      const { title, address } = req.body;

      if (!title || !title.trim()) {
        return res.status(400).json({ error: 'Título do roteiro é obrigatório para gerar sugestão com IA.' });
      }

      const fallbackDescription = `Roteiro incrível por "${title}"${address ? ` localizado em ${address}` : ''}. Um percurso espetacular que combina belas paisagens naturais, trechos sinuosos e uma experiência imersiva para quem pilota sobre duas rodas. Pelo caminho, você encontrará mirantes panorâmicos com vista privilegiada, paradas estratégicas para descanso e gastronomia regional típica da serra.`;

      const fallbackTechniques = `• Pilotagem & Curvas: Mantenha postura relaxada nos braços, olhar direcionado para a saída de cada curva e atenção à inclinação da moto em trechos com declive.\n• Asfalto & Aderência: Fique atento a eventuais resíduos de folhas ou umidade nas curvas sombreadas no período da manhã.\n• Planejamento: Abasteça a moto nas cidades-base e mantenha a calibragem dos pneus adequada para o tipo de percurso.\n• Equipamentos: Jaqueta com proteções completas, luvas e viseira limpa para máxima visibilidade nas variações de luminosidade.`;

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.json({
          description: fallbackDescription,
          techniques: fallbackTechniques
        });
      }

      const ai = new GoogleGenAI({ apiKey });

      const prompt = `Você é um experiente motociclista e guia de viagens de moto no Brasil e América do Sul.
Para o roteiro de moto a seguir:
- Título do Roteiro: "${title}"
- Endereço / Localização: "${address || 'Não especificado'}"

Gere uma sugestão em JSON estrito com dois campos em português:
1. "description": Descrição envolvente e rica do local e da experiência de pilotagem (2 a 3 parágrafos fluídos sobre paisagem, estrada, história ou atmosfera).
2. "techniques": Dicas técnicas práticas de pilotagem para essa rota (itens com marcadores • abordando curvas, frenagem, marcha/tração, qualidade do piso, segurança, postos e melhor horário).

Responda EXCLUSIVAMENTE em formato JSON:
{
  "description": "...",
  "techniques": "..."
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const rawText = response.text || '';
      try {
        const parsed = JSON.parse(rawText);
        return res.json({
          description: parsed.description || fallbackDescription,
          techniques: parsed.techniques || fallbackTechniques
        });
      } catch {
        return res.json({
          description: rawText || fallbackDescription,
          techniques: fallbackTechniques
        });
      }
    } catch (err: any) {
      console.error('Erro na API do Gemini para sugestão de roteiro:', err);
      return res.json({
        description: `Roteiro por "${req.body?.title || 'Roteiro'}"${req.body?.address ? ` (${req.body.address})` : ''}. Uma rota cênica com curvas e paisagens marcantes para motociclistas.`,
        techniques: `• Atenção ao traçado das curvas e modulação suave dos freios.\n• Verifique a pressão dos pneus e nível de combustível antes de iniciar o trecho.\n• Mantenha distância segura e aproveite as paradas para fotos e hidratação.`
      });
    }
  });

  // API Route to generate tourist & motorcycle info using Gemini AI (legacy compatibility)
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
        model: 'gemini-3.8-flash',
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
      let responseHtml = '';

      // Extrai qualquer URL contida na entrada (inclusive dentro de mensagens como "De Curitiba para Morretes... https://maps.app.goo.gl/...")
      const extractedUrl = input.match(/https?:\/\/[^\s]+/i)?.[0];
      const urlToFetch = extractedUrl || (input.startsWith('http://') || input.startsWith('https://') ? input : null);

      if (urlToFetch) {
        try {
          // 1. Para links encurtados (maps.app.goo.gl, goo.gl), busca redirecionamento 302 manual (ultra-rápido, ~200ms)
          if (urlToFetch.includes('goo.gl') || urlToFetch.includes('maps.app')) {
            try {
              const headRes = await fetch(urlToFetch, {
                method: 'HEAD',
                redirect: 'manual',
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
                }
              });
              const loc = headRes.headers.get('location');
              if (loc) {
                targetUrl = loc.startsWith('http') ? loc : new URL(loc, urlToFetch).href;
              }
            } catch (headErr) {
              console.warn('[ParseMaps] HEAD redirect rápido falhou, tentando GET follow:', headErr);
            }
          }

          // 2. Se ainda não resolveu rota completa com /dir/, faz GET follow
          if (!targetUrl.includes('/dir/') && !targetUrl.includes('origin=')) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(urlToFetch, {
              method: 'GET',
              redirect: 'follow',
              signal: controller.signal,
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
              }
            });
            clearTimeout(timeoutId);
            targetUrl = response.url || targetUrl;
            responseHtml = await response.text();
          }
        } catch (fetchErr: any) {
          console.warn('[ParseMaps] Falha ao seguir redirecionamento automático:', fetchErr?.message || fetchErr);
        }
      }

      // Se a URL final for de consentimento do Google (consent.google.com), extrai o parâmetro continue original
      if (targetUrl && targetUrl.includes('consent.google.com') && targetUrl.includes('continue=')) {
        try {
          const consentUrl = new URL(targetUrl);
          const cont = consentUrl.searchParams.get('continue');
          if (cont) {
            targetUrl = decodeURIComponent(cont);
          }
        } catch {}
      }

      const parsed = parseGoogleMapsRoute(targetUrl, input);

      // Se a página do Google Maps retornou HTML com metatags de rota (ex: descrição com tempo e km)
      if (responseHtml && (!parsed.estimatedDistanceKm || !parsed.estimatedDuration)) {
        const metaMatches = [
          responseHtml.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i)?.[1],
          responseHtml.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i)?.[1],
          responseHtml.match(/<meta\s+[^>]*content=["']([^"']*(?:km|min|h)[^"']*)["'][^>]*>/i)?.[1],
          responseHtml.match(/<title>([^<]+)<\/title>/i)?.[1]
        ].filter(Boolean) as string[];

        for (const metaText of metaMatches) {
          const { distanceKm: metaKm, duration: metaDur } = extractMetricsFromText(metaText);
          if (metaKm && !parsed.estimatedDistanceKm) parsed.estimatedDistanceKm = metaKm;
          if (metaDur && !parsed.estimatedDuration) parsed.estimatedDuration = metaDur;
        }
      }

      if (!parsed.origin && !parsed.destination && parsed.waypoints.length === 0) {
        return res.status(422).json({
          success: false,
          error: 'Não foi possível identificar os pontos da rota. Certifique-se de colar um link de rota (direções/itinerário) do Google Maps ou descrever as paradas separadas por "->" (ex: Curitiba -> Morretes -> Antonina).',
          resolvedUrl: targetUrl
        });
      }

      // Se ainda não temos distância ou duração exatas extraídas do Google Maps, calcula via OSRM / Geocodificação
      if (parsed.origin && parsed.destination && (!parsed.estimatedDistanceKm || !parsed.estimatedDuration)) {
        try {
          const metrics = await calculateRouteDistanceAndDuration(
            parsed.origin, 
            parsed.destination, 
            parsed.waypoints,
            parsed.coords
          );
          if (metrics) {
            if (!parsed.estimatedDistanceKm) parsed.estimatedDistanceKm = metrics.distanceKm;
            if (!parsed.estimatedDuration) parsed.estimatedDuration = metrics.duration;
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

  // Hostinger MySQL Teste Direto de Consulta SELECT 1 via mysql2
  app.get('/api/db/ping', async (req, res) => {
    const startTime = Date.now();
    try {
      const pool = getDbPool();
      if (!pool) {
        return res.status(500).json({
          success: false,
          status: 'Erro de Conexão',
          query: 'SELECT 1 AS ping',
          latencyMs: Date.now() - startTime,
          host: dbConfig.host,
          database: dbConfig.database,
          message: 'Pool de conexão MySQL não inicializado.',
          error: 'MySQL Pool indisponível.'
        });
      }

      const [rows]: any = await pool.query('SELECT 1 AS ping, NOW() AS server_time, DATABASE() AS current_database, VERSION() AS mysql_version');
      const latencyMs = Date.now() - startTime;

      return res.json({
        success: true,
        status: 'Conectado',
        query: 'SELECT 1 AS ping',
        latencyMs,
        host: dbConfig.host,
        database: dbConfig.database,
        user: dbConfig.user,
        message: 'Consulta SELECT 1 executada com sucesso via mysql2 no banco da Hostinger!',
        result: rows,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      console.error('[MySQL Ping SELECT 1] Erro na consulta:', err);
      return res.status(500).json({
        success: false,
        status: 'Erro de Conexão',
        query: 'SELECT 1 AS ping',
        latencyMs,
        host: dbConfig.host,
        database: dbConfig.database,
        user: dbConfig.user,
        message: err?.message || 'Falha ao executar SELECT 1 no banco da Hostinger.',
        error: err?.message || String(err),
        timestamp: new Date().toISOString()
      });
    }
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

  // Pilots API - Centralizado via dbService
  app.get('/api/pilots', async (req, res) => {
    try {
      const pilots = await dbService.getAllPilots();
      return res.json({ success: true, pilots });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message, pilots: [] });
    }
  });

  app.get('/api/pilots/:id', async (req, res) => {
    try {
      const pilot = await dbService.getPilotById(req.params.id);
      if (pilot) {
        return res.json({ success: true, pilot });
      }
      return res.status(404).json({ success: false, error: 'Piloto não encontrado' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/pilots', async (req, res) => {
    try {
      const savedPilot = await dbService.savePilot(req.body);
      return res.json({ 
        success: true, 
        message: 'Perfil do piloto salvo com sucesso!', 
        pilot: savedPilot 
      });
    } catch (err: any) {
      console.error('[API PILOTS ERROR]:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Trips API (Diário de Bordo) - Centralizado via dbService
  app.get('/api/trips', async (req, res) => {
    try {
      const rawPilotId = req.query.pilot_id as string;
      const wantAll = req.query.all === 'true' || rawPilotId === 'all';
      const cleanPilotId = (!rawPilotId || rawPilotId === 'undefined' || rawPilotId === 'null' || rawPilotId === 'all') 
        ? undefined 
        : rawPilotId.trim();

      const trips = await dbService.getTrips(cleanPilotId, wantAll);
      return res.json({ success: true, trips });
    } catch (err: any) {
      console.warn('[Trips API] Falha na consulta de viagens:', err?.message);
      return res.json({ success: true, trips: [] });
    }
  });

  app.post('/api/trips', async (req, res) => {
    try {
      const savedTrip = await dbService.saveTrip(req.body);
      return res.json({ success: true, message: 'Viagem registrada com sucesso no banco MySQL!', trip: savedTrip });
    } catch (err: any) {
      console.error('[Trips API] Erro ao registrar viagem:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/trips/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const success = await dbService.deleteTrip(id);
      return res.json({ success, message: 'Viagem excluída com sucesso!' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Routes API (Roteiros) - Centralizado via dbService
  app.get('/api/routes', async (req, res) => {
    try {
      const status = req.query.status as string;
      const routes = await dbService.getRoutes(status);
      return res.json({ success: true, routes });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message, routes: [] });
    }
  });

  app.get('/api/routes/:id', async (req, res) => {
    try {
      const route = await dbService.getRouteById(req.params.id);
      if (route) {
        return res.json({ success: true, route });
      }
      return res.status(404).json({ success: false, error: 'Roteiro não encontrado' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/routes', async (req, res) => {
    try {
      const savedRoute = await dbService.saveRoute(req.body);
      return res.json({ 
        success: true, 
        message: 'Roteiro registrado com sucesso no banco MySQL!', 
        route: savedRoute 
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.put('/api/routes/:id/status', async (req, res) => {
    try {
      const { status, rejectionReason } = req.body;
      const success = await dbService.updateRouteStatus(req.params.id, status, rejectionReason);
      return res.json({ success, message: 'Status do roteiro atualizado com sucesso!' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/routes/:id', async (req, res) => {
    try {
      const success = await dbService.deleteRoute(req.params.id);
      return res.json({ success, message: 'Roteiro excluído com sucesso!' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Events API (Eventos) - Centralizado via dbService
  app.get('/api/events', async (req, res) => {
    try {
      const status = req.query.status as string;
      const events = await dbService.getEvents(status);
      return res.json({ success: true, events });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message, events: [] });
    }
  });

  app.post('/api/events', async (req, res) => {
    try {
      const savedEvent = await dbService.saveEvent(req.body);
      return res.json({ 
        success: true, 
        message: 'Evento registrado com sucesso no banco MySQL!', 
        event: savedEvent 
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.put('/api/events/:id/status', async (req, res) => {
    try {
      const { status, rejectionReason } = req.body;
      const success = await dbService.updateEventStatus(req.params.id, status, rejectionReason);
      return res.json({ success, message: 'Status do evento atualizado com sucesso!' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/events/:id', async (req, res) => {
    try {
      const success = await dbService.deleteEvent(req.params.id);
      return res.json({ success, message: 'Evento excluído com sucesso!' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Partners API (Parceiros) - Centralizado via dbService
  app.get('/api/partners', async (req, res) => {
    try {
      const status = req.query.status as string;
      const partners = await dbService.getPartners(status);
      return res.json({ success: true, partners });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message, partners: [] });
    }
  });

  app.post('/api/partners', async (req, res) => {
    try {
      const savedPartner = await dbService.savePartner(req.body);
      return res.json({ 
        success: true, 
        message: 'Parceiro registrado com sucesso no banco MySQL!', 
        partner: savedPartner 
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.put('/api/partners/:id/status', async (req, res) => {
    try {
      const { status } = req.body;
      const success = await dbService.updatePartnerStatus(req.params.id, status);
      return res.json({ success, message: 'Status do parceiro atualizado com sucesso!' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/partners/:id', async (req, res) => {
    try {
      const success = await dbService.deletePartner(req.params.id);
      return res.json({ success, message: 'Parceiro excluído com sucesso!' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Community Posts API (Mural da Comunidade) - Centralizado via dbService
  app.get('/api/community/posts', async (req, res) => {
    try {
      const status = req.query.status as string;
      const posts = await dbService.getCommunityPosts(status);
      return res.json({ success: true, posts });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message, posts: [] });
    }
  });

  app.post('/api/community/posts', async (req, res) => {
    try {
      const savedPost = await dbService.saveCommunityPost(req.body);
      return res.json({ 
        success: true, 
        message: 'Publicação registrada com sucesso no banco MySQL!', 
        post: savedPost 
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/community/posts/:id/like', async (req, res) => {
    try {
      const likes = await dbService.likeCommunityPost(req.params.id);
      return res.json({ success: true, likes });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.put('/api/community/posts/:id/status', async (req, res) => {
    try {
      const { status, rejectionReason } = req.body;
      const success = await dbService.updatePostStatus(req.params.id, status, rejectionReason);
      return res.json({ success, message: 'Status da publicação atualizado!' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/community/posts/:id', async (req, res) => {
    try {
      const success = await dbService.deleteCommunityPost(req.params.id);
      return res.json({ success, message: 'Publicação excluída com sucesso!' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Motoclubes API (Clubs) - Centralizado via dbService
  app.get('/api/clubs', async (req, res) => {
    try {
      const clubs = await dbService.getClubs();
      return res.json({ success: true, clubs });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message, clubs: [] });
    }
  });

  app.post('/api/clubs', async (req, res) => {
    try {
      const savedClub = await dbService.saveClub(req.body);
      return res.json({ 
        success: true, 
        message: 'Motoclube registrado com sucesso no banco MySQL!', 
        club: savedClub 
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
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
