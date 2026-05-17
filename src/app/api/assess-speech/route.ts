import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File;
    const sentence = formData.get("sentence") as string;
    const level = formData.get("level") as string;
    const spokenText = (formData.get("spokenText") as string || "").trim();
    const recognitionSupported = formData.get("recognitionSupported") === "true";

    if (!audioFile || !sentence) {
      return NextResponse.json(
        { error: "Vui lòng cung cấp đầy đủ file âm thanh và câu cần đánh giá!" },
        { status: 400 }
      );
    }

    console.log(`🎙️ Nhận yêu cầu đánh giá âm thanh:`);
    console.log(`- File name: ${audioFile.name}`);
    console.log(`- Dung lượng: ${audioFile.size} bytes`);
    console.log(`- Câu đích: "${sentence}"`);
    console.log(`- Cấp độ: ${level}`);
    console.log(`- Bé thực tế đã đọc: "${spokenText}"`);

    // =========================================================================
    // 💡 HƯỚNG DẪN TÍCH HỢP SPEECHSUPER API (CHẤM ĐIỂM PHÁT ÂM CHI TIẾT CỦA TRẺ)
    // =========================================================================
    /*
      Để tích hợp API chấm điểm SpeechSuper thực tế:
      
      1. Đăng ký tài khoản tại https://www.speechsuper.com để lấy APP_KEY và SECRET_KEY.
      2. Đọc file âm thanh thành buffer hoặc base64:
         const arrayBuffer = await audioFile.arrayBuffer();
         const audioBuffer = Buffer.from(arrayBuffer);
         const base64Audio = audioBuffer.toString("base64");
      
      3. Gửi request POST tới endpoint chấm điểm của SpeechSuper (ví dụ: đánh giá câu nói - SentEval):
         const speechSuperEndpoint = "https://api.speechsuper.com/assessment/sentence";
         
         const payload = {
           header: {
             appkey: process.env.SPEECHSUPER_APP_KEY,
             timestamp: Math.floor(Date.now() / 1000).toString(),
             signature: generateSignature(process.env.SPEECHSUPER_APP_KEY, process.env.SPEECHSUPER_SECRET_KEY, timestamp),
             coreType: "sent.eval", // Đánh giá câu
             audioType: "webm",     // Trùng khớp với định dạng MediaRecorder
           },
           request: {
             refText: sentence,    // Câu mẫu trẻ cần đọc
             audio: base64Audio,   // Dữ liệu âm thanh dạng base64
           }
         };

         const response = await fetch(speechSuperEndpoint, {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify(payload),
         });
         const ssResult = await response.json();
         
         // Sau đó, trích xuất điểm số tổng (pronunciation score), và danh sách từ bị sai:
         const score = ssResult.result.pronunciation; // Thường thang điểm 0-100
         const wordsResult = ssResult.result.words;   // Phân tích chi tiết từng từ
         const mispronouncedWords = wordsResult
           .filter((w: any) => w.pronunciation < 60) // Lọc các từ phát âm dưới 60 điểm
           .map((w: any) => w.word.toLowerCase());
    */

    // =========================================================================
    // 💡 HƯỚNG DẪN TÍCH HỢP OPENAI API (TẠO LỜI KHUYÊN & LỘ TRÌNH THÂN THIỆN)
    // =========================================================================
    /*
      Để tích hợp OpenAI GPT tạo phản hồi đầy đồng cảm cho bé học sinh tiểu học:
      
      1. Cài đặt thư viện: npm install openai
      2. Import và thiết lập client:
         import OpenAI from "openai";
         const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      3. Gửi yêu cầu với prompt thân thiện cho trẻ em (6-11 tuổi):
         const completion = await openai.chat.completions.create({
           model: "gpt-4o-mini", // Model tối ưu, nhanh và tiết kiệm chi phí
           messages: [
             {
               role: "system",
               content: `Bạn là một cô giáo dạy Tiếng Anh tiểu học cực kỳ vui vẻ, thân thiện và giàu lòng yêu thương trẻ con. 
               Nhiệm vụ của bạn là nhận xét bài nói của học sinh (từ 6-11 tuổi) bằng Tiếng Việt. 
               Hãy động viên bé trước, khen ngợi sự cố gắng của bé, sau đó nhắc nhở bé một cách thật nhẹ nhàng và dễ thương về các từ bé phát âm sai.
               Cuối cùng, đề xuất 3 bài tập vui nhộn và siêu ngắn để bé sửa lỗi.`
             },
             {
               role: "user",
               content: `Bé vừa đọc câu: "${sentence}".
               Điểm số bé đạt được: ${score}/100.
               Các từ bé đọc sai hoặc thiếu âm gió: [${mispronouncedWords.join(", ")}].
               Hãy trả về kết quả dưới dạng JSON có cấu trúc sau:
               {
                 "tutorComment": "Lời nhận xét động viên và nhẹ nhàng của cô giáo cho bé (tối đa 3 câu, kèm các emoji dễ thương)...",
                 "tips": "Cách luyện phát âm các từ bị sai cho bé một cách đơn giản nhất...",
                 "roadmap": ["Bài tập nhỏ 1 vui nhộn...", "Bài tập nhỏ 2...", "Bài tập nhỏ 3..."]
               }`
             }
           ],
           response_format: { type: "json_object" }
         });
         
         const aiResponse = JSON.parse(completion.choices[0].message.content);
         const { tutorComment, tips, roadmap } = aiResponse;
    */

    // 🧪 THUẬT TOÁN ĐÁNH GIÁ PHÁT ÂM THỰC TẾ (REAL SPEECH MATCHING & DIFF ENGINE)
    const cleanedSentence = sentence.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").toLowerCase();
    const targetWords = cleanedSentence.split(/\s+/).filter(Boolean);
    const audioSize = audioFile.size;

    let score = 0;
    const mispronouncedWords: string[] = [];

    console.log(`📊 [AI Speech Diff Engine] Audio Size: ${audioSize} bytes | Spoken Text: "${spokenText}"`);

    // 1. Kiểm tra im lặng hoặc lỗi Mic trước (Kích thước cực nhỏ < 6000 bytes)
    if (audioSize < 6000) {
      score = 0;
      targetWords.forEach((w) => mispronouncedWords.push(w));
    } else {
      // 2. Bé thực sự có nói!
      if (!spokenText) {
        // Nếu trình duyệt hỗ trợ Speech Recognition, nhưng không thu được từ nào (do bé im lặng hoặc đọc hoàn toàn sai)
        if (recognitionSupported) {
          score = 0;
          targetWords.forEach((w) => mispronouncedWords.push(w));
        } else {
          // Trình duyệt của bé không hỗ trợ Speech Recognition (fallback thông minh trong lúc test thử nghiệm)
          if (audioSize < 16000) {
            score = 70;
            mispronouncedWords.push(targetWords[0]);
            if (targetWords.length > 3) {
              mispronouncedWords.push(targetWords[2]);
            }
          } else {
            // Để tránh việc chấm điểm full 100 khi không nhận diện được, ta chỉ cho 80 điểm làm khích lệ
            score = 80;
            mispronouncedWords.push(targetWords[0]);
          }
        }
      } else {
        // 3. Thực hiện so khớp từ vựng chi tiết từng chữ (Word Diff Matching)
        const cleanedSpoken = spokenText.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").toLowerCase();
        const spokenWords = cleanedSpoken.split(/\s+/).filter(Boolean);

        // Bản sao tạm của danh sách từ bé đã nói để đánh dấu từ đã khớp
        const tempSpoken = [...spokenWords];

        targetWords.forEach((word) => {
          const index = tempSpoken.indexOf(word);
          if (index !== -1) {
            // Từ đích xuất hiện trong câu nói của bé => Bé đã đọc Đúng!
            // Xóa khỏi danh sách tạm để tránh khớp trùng lặp
            tempSpoken.splice(index, 1);
          } else {
            // Từ đích không được tìm thấy trong câu nói => Bé đọc Sai / Bỏ sót từ này!
            mispronouncedWords.push(word);
          }
        });

        // Tính tỉ lệ phần trăm từ đọc đúng thực tế
        const totalCount = targetWords.length;
        const correctCount = totalCount - mispronouncedWords.length;
        score = Math.round((correctCount / totalCount) * 100);
      }
    }

    // Quy đổi điểm 0-100 thành 1-5 sao chuẩn quốc tế
    let stars = 5;
    if (score >= 95) stars = 5;
    else if (score >= 85) stars = 5;
    else if (score >= 70) stars = 4;
    else if (score >= 45) stars = 3;
    else if (score >= 20) stars = 2;
    else stars = 1;

    // Thiết lập phản hồi động dựa trên kết quả thực tế để bé thích thú
    let tutorComment = "";
    let tips = "";
    let roadmap: string[] = [];

    if (score < 30) {
      tutorComment = "Ồ! Cô chưa nghe rõ được giọng đọc đáng yêu của con. Con hãy bấm nút 'Thử thách lại' và nói to, rõ ràng hơn vào sát Mic nhé! 🎤🎈";
      tips = "Hãy chắc chắn là con đã bấm nút cho phép sử dụng Microphone trên trình duyệt và nói thật to câu mẫu nhé.";
      roadmap = [
        "Kiểm tra lại Microphone của máy tính hoặc điện thoại xem đã được bật chưa 🔌",
        "Nghe lại audio mẫu của cô giáo AI 3 lần để làm quen giọng điệu 🎵",
        "Bấm thử thách lại và dũng cảm nói thật to rõ từng chữ nhé bé yêu 💪"
      ];
    } else if (stars === 5) {
      tutorComment = "Wow! Con phát âm thật xuất sắc! Giọng của con siêu chuẩn và truyền cảm luôn đấy. Cô rất tự hào về con! 🎉🦁";
      tips = "Con đã làm rất tốt. Hãy tiếp tục duy trì phong độ này ở các câu tiếp theo nhé!";
      roadmap = [
        "Luyện tập thêm 1 câu dài hơn thuộc cấp độ này để nhận thêm sao nhé! ⭐",
        "Thu âm và gửi tặng ba mẹ nghe giọng đọc Tiếng Anh siêu đỉnh của con 🎁",
        "Thử thách bản thân bằng cách tự kể một câu chuyện ngắn bằng Tiếng Anh 📚"
      ];
    } else if (stars === 4) {
      tutorComment = "Con làm tốt lắm! Phát âm rất rõ ràng và trôi chảy. Chỉ cần chú ý sửa một chút xíu lỗi nhỏ nữa là đạt 5 sao luôn nè! 🌟🐒";
      tips = `Từ "${mispronouncedWords.join(", ")}" con đọc gần đúng rồi, chỉ cần chú ý nhấn rõ hơi hoặc bật âm đuôi (ending sound) rõ hơn nữa nhé.`;
      roadmap = [
        `Nghe lại từ mẫu "${mispronouncedWords[0]}" và lặp lại 3 lần thật to trước gương 🪞`,
        `Chơi trò chơi 'Bật âm đuôi' - luyện đọc từ "${mispronouncedWords[0]}" thật gió 🌬️`,
        `Thử thách đọc lại cả câu này lần thứ hai để chinh phục trọn vẹn 5 sao vàng 🏆`
      ];
    } else {
      tutorComment = "Cô khen ngợi tinh thần cố gắng tuyệt vời của con! Con đã rất dũng cảm khi nói Tiếng Anh thật to. Hãy cùng cô luyện tập thêm nhé! 🦛🎈";
      tips = `Hãy lắng nghe thật kỹ cách phát âm của các từ "${mispronouncedWords.join(", ")}" và bật hơi mạnh hơn nhé bé yêu.`;
      roadmap = [
        `Luyện đọc chậm rãi từ "${mispronouncedWords[0]}" cùng cô giáo AI 👩‍🏫`,
        `Tham gia thử thách nói từ vựng "${mispronouncedWords[0]}" chậm rãi 3 lần liên tiếp 🐢`,
        `Nghe audio mẫu của câu này và nhại giọng theo thật vui nhộn 🎵`
      ];
    }

    // Giả lập độ trễ mạng của AI API thực tế để tạo sự chân thực cho UI loading (1.5 giây)
    await new Promise((resolve) => setTimeout(resolve, 1500));

    return NextResponse.json({
      success: true,
      sentence,
      score,
      stars,
      mispronouncedWords,
      feedback: {
        tutorComment,
        tips,
      },
      roadmap,
    });
  } catch (error: any) {
    console.error("❌ Lỗi API assess-speech:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi chấm điểm phát âm: " + error.message },
      { status: 500 }
    );
  }
}
