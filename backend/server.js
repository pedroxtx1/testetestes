import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";

import { createClient } from '@supabase/supabase-js'

// Carrega variÃ¡veis de ambiente antes de acessar process.env.
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables missing (SUPABASE_URL / SUPABASE_ANON_KEY).')
}

const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null

const app = express();

// ValidaÃ§Ã£o explÃ­cita para evitar 401/erros â€œcripticosâ€ vindos da API externa.
const openRouterApiKey = process.env.OPENROUTER_API_KEY;
if (!openRouterApiKey) {
  console.warn('OPENROUTER_API_KEY nÃ£o configurada no ambiente. As requisiÃ§Ãµes para IA vÃ£o falhar.');
}

app.use(cors());
app.use(express.json());

app.post("/chat", async (req, res) => {

  console.log("Pergunta recebida:", req.body);

  try {

    const { message, healthSummary, session_id, clientHistory, userProfile, profile } = req.body;

    if (!session_id) {
      return res.status(400).json({ error: 'session_id e obrigatorio' });
    }

    const profileData = userProfile || profile || {};
    const goalLabels = {
      perda_peso: 'perder peso',
      ganho_massa: 'ganhar massa muscular',
      manutencao: 'manter o peso e melhorar saude',
    };
    const activityLabels = {
      sedentario: 'sedentario',
      'sedentário': 'sedentario',
      nao_informado: 'nao informado',
      leve: 'atividade leve',
      moderado: 'atividade moderada',
      intenso: 'atividade intensa',
      muito_intenso: 'atividade muito intensa',
    };

    const userName = profileData?.name || 'usuario';
    const userAge = profileData?.age ?? 'nao informado';
    const userSex = profileData?.sex || profileData?.gender || 'nao informado';
    const userWeight = profileData?.weightKg ?? profileData?.weight ?? 'nao informado';
    const userHeight = profileData?.heightCm ?? profileData?.height ?? 'nao informado';
    const userGoal = goalLabels[profileData?.goal] || profileData?.goal || healthSummary?.dietFocus || 'nao informado';
    const rawActivity = profileData?.activityLevel || profileData?.activity_level;
    const normalizedActivity = typeof rawActivity === 'string' ? rawActivity.trim().toLowerCase() : rawActivity;
    const userActivity = activityLabels[normalizedActivity] || rawActivity || 'nao informado';

    let msgs = [];

    if (supabase) {
      const { data: history, error: historyError } = await supabase
        .from('chat_messages')
        .select('role, content, created_at')
        .eq('session_id', session_id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (historyError) {
        console.error('Erro ao buscar historico:', historyError);
      }

      msgs = (history || [])
        .reverse()
        .map((m) => ({ role: m.role, content: m.content }));
    }

    if (msgs.length === 0 && Array.isArray(clientHistory)) {
      msgs = clientHistory
        .filter((m) => ['user', 'assistant'].includes(m?.role) && typeof m?.content === 'string')
        .slice(-20)
        .map((m) => ({ role: m.role, content: m.content }));
    }

    console.log('SESSION:', session_id);
    console.log('HISTORICO ENCONTRADO:', msgs.length);
    console.log('NIVEL DE ATIVIDADE ENVIADO PARA IA:', userActivity);
    console.log('MSGS:', msgs);

    if (supabase) {
      const { error: insertUserError } = await supabase.from('chat_messages').insert({
        session_id,
        role: 'user',
        content: message,
      });

      if (insertUserError) {
        console.error('Erro ao salvar mensagem do usuario:', insertUserError);
      }
    }

    const payloadMessages = [
      {
        role: 'system',
        content: `
Voce e Fernanda, assistente virtual de nutricao, habitos saudaveis e treino do aplicativo Mais Saude.

IMPORTANTE:

- Chame o usuario pelo nome quando fizer sentido, sem exagerar.
- Use os dados do perfil para personalizar respostas de alimentacao, calorias, agua, rotina, treino e exercicios.
- Mantenha continuidade com a conversa anterior.
- Use o historico para entender perguntas curtas, incompletas ou com referencia implicita.
- Se o usuario perguntar algo como "quantas calorias tem?", "quantas proteinas tem?", "e esse?", "qual sabor?" ou "repete", entenda que ele esta falando do ultimo alimento, receita, treino ou assunto mencionado na conversa.
- Se a ultima resposta trouxe uma receita, e o usuario perguntar sobre nutrientes, estime os nutrientes dessa receita usando os ingredientes informados.
- Nao troque o assunto para metas diarias do usuario quando a pergunta for sobre a receita ou alimento citado antes.
- Voce tambem pode sugerir treinos, exercicios, series, repeticoes, descanso e progressao semanal de forma segura e iniciante/intermediaria.
- Ao sugerir treino, considere objetivo, peso, altura, idade, sexo, nivel de atividade, IMC e meta calorica.
- Nunca invente ou ajuste o nivel de atividade. Use exatamente o valor informado em "Nivel de atividade". Se estiver sedentario, diga sedentario. Se estiver "nao informado", diga que o nivel de atividade nao foi encontrado no perfil e peca para o usuario atualizar esse campo.
- Para perda de peso, priorize consistencia, caminhada/cardio moderado, treino de forca e deficit calorico leve.
- Para ganho de massa, priorize treino de forca, progressao de carga, proteina adequada e descanso.
- Para manutencao, priorize equilibrio, mobilidade, forca, cardio e regularidade.
- Nao prescreva tratamento medico, diagnostico, remedios, dietas extremas ou treinos perigosos.
- Se houver dor, lesao, doenca, gravidez, tontura ou sintomas fortes, recomende procurar profissional de saude.
- Se voce fez uma pergunta e o usuario respondeu, use essa resposta.
- Nao reinicie o assunto sem necessidade.
- Nao faca perguntas repetidas.
- Responda em portugues brasileiro, de forma amigavel, humana, pratica e util.

Dados do perfil do usuario:

Nome: ${userName}
Idade: ${userAge}
Sexo/genero: ${userSex}
Peso: ${userWeight} kg
Altura: ${userHeight} cm
Objetivo do cadastro: ${userGoal}
Nivel de atividade: ${userActivity}

Dados calculados pelo app:

IMC: ${healthSummary?.bmi ?? 'nao informado'} (${healthSummary?.bmiLabel ?? 'sem classificacao'})
Peso ideal estimado: ${healthSummary?.idealWeightKg ?? 'nao informado'} kg
Agua recomendada: ${healthSummary?.waterLiters ?? 'nao informado'} L/dia
Calorias recomendadas: ${healthSummary?.calories ?? 'nao informada'} kcal/dia
Foco nutricional: ${healthSummary?.dietFocus ?? 'nao informado'}
`,
      },
      ...msgs,
      {
        role: 'user',
        content: message,
      },
    ];

    // Log mascarado para debug de autenticaÃ§Ã£o (nÃ£o revela a chave inteira).
    const maskedKey = openRouterApiKey.length <= 10
      ? "***"
      : `${openRouterApiKey.slice(0, 5)}***${openRouterApiKey.slice(-4)}`;
    console.log("OPENROUTER_API_KEY (mascarada):", maskedKey);

    if (!openRouterApiKey) {
      return res.status(500).json({
        error: "OPENROUTER_API_KEY nÃ£o configurada no ambiente.",
      });
    }

    // Nota: modelo pode impactar respostas 4xx dependendo da conta/permissÃ£o.
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
      const { error: insertAssistantError } = await supabase.from('chat_messages').insert({
        session_id,
        role: 'assistant',
        content: reply,
      });

      if (insertAssistantError) {
        console.error('Erro ao salvar resposta da IA:', insertAssistantError);
      }
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





