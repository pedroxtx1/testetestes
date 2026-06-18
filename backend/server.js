import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";

import { createClient } from '@supabase/supabase-js'

// Carrega variáveis de ambiente antes de acessar process.env.
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables missing (SUPABASE_URL / SUPABASE_ANON_KEY).')
}

const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null

const app = express();

// Validação explícita para evitar 401/erros “cripticos” vindos da API externa.
const openRouterApiKey = process.env.OPENROUTER_API_KEY;
if (!openRouterApiKey) {
  console.warn('OPENROUTER_API_KEY não configurada no ambiente. As requisições para IA vão falhar.');
}

app.use(cors());
app.use(express.json());

app.post("/chat", async (req, res) => {

  console.log("Pergunta recebida:", req.body);

  try {

    const { message, healthSummary, session_id } = req.body;

    if (!session_id) {
      return res.status(400).json({ error: 'session_id é obrigatório' });
    }

    let msgs = []

    if (supabase) {
      const { data: history } = await supabase
        .from('chat_messages')
        .select('role, content')
        .eq('session_id', session_id)
        .order('created_at', { ascending: true })
        .limit(20)

      msgs = (history || []).map((m) => ({ role: m.role, content: m.content }))
    }

    const prompt = `
Você é Fernanda, assistente virtual do aplicativo SaudeMais.

Dados do usuário:
- IMC: ${healthSummary?.bmi}
- Objetivo nutricional: ${healthSummary?.dietFocus}
- Meta de calorias: ${healthSummary?.calories}

Histórico da conversa (contexto):
${msgs
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n')}

Pergunta atual:
${message}

Responda de forma amigável, humana e útil.
`;

    if (supabase) {
      await supabase.from('chat_messages').insert({
        session_id,
        role: 'user',
        content: message,
      });
    }

    const payloadMessages = [
      {
        role: "system",
        content: "Você é Fernanda, assistente virtual de nutrição do app MaisSaúde. Seja consistente com o histórico da conversa do usuário e faça perguntas de esclarecimento quando necessário.",
      },
      ...msgs.map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })),
      { role: "user", content: message },
    ];

    // Log mascarado para debug de autenticação (não revela a chave inteira).
    const maskedKey = openRouterApiKey.length <= 10
      ? "***"
      : `${openRouterApiKey.slice(0, 5)}***${openRouterApiKey.slice(-4)}`;
    console.log("OPENROUTER_API_KEY (mascarada):", maskedKey);

    if (!openRouterApiKey) {
      return res.status(500).json({
        error: "OPENROUTER_API_KEY não configurada no ambiente.",
      });
    }

    // Nota: modelo pode impactar respostas 4xx dependendo da conta/permissão.
    const model = process.env.OPENROUTER_MODEL || "openai/gpt-3.5-turbo";

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model,
        messages: payloadMessages,
      },
      {
        headers: {
          Authorization: `Bearer ${openRouterApiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const reply =
      response.data.choices[0].message.content;

    console.log("Resposta IA:", reply);

    if (supabase) {
      await supabase.from('chat_messages').insert({
        session_id,
        role: 'assistant',
        content: reply,
      });
    }

    res.json({
      reply,
    });

  } catch (error) {

    console.error("ERRO IA:", error.response?.data || error);

    res.status(500).json({
      error: "Erro ao gerar resposta",
    });
  }
});

app.listen(3000, () => {
  console.log("Servidor rodando na porta 3000");
});
