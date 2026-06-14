import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.post("/chat", async (req, res) => {

  console.log("Pergunta recebida:", req.body);

  try {

    const { message, healthSummary } = req.body;

    const prompt = `
Você é Fernanda, assistente virtual do aplicativo SaudeMais.

Dados do usuário:
- IMC: ${healthSummary?.bmi}
- Objetivo nutricional: ${healthSummary?.dietFocus}
- Meta de calorias: ${healthSummary?.calories}

Pergunta:
${message}

Responda de forma amigável, humana e útil.
`;

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const reply =
      response.data.choices[0].message.content;

    console.log("Resposta IA:", reply);

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
