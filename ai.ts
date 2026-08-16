import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
  maxRetries: 0,
});

const MODEL = "llama-3.1-8b-instant";

export async function askAI(message: string): Promise<string> {
  const response = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content:
          "あなたはDiscordの雑談Botです。" +
          "ユーザーと自然に日本語で雑談してください。" +
          "回答は短めにしてください。" +
          "ユーザー側の発言と同じような口調で返答してください。" ,
      },
      {
        role: "user",
        content: message,
      },
    ],
    max_tokens: 1000,
    temperature: 0.8,
  });

  const answer =
    response.choices[0]?.message?.content?.trim() ??
    "うまく返答できませんでした。";

  return answer.slice(0, 2000
  );
}