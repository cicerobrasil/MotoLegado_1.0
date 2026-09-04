import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

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

  app.get('/api/payments/config', (req, res) => {
    res.json({
      publicKey: MP_PUBLIC_KEY,
      configured: Boolean(MP_ACCESS_TOKEN)
    });
  });

  // Create PIX Payment directly with Mercado Pago API
  app.post('/api/payments/create-pix', async (req, res) => {
    try {
      const { plan, email, name, userId } = req.body;
      const amount = plan === 'yearly' ? 299.00 : 29.90;
      const description = `MotoLegado VIP Pro - Plano ${plan === 'yearly' ? 'Anual' : 'Mensal'}`;

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
        console.error('Erro na API do Mercado Pago ao criar PIX:', data);
        return res.status(mpResponse.status).json({
          error: data.message || 'Falha ao gerar cobrança PIX no Mercado Pago',
          details: data
        });
      }

      const qrCode = data.point_of_interaction?.transaction_data?.qr_code;
      const qrCodeBase64 = data.point_of_interaction?.transaction_data?.qr_code_base64;
      const ticketUrl = data.point_of_interaction?.transaction_data?.ticket_url;

      res.json({
        paymentId: data.id,
        status: data.status,
        qrCode: qrCode,
        qrCodeBase64: qrCodeBase64,
        ticketUrl: ticketUrl,
        amount: data.transaction_amount,
        expiresAt: data.date_of_expiration
      });
    } catch (err: any) {
      console.error('Erro no endpoint create-pix:', err);
      res.status(500).json({ error: 'Erro interno ao processar pagamento.', details: err?.message || String(err) });
    }
  });

  // Query payment status directly from Mercado Pago
  app.get('/api/payments/status/:id', async (req, res) => {
    try {
      const { id } = req.params;
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

  // Vite middleware for development or static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
