import OpenAI from "openai";
import { IAdaptiveSession } from "@/models/AdaptiveSession";

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const mistral = new OpenAI({
  apiKey: process.env.MISTRAL_API_KEY,
  baseURL: "https://api.mistral.ai/v1",
});

export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  const file = new File([new Uint8Array(audioBuffer)], "audio.webm", { type: "audio/webm" });
  const transcription = await groq.audio.transcriptions.create({
    model: "whisper-large-v3",
    file: file,
    language: "en",
  });
  return (transcription.text || "").trim();
}

export async function gradeWriting(
  prompt: string,
  userAnswer: string,
  level: string
): Promise<{ score: number; isCorrect: boolean }> {
  try {
    const completion = await mistral.chat.completions.create({
      model: "mistral-small-latest",
      messages: [
        {
          role: "system",
          content: `You are an English grader for kids.
Target sentence: "${prompt}"
User wrote: "${userAnswer}"
Return JSON with 'score' (0-100) and 'isCorrect' (true if score > 75). Only output JSON: {"score": 90, "isCorrect": true}`,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 100,
    });
    
    const content = completion.choices[0].message.content || "{}";
    const parsed = JSON.parse(content);
    return {
      score: Number(parsed.score) || 0,
      isCorrect: Boolean(parsed.isCorrect),
    };
  } catch (err) {
    const cleanUser = userAnswer.toLowerCase().replace(/[^a-z]/g, "");
    const cleanPrompt = prompt.toLowerCase().replace(/[^a-z]/g, "");
    const score = cleanUser === cleanPrompt ? 100 : (cleanUser.length > 3 ? 50 : 0);
    return { score, isCorrect: score > 75 };
  }
}

export async function generateParentRecommendation(sessionData: Partial<IAdaptiveSession>): Promise<string> {
  try {
    const completion = await mistral.chat.completions.create({
      model: "mistral-small-latest",
      messages: [
        {
          role: "system",
          content: `Bạn là chuyên gia giáo dục phân tích kết quả bài test Tiếng Anh của bé. 
Dữ liệu phiên thi:
- Điểm trung bình tổng: ${sessionData.finalScores?.overall || 0}/100
- Cấp độ xác định: ${sessionData.finalLevel}
- Từ vựng: ${sessionData.finalScores?.vocabulary || 0}
- Ngữ pháp: ${sessionData.finalScores?.grammar || 0}
- Luyện nói: ${sessionData.finalScores?.pronunciation || 0}
- Luyện nghe: ${sessionData.finalScores?.fluency || 0}

Hãy viết 1 đoạn văn (khoảng 4-5 câu) nhận xét dành cho phụ huynh bằng Tiếng Việt.
Khen ngợi điểm mạnh, chỉ ra điểm cần cải thiện, và đề xuất cách học tiếp theo.
Dùng emoji thân thiện. Output json: {"recommendation": "..."}`,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 400,
    });
    
    const content = completion.choices[0].message.content || "{}";
    const parsed = JSON.parse(content);
    return parsed.recommendation || "Bé đã hoàn thành xuất sắc bài kiểm tra năng lực! 🎉";
  } catch (err) {
    return "Bé đã có cố gắng rất nhiều trong bài kiểm tra hôm nay. Ba mẹ hãy tiếp tục động viên bé nhé! 🌟";
  }
}
