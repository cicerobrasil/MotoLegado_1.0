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
