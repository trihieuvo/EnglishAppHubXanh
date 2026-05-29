"use client";

import React, { useState, use, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Volume2, Sparkles, AlertCircle, HelpCircle, Headphones, BookOpen, PenTool, Mic, Send, Sparkle } from "lucide-react";
import AudioRecorder from "@/components/AudioRecorder";
import { questionBank } from "@/lib/questionBank";

interface TestPageProps {
  params: Promise<{ level: string }>;
}

export default function TestPage({ params }: TestPageProps) {
  const resolvedParams = use(params);
  const rawLevel = resolvedParams.level;

  return (
    <Suspense fallback={
      <div className="w-full min-h-screen bg-pastel-bg flex flex-col items-center justify-center p-6 text-center">
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-full border-8 border-slate-200 border-t-indigo-500 animate-spin" />
          <span className="text-4xl absolute inset-0 flex items-center justify-center animate-bounce">🎒</span>
        </div>
        <h2 className="text-2xl font-black text-slate-800 animate-pulse">
          Đang chuẩn bị phòng học của con...
        </h2>
        <p className="text-sm text-slate-500 mt-2">
          Cô giáo AI đang xếp các hình dán lên bàn nhé! 🌟
        </p>
      </div>
    }>
      <TestPageContent rawLevel={rawLevel} />
    </Suspense>
  );
}

function TestPageContent({ rawLevel }: { rawLevel: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Normalize level and skill
  const level = (rawLevel.charAt(0).toUpperCase() + rawLevel.slice(1).toLowerCase()) as "Starters" | "Movers" | "Flyers";
  const rawSkill = searchParams.get("skill") || "speaking";
  const skill = rawSkill.toLowerCase() as "speaking" | "listening" | "reading" | "writing";

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [ttsPlaying, setTtsPlaying] = useState(false);

  const voices = [
    { code: "en-US-AriaNeural", name: "Mỹ (Nữ) 🇺🇸" },
    { code: "en-US-GuyNeural", name: "Mỹ (Nam) 🇺🇸" },
    { code: "en-GB-SoniaNeural", name: "Anh (Nữ) 🇬🇧" },
    { code: "en-GB-RyanNeural", name: "Anh (Nam) 🇬🇧" },
    { code: "en-AU-NatashaNeural", name: "Úc (Nữ) 🇦🇺" },
  ];

  const [selectedVoice, setSelectedVoice] = useState<string>("en-US-AriaNeural");

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("preferred_accent_voice");
      if (saved) {
        setSelectedVoice(saved);
      }
    }
  }, []);

  const handleVoiceChange = (voiceCode: string) => {
    setSelectedVoice(voiceCode);
    if (typeof window !== "undefined") {
      localStorage.setItem("preferred_accent_voice", voiceCode);
    }
  };

  // Skill states
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [userWriting, setUserWriting] = useState("");

  // Get question from question bank
  const question = questionBank[level]?.[skill] || questionBank.Starters.speaking;

  const levelDetails = {
    Starters: {
      animal: "🦛",
      mascot: "Hippo Dễ Thương",
      color: "from-pink-400 to-purple-400 border-pink-400",
      accentBg: "bg-pink-500",
      btnClass: "btn-3d-pink",
    },
    Movers: {
      animal: "🐒",
      mascot: "Monkey Thông Minh",
      color: "from-amber-400 to-yellow-500 border-amber-400",
      accentBg: "bg-amber-500",
      btnClass: "btn-3d-yellow",
    },
    Flyers: {
      animal: "🦁",
      mascot: "Lion Dũng Cảm",
      color: "from-blue-400 to-sky-500 border-blue-400",
      accentBg: "bg-blue-500",
      btnClass: "btn-3d-blue",
    },
  };

  const currentDetails = levelDetails[level] || levelDetails.Starters;

  // Play model sound using Edge TTS proxy
  const playTTS = () => {
    try {
      setTtsPlaying(true);
      const textToSpeak = skill === "listening" ? question.audioText : question.prompt;
      if (!textToSpeak) return;

      const ttsUrl = `/api/tts?text=${encodeURIComponent(textToSpeak)}&voice=${selectedVoice}`;
      const audio = new Audio(ttsUrl);
      audio.onended = () => setTtsPlaying(false);
      audio.onerror = (e) => {
        console.warn("Lỗi phát Edge TTS, chuyển sang Web Speech API:", e);
        playNativeTTS(textToSpeak);
      };

      audio.play().catch((err) => {
        console.warn("Autoplay bị chặn, chuyển sang Web Speech API:", err);
        playNativeTTS(textToSpeak);
      });
    } catch (e) {
      console.warn("Lỗi tạo Audio, chuyển sang Web Speech API:", e);
      playNativeTTS(skill === "listening" ? question.audioText || "" : question.prompt);
    }
  };

  const playNativeTTS = (textToSpeak: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      const voiceLang = selectedVoice.startsWith("en-GB") ? "en-GB" : selectedVoice.startsWith("en-AU") ? "en-AU" : "en-US";
      utterance.lang = voiceLang;
      utterance.rate = 0.8;
      utterance.onstart = () => setTtsPlaying(true);
      utterance.onend = () => setTtsPlaying(false);
      utterance.onerror = () => setTtsPlaying(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setTtsPlaying(false);
      alert("Trình duyệt chưa hỗ trợ nghe thử rồi! 🔊");
    }
  };

  // Submit handler for SPEAKING
  const handleRecordingComplete = async (audioBlob: Blob) => {
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const gradingFormData = new FormData();
      gradingFormData.append("audio", audioBlob, "speaking_voice.webm");
      gradingFormData.append("sentence", question.prompt);
      gradingFormData.append("level", level);

      console.log(`📤 Đang gửi file âm thanh lên hệ thống đánh giá...`);
      const gradingRes = await fetch("/api/assess-speech", {
        method: "POST",
        body: gradingFormData,
      });

      if (!gradingRes.ok) {
        throw new Error("Không thể liên kết với hệ sinh thái AI chấm điểm!");
      }

      const gradeResult = await gradingRes.json();
      console.log("✅ Kết quả chấm điểm AI:", gradeResult);

      // Route to Result
      router.push(`/result/${gradeResult.savedId}`);
    } catch (err: any) {
      console.error("Lỗi gửi/chấm điểm bài nói:", err);
      setErrorMsg(
        "Có một sự cố nhỏ xảy ra khi chấm điểm bài nói của con. Bé hãy bấm nút tải lại hoặc thu âm thử lại xem nhé! 🚀"
      );
      setIsProcessing(false);
    }
  };

  // Submit handler for LISTENING / READING
  const handleChoiceSubmit = async () => {
    if (!selectedOption) {
      alert("Bé ơi, con hãy bấm chọn một đáp án trước khi nộp bài nhé! 🥰");
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const formattedSkill = skill === "listening" ? "Listening" : "Reading";
      console.log(`📤 Đang gửi đáp án trắc nghiệm ${formattedSkill}...`);
      const res = await fetch("/api/assess-choice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level,
          skill: formattedSkill,
          selectedOption,
        }),
      });

      if (!res.ok) {
        throw new Error("Ghi nhận trắc nghiệm thất bại!");
      }

      const gradeResult = await res.json();
      console.log("✅ Kết quả chấm điểm trắc nghiệm:", gradeResult);

      router.push(`/result/${gradeResult.savedId}`);
    } catch (err: any) {
      console.error("Lỗi gửi/chấm điểm trắc nghiệm:", err);
      setErrorMsg("Gặp lỗi nhỏ khi gửi câu trả lời của con. Con hãy bấm nút thử lại nhé! 🌟");
      setIsProcessing(false);
    }
  };

  // Submit handler for WRITING
  const handleWritingSubmit = async () => {
    if (!userWriting.trim()) {
      alert("Bé ơi, con hãy viết câu của mình vào ô tập viết nhé! ✍️");
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      console.log(`📤 Đang gửi bài tập viết lên hệ thống...`);
      const res = await fetch("/api/assess-writing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level,
          prompt: question.prompt,
          userAnswer: userWriting,
        }),
      });

      if (!res.ok) {
        throw new Error("Ghi nhận bài viết thất bại!");
      }

      const gradeResult = await res.json();
      console.log("✅ Kết quả chấm điểm viết:", gradeResult);

      router.push(`/result/${gradeResult.savedId}`);
    } catch (err: any) {
      console.error("Lỗi gửi/chấm điểm viết:", err);
      setErrorMsg("Gặp lỗi nhỏ khi sửa bài viết cho con. Con hãy bấm nút thử lại xem nhé! 🚀");
      setIsProcessing(false);
    }
  };

  // Get loading screen message depending on the skill
  const getLoadingMessage = () => {
    if (skill === "speaking") {
      return {
        title: "Đang chấm điểm phát âm...",
        desc: `Cô giáo AI ${currentDetails.mascot} đang lắng nghe thật kỹ giọng nói siêu đáng yêu của con để chấm điểm đấy! 🌟`
      };
    } else if (skill === "listening") {
      return {
        title: "Đang chấm điểm tai nghe...",
        desc: `Cô giáo AI ${currentDetails.mascot} đang kiểm tra xem con nghe chuẩn chưa để trao thật nhiều sao vàng nhé! 🎧`
      };
    } else if (skill === "reading") {
      return {
        title: "Đang chấm điểm đọc hiểu...",
        desc: `Cô giáo AI ${currentDetails.mascot} đang chấm bài đọc của con. Đợi cô dán nhãn dán xinh xắn nha! 📖`
      };
    } else {
      return {
        title: "Cô giáo đang soi chữ...",
        desc: `Cô giáo AI ${currentDetails.mascot} đang xem nét chữ đáng yêu và sửa lỗi ngữ pháp, chính tả cho con nhé! ✍️`
      };
    }
  };

  const loadingDetails = getLoadingMessage();

  return (
    <div className="w-full min-h-screen pb-16 relative bg-pastel-bg dark:bg-dark-bg flex flex-col">
      {/* Visual background bubbles decor */}
      <div className="bubble-bg top-24 left-6 w-20 h-20 animate-float" style={{ animationDelay: "1s" }} />
      <div className="bubble-bg bottom-16 right-10 w-28 h-28 animate-float" style={{ animationDelay: "2s" }} />

      {/* Navigation bar */}
      <header className="w-full bg-white dark:bg-slate-900 border-b-4 border-slate-100 dark:border-slate-700 py-3 md:py-4 px-3 md:px-4 sticky top-0 z-30 shadow-sm">
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

          <div className="flex items-center gap-1.5 md:gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 px-2.5 md:px-4 py-1 md:py-1.5 rounded-2xl">
            <span className="text-base md:text-xl">{currentDetails.animal}</span>
            <span className="text-[9px] md:text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">
              {level} LEVEL - {skill.toUpperCase()}
            </span>
          </div>

          <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center border-2 border-yellow-300">
            <span className="text-sm font-extrabold text-yellow-700">1/1</span>
          </div>
        </div>
      </header>

      {/* Main Workspace content */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-3 md:px-4 mt-6 md:mt-8 flex flex-col justify-center">

        {/* Mascot Prompt card */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl border-4 border-slate-100 dark:border-slate-700 p-4 md:p-8 shadow-xl mb-6 relative overflow-hidden">
          
          {/* Header Title with Mascot */}
          <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border-2 border-amber-200 flex items-center justify-center text-4xl shadow-sm shrink-0 animate-bounce" style={{ animationDuration: "3s" }}>
              {currentDetails.animal}
            </div>
            <div>
              <span className="bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1">
                {skill === "speaking" && <Mic className="w-3 h-3 text-pink-500" />}
                {skill === "listening" && <Headphones className="w-3 h-3 text-blue-500" />}
                {skill === "reading" && <BookOpen className="w-3 h-3 text-emerald-500" />}
                {skill === "writing" && <PenTool className="w-3 h-3 text-amber-500" />}
                {currentDetails.mascot} gợi ý bài tập
              </span>
              <h2 className="text-xl font-black text-slate-800 leading-tight">
                {skill === "speaking" && "Thử thách Luyện Nói của bé!"}
                {skill === "listening" && "Thử thách Luyện Nghe của bé!"}
                {skill === "reading" && "Thử thách Đọc Hiểu của bé!"}
                {skill === "writing" && "Thử thách Tập Viết Câu của bé!"}
              </h2>
            </div>
          </div>

          {/* Description hint bubble */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs font-bold text-slate-500 leading-relaxed mb-6 flex items-start gap-2 shadow-inner">
            <HelpCircle className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-slate-700 font-extrabold">Hướng dẫn cho bé:</p>
              <p className="mt-0.5 font-sans font-bold">{question.hint}</p>
            </div>
          </div>

          {/* Visual Illustration Display Card */}
          <div className="w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl py-6 px-4 text-center mb-8 relative flex flex-col items-center justify-center group">
            <span className="text-6xl tracking-widest block mb-3 group-hover:scale-110 transition-transform duration-300">
              {question.illustration}
            </span>
            <span className="text-xs font-black text-slate-400 bg-white border border-slate-100 px-3 py-1 rounded-full shadow-sm max-w-xs uppercase tracking-wide">
              🎨 {question.illustrationDesc}
            </span>
          </div>

          {/* DYNAMIC SKILL WORKSPACE CONTAINER */}

          {/* 1. SPEAKING WORKSPACE */}
          {skill === "speaking" && (
            <div className="w-full text-center py-4 border-t border-slate-100 relative mb-2">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">Đọc to câu sau:</span>
              <p className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight leading-snug px-4 select-all selection:bg-yellow-200">
                "{question.prompt}"
              </p>
              
              {/* Voice Accent Selector */}
              <div className="mt-4 mb-2 bg-slate-50/50 border border-slate-200/60 rounded-2xl p-3 inline-block mx-auto max-w-full">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2 text-center">
                  Chọn accent của cô giáo AI:
                </span>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {voices.map((v) => {
                    const isSelected = selectedVoice === v.code;
                    return (
                      <button
                        key={v.code}
                        onClick={() => handleVoiceChange(v.code)}
                        disabled={ttsPlaying || isProcessing}
                        className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold border-2 transition-all cursor-pointer ${
                          isSelected
                            ? "bg-indigo-50 border-indigo-400 text-indigo-600 font-extrabold scale-105"
                            : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                        }`}
                      >
                        {v.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Audio specimen playback button */}
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
          )}

          {/* 2. LISTENING WORKSPACE */}
          {skill === "listening" && (
            <div className="w-full border-t border-slate-100 pt-6">
              
              <div className="text-center mb-6 bg-blue-50 border border-blue-200 rounded-2xl p-4">
                <span className="text-xs font-black text-blue-500 uppercase tracking-widest block mb-2">
                  Bấm loa để lắng nghe câu hỏi:
                </span>
                
                {/* Voice Accent Selector */}
                <div className="mt-1 mb-4 bg-white/80 border border-blue-100 rounded-2xl p-2.5 inline-block mx-auto max-w-full">
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-wider block mb-1.5 text-center">
                    Chọn accent của cô giáo AI:
                  </span>
                  <div className="flex flex-wrap justify-center gap-1.5">
                    {voices.map((v) => {
                      const isSelected = selectedVoice === v.code;
                      return (
                        <button
                          key={v.code}
                          onClick={() => handleVoiceChange(v.code)}
                          disabled={ttsPlaying || isProcessing}
                          className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold border-2 transition-all cursor-pointer ${
                            isSelected
                              ? "bg-blue-50 border-blue-400 text-blue-600 font-extrabold scale-105"
                              : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                          }`}
                        >
                          {v.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                <button
                  onClick={playTTS}
                  disabled={ttsPlaying || isProcessing}
                  className={`btn-3d-blue px-6 py-3.5 text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 mx-auto ${
                    ttsPlaying ? "animate-pulse brightness-95 shadow-none translate-y-[4px]" : "hover:scale-105"
                  }`}
                >
                  <Volume2 className={`w-5 h-5 ${ttsPlaying ? "animate-bounce" : ""}`} />
                  {ttsPlaying ? "Đang phát âm thanh... 🔊" : "BẤM ĐỂ NGHE 🔊"}
                </button>
              </div>

              <p className="text-slate-800 font-extrabold text-sm mb-4">
                ❓ {question.questionText}
              </p>

              {/* Multiple choice grid */}
              <div className="grid grid-cols-1 gap-3">
                {question.options?.map((option, idx) => {
                  const isSelected = selectedOption === option;
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedOption(option)}
                      disabled={isProcessing}
                      className={`w-full text-left p-4 rounded-2xl border-2 font-extrabold text-sm transition-all duration-200 flex items-center justify-between ${
                        isSelected 
                          ? "bg-blue-50 border-blue-500 text-blue-700 shadow-md scale-[1.01]" 
                          : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
                      }`}
                    >
                      <span>{option}</span>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? "border-blue-500 bg-blue-500 text-white" : "border-slate-300"
                      }`}>
                        {isSelected && <Sparkle className="w-3.5 h-3.5 fill-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Submit Choice */}
              <div className="mt-8 flex justify-center">
                <button
                  onClick={handleChoiceSubmit}
                  disabled={!selectedOption || isProcessing}
                  className={`btn-3d-green w-full py-4 text-sm tracking-wider uppercase flex items-center justify-center gap-1.5 ${
                    !selectedOption ? "opacity-50 cursor-not-allowed shadow-none translate-y-[4px]" : "hover:scale-[1.02]"
                  }`}
                >
                  <Send className="w-4 h-4" />
                  Gửi câu trả lời của con 🚀
                </button>
              </div>

            </div>
          )}

          {/* 3. READING WORKSPACE */}
          {skill === "reading" && (
            <div className="w-full border-t border-slate-100 pt-6">
              
              {/* Reading Passage Card */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-5 mb-6 shadow-inner text-center">
                <span className="text-xs font-black text-emerald-600 uppercase tracking-widest block mb-2">Đoạn văn đọc:</span>
                <p className="text-lg md:text-xl font-extrabold text-slate-800 leading-relaxed font-serif">
                  "{question.prompt}"
                </p>
              </div>

              <p className="text-slate-800 font-extrabold text-sm mb-4">
                ❓ {question.questionText}
              </p>

              {/* Options */}
              <div className="grid grid-cols-1 gap-3">
                {question.options?.map((option, idx) => {
                  const isSelected = selectedOption === option;
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedOption(option)}
                      disabled={isProcessing}
                      className={`w-full text-left p-4 rounded-2xl border-2 font-extrabold text-sm transition-all duration-200 flex items-center justify-between ${
                        isSelected 
                          ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-md scale-[1.01]" 
                          : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
                      }`}
                    >
                      <span>{option}</span>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300"
                      }`}>
                        {isSelected && <Sparkle className="w-3.5 h-3.5 fill-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Submit */}
              <div className="mt-8 flex justify-center">
                <button
                  onClick={handleChoiceSubmit}
                  disabled={!selectedOption || isProcessing}
                  className={`btn-3d-green w-full py-4 text-sm tracking-wider uppercase flex items-center justify-center gap-1.5 ${
                    !selectedOption ? "opacity-50 cursor-not-allowed shadow-none translate-y-[4px]" : "hover:scale-[1.02]"
                  }`}
                >
                  <Send className="w-4 h-4" />
                  Gửi câu trả lời của con 🚀
                </button>
              </div>

            </div>
          )}

          {/* 4. WRITING WORKSPACE */}
          {skill === "writing" && (
            <div className="w-full border-t border-slate-100 pt-6">
              
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
                <p className="text-xs font-black text-amber-700 uppercase tracking-widest mb-1">Từ vựng gợi ý của cô giáo AI:</p>
                <p className="text-sm font-bold text-slate-600">
                  Hãy viết một câu mô tả tranh bằng Tiếng Anh dựa theo các từ gợi ý trong hộp màu nhé con! Chú ý chia động từ thật chuẩn! ✍️
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-slate-700 font-extrabold text-sm mb-2" htmlFor="writing-input">
                  Con gõ câu Tiếng Anh của mình vào đây nhé: 📝
                </label>
                <textarea
                  id="writing-input"
                  rows={3}
                  value={userWriting}
                  onChange={(e) => setUserWriting(e.target.value)}
                  disabled={isProcessing}
                  placeholder="Ví dụ: The cat sits on the red mat."
                  className="w-full rounded-2xl border-2 border-slate-200 focus:border-amber-400 p-4 text-base font-extrabold text-slate-700 outline-none transition-colors shadow-inner resize-none font-sans"
                />
                
                {/* Character count */}
                <div className="text-right text-[10px] text-slate-400 font-extrabold mt-1">
                  Độ dài câu: {userWriting.length} ký tự
                </div>
              </div>

              {/* Submit */}
              <div className="mt-6 flex justify-center">
                <button
                  onClick={handleWritingSubmit}
                  disabled={!userWriting.trim() || isProcessing}
                  className={`btn-3d-amber w-full py-4 text-sm tracking-wider uppercase flex items-center justify-center gap-1.5 ${
                    !userWriting.trim() ? "opacity-50 cursor-not-allowed shadow-none translate-y-[4px]" : "hover:scale-[1.02]"
                  }`}
                >
                  <Send className="w-4 h-4" />
                  Nộp bài viết cho cô giáo AI 🚀
                </button>
              </div>

            </div>
          )}

        </section>

        {/* Audio Recording Engine ONLY FOR SPEAKING */}
        {skill === "speaking" && (
          <section className="w-full mb-8">
            <AudioRecorder
              onRecordingComplete={handleRecordingComplete}
              isProcessing={isProcessing}
              sentence={question.prompt}
            />
          </section>
        )}

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

      {/* 🔒 Encryption notice */}
      <div className="text-center text-xs text-slate-400 font-bold z-10 px-4 mb-4 mt-6">
        🔒 Trình chấm điểm AI bảo mật và hỗ trợ con sửa đổi lỗi sai trọn đời.
      </div>

      {/* 🚀 Playful Fullscreen Loading Overlay for Kid-friendly AI Grading */}
      {isProcessing && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4 md:p-6 text-center">
          <div className="bg-white rounded-3xl border-4 border-indigo-400 p-8 shadow-2xl max-w-sm w-full relative overflow-hidden animate-bounce-subtle">
            
            {/* Playful elements floating around inside loading box */}
            <div className="absolute -top-3 -left-3 text-3xl animate-spin" style={{ animationDuration: "6s" }}>⭐</div>
            <div className="absolute -bottom-3 -right-3 text-3xl animate-bounce">🎈</div>

            <div className="w-24 h-24 bg-indigo-50 border-4 border-dashed border-indigo-400 rounded-full flex items-center justify-center mx-auto mb-6 relative">
              <span className="text-5xl animate-spin inline-block" style={{ animationDuration: "12s" }}>🚀</span>
            </div>

            <h3 className="text-xl font-black text-indigo-600 tracking-tight">
              {loadingDetails.title}
            </h3>

            <p className="text-sm font-extrabold text-slate-500 mt-3 leading-relaxed">
              {loadingDetails.desc}
            </p>

            <div className="w-full bg-slate-100 rounded-full h-3.5 mt-6 p-0.5 border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-400 to-blue-500 h-full rounded-full animate-pulse w-full" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
