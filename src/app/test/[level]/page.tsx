"use client";

import React, { useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Volume2, Sparkles, AlertCircle, HelpCircle } from "lucide-react";
import AudioRecorder from "@/components/AudioRecorder";

interface TestPageProps {
  params: Promise<{ level: string }>;
}

export default function TestPage({ params }: TestPageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const rawLevel = resolvedParams.level;

  // Normalize level name
  const level = (rawLevel.charAt(0).toUpperCase() + rawLevel.slice(1).toLowerCase()) as "Starters" | "Movers" | "Flyers";

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [ttsPlaying, setTtsPlaying] = useState(false);

  // Content questions data tailored for Cambridge Primary Speaking Standards
  const levelPrompts = {
    Starters: {
      sentence: "The fat cat sat on the red mat.",
      animal: "🦛",
      mascot: "Hippo Dễ Thương",
      color: "from-pink-400 to-purple-400 border-pink-400",
      description: "Thử thách phanh âm ngắn CVC. Con hãy phát âm thật chuẩn âm cuối /t/ nhé!",
      illustration: "🐱🟥🛌",
      illustrationDesc: "Chú mèo béo (cat) đang ngồi trên chiếc thảm đỏ (red mat)",
    },
    Movers: {
      sentence: "Yesterday, the clever monkey washed a big round melon.",
      animal: "🐒",
      mascot: "Monkey Thông Minh",
      color: "from-amber-400 to-yellow-500 border-amber-400",
      description: "Thử thách phát âm từ ghép và đuôi quá khứ /t/ của động từ 'washed'.",
      illustration: "🐒🧼🍉",
      illustrationDesc: "Chú khỉ thông minh (clever monkey) đang rửa quả dưa hấu tròn xoe (round melon)",
    },
    Flyers: {
      sentence: "The brave flying lion flew high in the beautiful sky.",
      animal: "🦁",
      mascot: "Lion Dũng Cảm",
      color: "from-blue-400 to-sky-500 border-blue-400",
      description: "Thử thách nối âm, phụ âm kép /fl/ và ngữ điệu câu trần thuật biểu cảm.",
      illustration: "🦁☁️✈️",
      illustrationDesc: "Chú sư tử dũng cảm (brave lion) đang bay cao trên bầu trời xanh thẳm (beautiful sky)",
    },
  };

  const currentPrompt = levelPrompts[level] || levelPrompts.Starters;

  // Play sound using natural-sounding Google Translate TTS as primary, with native Web Speech as fallback
  const playTTS = () => {
    try {
      setTtsPlaying(true);
      const textToSpeak = currentPrompt.sentence;
      // Using our robust Next.js server proxy route to bypass all CORS and referer blocks
      const ttsUrl = `/api/tts?text=${encodeURIComponent(textToSpeak)}`;

      const audio = new Audio(ttsUrl);
      audio.onended = () => setTtsPlaying(false);
      audio.onerror = (e) => {
        console.warn("Lỗi phát Google TTS, chuyển sang Web Speech API:", e);
        playNativeTTS();
      };

      audio.play().catch((err) => {
        console.warn("Autoplay bị chặn, chuyển sang Web Speech API:", err);
        playNativeTTS();
      });
    } catch (e) {
      console.warn("Lỗi tạo Audio, chuyển sang Web Speech API:", e);
      playNativeTTS();
    }
  };

  const playNativeTTS = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentPrompt.sentence);
      utterance.lang = "en-US";
      utterance.rate = 0.85;
      utterance.onstart = () => setTtsPlaying(true);
      utterance.onend = () => setTtsPlaying(false);
      utterance.onerror = () => setTtsPlaying(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setTtsPlaying(false);
      alert("Trình duyệt hoặc thiết bị của con chưa hỗ trợ nghe thử rồi! 🔊");
    }
  };

  // Handle uploaded speaking voice chunk
  const handleRecordingComplete = async (audioBlob: Blob, spokenText: string, recognitionSupported: boolean) => {
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      // 1. Send speech audio to AI speech assessment API
      const gradingFormData = new FormData();
      gradingFormData.append("audio", audioBlob, "speaking_voice.webm");
      gradingFormData.append("sentence", currentPrompt.sentence);
      gradingFormData.append("level", level);
      gradingFormData.append("spokenText", spokenText || "");
      gradingFormData.append("recognitionSupported", recognitionSupported ? "true" : "false");

      console.log(`📤 Đang gửi file âm thanh kèm transcript "${spokenText}" lên hệ thống đánh giá...`);
      const gradingRes = await fetch("/api/assess-speech", {
        method: "POST",
        body: gradingFormData,
      });

      if (!gradingRes.ok) {
        throw new Error("Không thể liên kết với hệ sinh thái AI chấm điểm!");
      }

      const gradeResult = await gradingRes.json();
      console.log("✅ Kết quả chấm điểm AI:", gradeResult);

      // 2. Save result to Mongoose Database API
      console.log("💾 Đang ghi nhận kết quả bài nói của bé vào database...");
      const dbRes = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level,
          sentence: currentPrompt.sentence,
          score: gradeResult.score,
          stars: gradeResult.stars,
          mispronouncedWords: gradeResult.mispronouncedWords,
          feedback: gradeResult.feedback,
          roadmap: gradeResult.roadmap,
          recordedAudioUrl: "", // In product, here we store the uploaded AWS S3 URL
        }),
      });

      if (!dbRes.ok) {
        throw new Error("Ghi nhận điểm thi vào cơ sở dữ liệu thất bại!");
      }

      const dbResult = await dbRes.json();
      console.log("✅ Đã ghi nhận thành công, ID:", dbResult.data._id);

      // 3. Route to Result Dashboard Page
      router.push(`/result/${dbResult.data._id}`);

    } catch (err: any) {
      console.error("Lỗi gửi/chấm điểm bài nói:", err);
      setErrorMsg(
        "Có một sự cố nhỏ xảy ra khi chấm điểm bài nói của con. Bé hãy bấm nút tải lại hoặc thu âm thử lại xem nhé! 🚀"
      );
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full min-h-screen pb-16 relative bg-pastel-bg flex flex-col">
      {/* Visual background bubbles decor */}
      <div className="bubble-bg top-24 left-6 w-20 h-20 animate-float" style={{ animationDelay: "1s" }} />
      <div className="bubble-bg bottom-16 right-10 w-28 h-28 animate-float" style={{ animationDelay: "2s" }} />

      {/* Stats Navigation bar */}
      <header className="w-full bg-white border-b-4 border-slate-100 py-4 px-4 sticky top-0 z-30 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {isProcessing ? (
            <button disabled className="btn-3d-gray opacity-60 px-4 py-2.5 text-xs font-black flex items-center gap-1 cursor-not-allowed">
              <ArrowLeft className="w-4 h-4" />
              QUAY VỀ
            </button>
          ) : (
            <Link href="/">
              <button className="btn-3d-gray px-4 py-2.5 text-xs font-black flex items-center gap-1">
                <ArrowLeft className="w-4 h-4" />
                QUAY VỀ
              </button>
            </Link>
          )}

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-4 py-1.5 rounded-2xl">
            <span className="text-xl">{currentPrompt.animal}</span>
            <span className="text-sm font-black text-slate-700 uppercase tracking-wider">{level} LEVEL</span>
          </div>

          <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center border-2 border-yellow-300">
            <span className="text-sm font-extrabold text-yellow-700">1/1</span>
          </div>
        </div>
      </header>

      {/* Main Workspace content */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 mt-8 flex flex-col justify-center">

        {/* Mascot Prompt card */}
        <section className="bg-white rounded-3xl border-4 border-slate-100 p-6 md:p-8 shadow-xl mb-6 relative overflow-hidden">

          {/* Header Title with Mascot */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border-2 border-amber-200 flex items-center justify-center text-4xl shadow-sm shrink-0 animate-bounce" style={{ animationDuration: "3s" }}>
              {currentPrompt.animal}
            </div>
            <div>
              <span className="bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md">
                {currentPrompt.mascot} gợi ý câu
              </span>
              <h2 className="text-xl font-black text-slate-800 leading-tight">Thử thách nói của bé hôm nay!</h2>
            </div>
          </div>

          {/* Description hint bubble */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs font-bold text-slate-500 leading-relaxed mb-6 flex items-start gap-2 shadow-inner">
            <HelpCircle className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-slate-700 font-extrabold">Hướng dẫn cho bé:</p>
              <p className="mt-0.5 font-sans font-bold">{currentPrompt.description}</p>
            </div>
          </div>

          {/* Visual Phonics Illustration Display Card */}
          <div className="w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl py-6 px-4 text-center mb-8 relative flex flex-col items-center justify-center group">
            <span className="text-6xl tracking-widest block mb-3 group-hover:scale-110 transition-transform duration-300">
              {currentPrompt.illustration}
            </span>
            <span className="text-xs font-black text-slate-400 bg-white border border-slate-100 px-3 py-1 rounded-full shadow-sm max-w-xs uppercase tracking-wide">
              🎨 {currentPrompt.illustrationDesc}
            </span>
          </div>

          {/* Core Cambridge English speaking Target prompt */}
          <div className="w-full text-center py-4 border-y-2 border-slate-100 relative mb-2">

            <span className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">Đọc to câu sau:</span>

            <p className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight leading-snug px-4 select-all selection:bg-yellow-200">
              "{currentPrompt.sentence}"
            </p>

            {/* TTS sound play buttons */}
            <div className="mt-4 flex justify-center">
              <button
                onClick={playTTS}
                disabled={ttsPlaying || isProcessing}
                className={`btn-3d-yellow px-5 py-2.5 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${ttsPlaying ? "animate-pulse brightness-90 shadow-none translate-y-[4px]" :
                    isProcessing ? "opacity-50 cursor-not-allowed" : "hover:scale-105"
                  }`}
              >
                <Volume2 className={`w-4 h-4 ${ttsPlaying ? "animate-bounce" : ""}`} />
                {ttsPlaying ? "Đang đọc mẫu..." : "Nghe cô đọc mẫu 🔊"}
              </button>
            </div>
          </div>

        </section>

        {/* Audio Recording Engine */}
        <section className="w-full mb-8">
          <AudioRecorder
            onRecordingComplete={handleRecordingComplete}
            isProcessing={isProcessing}
            sentence={currentPrompt.sentence}
          />
        </section>

        {/* Errors display */}
        {errorMsg && (
          <section className="w-full p-4 bg-rose-50 border-2 border-rose-200 rounded-3xl text-rose-600 text-sm font-bold text-left flex items-start gap-2 shadow-sm animate-bounce-subtle">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-black">Úp! Có lỗi xảy ra rồi:</p>
              <p className="mt-0.5 font-medium">{errorMsg}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-3 bg-white text-rose-600 border border-rose-200 hover:bg-rose-100 rounded-xl px-4 py-1.5 text-xs font-extrabold shadow-sm active:translate-y-0.5 transition-transform uppercase"
              >
                Thử lại ngay 🔄
              </button>
            </div>
          </section>
        )}

      </main>

      {/* Decorative stars */}
      <div className="text-center text-xs text-slate-400 font-bold z-10 px-4 mb-4">
        🔒 Dữ liệu thu âm giọng nói của bé được mã hóa an toàn nhằm bảo mật riêng tư.
      </div>

      {/* 🚀 Playful Fullscreen Loading Overlay for Kid-friendly AI Grading */}
      {isProcessing && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-white rounded-3xl border-4 border-blue-400 p-8 shadow-2xl max-w-sm w-full relative overflow-hidden animate-bounce-subtle">
            {/* Playful elements floating around inside loading box */}
            <div className="absolute -top-3 -left-3 text-3xl animate-spin" style={{ animationDuration: "6s" }}>⭐</div>
            <div className="absolute -bottom-3 -right-3 text-3xl animate-bounce">🎈</div>

            <div className="w-24 h-24 bg-blue-50 border-4 border-dashed border-blue-400 rounded-full flex items-center justify-center mx-auto mb-6 relative">
              <span className="text-5xl animate-spin inline-block" style={{ animationDuration: "12s" }}>🚀</span>
            </div>

            <h3 className="text-xl font-black text-blue-600 tracking-tight">
              Đang chấm điểm phát âm...
            </h3>

            <p className="text-sm font-extrabold text-slate-500 mt-3 leading-relaxed">
              Cô giáo AI {currentPrompt.mascot} {currentPrompt.animal} đang lắng nghe thật kỹ giọng nói siêu đáng yêu của con để chấm điểm đấy! 🌟
            </p>

            <div className="w-full bg-slate-100 rounded-full h-3.5 mt-6 p-0.5 border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-400 to-indigo-500 h-full rounded-full animate-pulse w-full" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
