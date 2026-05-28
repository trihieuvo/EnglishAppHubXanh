import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const mistral = new OpenAI({
  apiKey: process.env.MISTRAL_API_KEY,
  baseURL: "https://api.mistral.ai/v1",
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File | null;
    const textInput = formData.get("text") as string | null;
    const stage = formData.get("stage") as string;
    const chatHistoryRaw = formData.get("chatHistory") as string || "[]";
    const contextRaw = formData.get("context") as string || "{}";

    const chatHistory = JSON.parse(chatHistoryRaw);
    const context = JSON.parse(contextRaw);

    let transcribedText = textInput || "";

    // 1. Transcribe audio if provided
    if (audioFile && audioFile.size > 0) {
      const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
      const file = new File([audioBuffer], "audio.webm", { type: "audio/webm" });
      
      const transcription = await groq.audio.transcriptions.create({
        model: "whisper-large-v3",
        file: file,
        language: "en",
      });
      transcribedText = (transcription.text || "").trim();
      console.log(`📝 [Groq Whisper] Transcribed text: "${transcribedText}"`);
    }

    if (!transcribedText && chatHistory.length > 0) {
      return NextResponse.json({ error: "Không nhận diện được giọng nói." }, { status: 400 });
    }

    // 2. Prepare System Prompt based on Stage
    let systemPrompt = `Bạn là giám khảo Tiếng Anh thiếu nhi (Cambridge YLE examiner) cực kỳ thân thiện, vui vẻ. 
Luôn phản hồi bằng tiếng Anh thật đơn giản, ngắn gọn (1-2 câu), phù hợp với trẻ em 6-10 tuổi.
Dùng nhiều emoji đáng yêu. 
BẮT BUỘC TRẢ VỀ JSON với định dạng: { "aiResponse": "câu trả lời của bạn", "stageComplete": boolean }`;

    let readingAccuracy = 100;
    if (stage === "reading" && transcribedText) {
      const referenceStory = context.referenceStory || "Max is a happy little monkey who lives in a very tall coconut tree in the jungle. He loves to eat sweet yellow bananas every morning. Today, Max looks down and sees a small green frog sitting on a leaf in the pond. The frog is jumping up and down and singing a funny song. Max waves hello and laughs happily!";
      const storyWords = referenceStory.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").split(/\s+/).filter(Boolean);
      const spokenWords = transcribedText.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").split(/\s+/).filter(Boolean);
      
      let matchedCount = 0;
      const tempSpoken = [...spokenWords];
      storyWords.forEach((word: string) => {
        const index = tempSpoken.indexOf(word);
        if (index !== -1) {
          matchedCount++;
          tempSpoken.splice(index, 1);
        }
      });
      readingAccuracy = Math.round((matchedCount / storyWords.length) * 100);
      console.log(`🎯 [Reading Accuracy] Matched ${matchedCount}/${storyWords.length} words. Accuracy: ${readingAccuracy}%`);
    }

    if (stage === "warmup") {
      const aiMessageCount = chatHistory.filter((m: any) => m.role === "ai").length;
      
      if (aiMessageCount === 0) {
        systemPrompt += `
Nhiệm vụ: Bé vừa trả lời Tên của mình. 
Hãy chào đón bé nồng nhiệt, khen ngợi và hỏi bé câu tiếp theo: "How old are you?"
BẮT BUỘC set "stageComplete": false.`;
      } else if (aiMessageCount === 1) {
        systemPrompt += `
Nhiệm vụ: Bé vừa trả lời Tuổi của mình.
Hãy khen bé và hỏi câu tiếp theo: "What is your favorite animal?"
BẮT BUỘC set "stageComplete": false.`;
      } else {
        systemPrompt += `
Nhiệm vụ: KẾT THÚC phần Warm-up & Speaking.
BẠN BẮT BUỘC PHẢI TRẢ VỀ CHÍNH XÁC CÂU NÀY TRONG "aiResponse": "Great job! Let's look at a picture now. Are you ready?"
VÀ BẮT BUỘC set "stageComplete": true. KHÔNG ĐƯỢC HỎI THÊM BẤT KỲ CÂU NÀO KHÁC.`;
      }
    } else if (stage === "picture") {
      const aiMessageCount = chatHistory.filter((m: any) => m.role === "ai").length;
      const keywords = context.expectedKeywords ? context.expectedKeywords.join(", ") : "";
      const pictureIndex = context.pictureIndex || 0;
      
      if (aiMessageCount >= 2) {
         if (pictureIndex === 0) {
           systemPrompt += `
Nhiệm vụ: KẾT THÚC phần Miêu tả bức tranh THỨ NHẤT.
BẠN BẮT BUỘC PHẢI TRẢ VỀ CHÍNH XÁC CÂU NÀY TRONG "aiResponse": "Great job with the first picture! Now let's look at a second picture. Are you ready?"
VÀ BẮT BUỘC set "stageComplete": true.`;
         } else {
           systemPrompt += `
Nhiệm vụ: KẾT THÚC phần Miêu tả bức tranh THỨ HAI (hoàn thành Stage 2).
BẠN BẮT BUỘC PHẢI TRẢ VỀ CHÍNH XÁC CÂU NÀY TRONG "aiResponse": "Excellent! You did a great job with both pictures. Now, let's read a short story together. Are you ready?"
VÀ BẮT BUỘC set "stageComplete": true.`;
         }
      } else {
         systemPrompt += `
Nhiệm vụ: Miêu tả tranh (Picture Description) cho Bức Tranh Thứ ${pictureIndex === 0 ? "Nhất" : "Hai"}.
Học sinh đang nhìn một bức tranh có các từ khóa cần nói: [${keywords}].
Hãy kiểm tra xem học sinh đã nói được các từ khóa nào chưa. Khen ngợi học sinh.
Nếu còn từ khóa chưa nói, hãy đặt 1 câu hỏi gợi ý thật đơn giản để bé nói ra từ đó (ví dụ: "What is this?" hoặc "What is it doing?").
BẮT BUỘC set "stageComplete": false.`;
      }
    } else if (stage === "reading") {
      systemPrompt += `
Nhiệm vụ: Nhận xét bài đọc thành tiếng của học sinh (Reading Aloud).
Học sinh vừa đọc xong câu chuyện ngắn. 
Hãy khen ngợi sự cố gắng của bé và khích lệ bé cực kỳ nồng nhiệt.
BẠN BẮT BUỘC PHẢI TRẢ VỀ CHÍNH XÁC CÂU NÀY TRONG "aiResponse": "Fantastic reading! You read the story beautifully. Let's answer a quick question about it now!"
VÀ BẮT BUỘC set "stageComplete": true.`;
    } else {
      // Default / End
      systemPrompt += `
Nhiệm vụ: Khen ngợi và kết thúc bài test.
Hãy nói: "You did amazingly well today! Goodbye and see you next time!" và set "stageComplete": true.`;
    }

    const messages: any[] = [
      { role: "system", content: systemPrompt },
    ];

    if (chatHistory && chatHistory.length > 0) {
      chatHistory.forEach((msg: any) => {
        messages.push({
          role: msg.role === "ai" ? "assistant" : "user",
          content: msg.content
        });
      });
    }

    if (!transcribedText && chatHistory.length === 0) {
      messages.push({
        role: "user",
        content: "Bé vừa bước vào phòng thi. Hãy chào bé và hỏi tên bé nhé."
      });
    } else if (transcribedText) {
      messages.push({
        role: "user",
        content: transcribedText
      });
    }

    console.log("🤖 [Mistral AI] Đang sinh phản hồi...");
    const completion = await mistral.chat.completions.create({
      model: "mistral-small-latest",
      messages: messages as any,
      response_format: { type: "json_object" },
      max_tokens: 200,
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error("Mistral trả về response rỗng");
    }

    const parsed = JSON.parse(content);
    
    return NextResponse.json({
      success: true,
      transcribedText,
      aiResponse: parsed.aiResponse,
      stageComplete: parsed.stageComplete,
      readingAccuracy: stage === "reading" ? readingAccuracy : undefined,
    });

  } catch (error: any) {
    console.error("❌ Lỗi API interactive-chat:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi: " + error.message },
      { status: 500 }
    );
  }
}
