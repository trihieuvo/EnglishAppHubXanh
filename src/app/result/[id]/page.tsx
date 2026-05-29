"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Star, ArrowLeft, CheckSquare, Square, Share2, Award, Sparkles, Volume2, MessageSquare, Compass, RefreshCw, Home, Headphones, BookOpen, PenTool, CheckCircle, AlertTriangle } from "lucide-react";

interface AssessmentResultData {
  _id: string;
  userId: string;
  level: "Starters" | "Movers" | "Flyers";
  skill?: "Speaking" | "Listening" | "Reading" | "Writing";
  sentence: string;
  spokenText: string;
  recordedAudioUrl?: string;
  targetAnswer?: string;
  userAnswer?: string;
  corrections?: string;
  score: number;
  stars: number;
  mispronouncedWords: string[];
  feedback: {
    tutorComment: string;
    tips: string;
  };
  roadmap: string[];
  createdAt: string;
}

interface ResultPageProps {
  params: Promise<{ id: string }>;
}

export default function ResultPage({ params }: ResultPageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const resultId = resolvedParams.id;

  const [data, setData] = useState<AssessmentResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Roadmap checklist local state for kid interaction
  const [checkedRoadmap, setCheckedRoadmap] = useState<boolean[]>([false, false, false]);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [ttsPlaying, setTtsPlaying] = useState(false);

  const voices = [
    { code: "en-US-AriaNeural", name: "Mỹ (Nữ) 🇺🇸" },
    { code: "en-US-GuyNeural", name: "Mỹ (Nam) 🇺🇸" },
    { code: "en-GB-SoniaNeural", name: "Anh (Nữ) 🇬🇧" },
    { code: "en-GB-RyanNeural", name: "Anh (Nam) 🇬🇧" },
    { code: "en-AU-NatashaNeural", name: "Úc (Nữ) 🇦🇺" },
  ];

  const [selectedVoice, setSelectedVoice] = useState<string>("en-US-AriaNeural");

  useEffect(() => {
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

  // Fetch results from API
  useEffect(() => {
    async function fetchResult() {
      try {
        const res = await fetch(`/api/assessments?id=${resultId}`);
        if (!res.ok) {
          throw new Error("Không thể tải thông tin kết quả bài luyện tập!");
        }
        const json = await res.json();
        if (json.success && json.data) {
          setData(json.data);
          setCheckedRoadmap([false, false, false]);
        } else {
          throw new Error(json.error || "Không tìm thấy dữ liệu!");
        }
      } catch (err: any) {
        console.error("Lỗi tải kết quả:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchResult();
  }, [resultId]);

  const toggleRoadmapItem = (index: number) => {
    setCheckedRoadmap((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  // Speaks aloud individual words using natural Edge TTS as primary, with native Web Speech as fallback
  const playWordTTS = (word: string) => {
    const cleaned = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").trim();
    if (!cleaned) return;

    try {
      setTtsPlaying(true);
      const ttsUrl = `/api/tts?text=${encodeURIComponent(cleaned)}&voice=${selectedVoice}`;
      const audio = new Audio(ttsUrl);
      audio.onended = () => {
        setTtsPlaying(false);
        setSelectedWord(cleaned);
      };
      audio.onerror = (e) => {
        console.warn("Lỗi phát Edge Word TTS, chuyển sang Web Speech API:", e);
        playNativeWordTTS(cleaned);
      };
      audio.play().catch((err) => {
        console.warn("Autoplay bị chặn ở Word TTS, chuyển sang Web Speech API:", err);
        playNativeWordTTS(cleaned);
      });
    } catch (e) {
      console.warn("Lỗi khởi tạo Word Audio, chuyển sang Web Speech API:", e);
      playNativeWordTTS(cleaned);
    }
  };

  const playNativeWordTTS = (cleanedWord: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(cleanedWord);
      const voiceLang = selectedVoice.startsWith("en-GB") ? "en-GB" : selectedVoice.startsWith("en-AU") ? "en-AU" : "en-US";
      utterance.lang = voiceLang;
      utterance.rate = 0.75;
      utterance.onstart = () => setTtsPlaying(true);
      utterance.onend = () => {
        setTtsPlaying(false);
        setSelectedWord(cleanedWord);
      };
      utterance.onerror = () => setTtsPlaying(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setTtsPlaying(false);
      setSelectedWord(cleanedWord);
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-pastel-bg flex flex-col items-center justify-center p-6 text-center">
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-full border-8 border-amber-300 border-t-amber-500 animate-spin" />
          <span className="text-4xl absolute inset-0 flex items-center justify-center animate-bounce">⭐</span>
        </div>
        <h2 className="text-2xl font-black text-slate-800 animate-pulse">
          Cô giáo AI đang chuẩn bị bảng sao vàng...
        </h2>
        <p className="text-sm text-slate-500 mt-2 max-w-xs">
          Đợi một chút xíu nhé, cô đang dán huy hiệu lấp lánh lên bảng điểm của con đấy! 🚀
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="w-full min-h-screen bg-pastel-bg flex flex-col items-center justify-center p-6 text-center">
        <span className="text-6xl mb-4 animate-bounce">😢</span>
        <h2 className="text-2xl font-black text-rose-500">Úp! Có lỗi xảy ra rồi...</h2>
        <p className="text-sm text-slate-500 max-w-sm mt-2">
          Không tìm thấy bài chấm điểm này. Con hãy quay về trang chủ để chọn lại bài luyện tập nhé!
        </p>
        <Link href="/" className="mt-6">
          <button className="btn-3d-gray px-6 py-3 uppercase tracking-wider font-black">
            Quay Về Trang Chủ 🏠
          </button>
        </Link>
      </div>
    );
  }

  const skill = data.skill || "Speaking";
  const isCorrectChoice = data.score === 100;

  // Layout details
  const medalMascot = data.stars === 5 ? "👑 KIM CƯƠNG" : data.stars === 4 ? "🥇 VÀNG" : data.stars === 3 ? "🥈 BẠC" : "🥉 ĐỒNG";
  const medalColor = 
    data.stars === 5 ? "bg-cyan-50 border-cyan-300 text-cyan-700" :
    data.stars === 4 ? "bg-amber-50 border-amber-300 text-amber-700" :
    data.stars === 3 ? "bg-slate-100 border-slate-300 text-slate-600" :
    "bg-orange-50 border-orange-200 text-orange-700";

  const levelMascotAnimal = data.level === "Starters" ? "🦛" : data.level === "Movers" ? "🐒" : "🦁";
  const levelMascotName = data.level === "Starters" ? "Hippo Dễ Thương" : data.level === "Movers" ? "Monkey Thông Minh" : "Lion Dũng Cảm";

  // Speaking word-by-word renderer
  const renderSentenceFeedback = () => {
    const sentence = data.sentence;
    const words = sentence.split(/\s+/).filter(Boolean);

    return (
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-4 py-6 border-y-2 border-slate-100 px-2 my-2 select-none">
        {words.map((word, index) => {
          const cleanedWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").toLowerCase();
          const isWrong = data.mispronouncedWords.includes(cleanedWord);

          if (isWrong) {
            return (
              <span
                key={index}
                onClick={() => playWordTTS(word)}
                className="relative cursor-pointer text-2xl md:text-3xl font-black text-rose-500 bg-rose-50 border-2 border-rose-300 px-3 py-1 rounded-2xl shadow-sm transition-all hover:scale-105 active:scale-95 group underline decoration-wavy decoration-rose-400 decoration-3 underline-offset-4"
                title="Nhấn để nghe phát âm mẫu 🔊"
              >
                {word}
                <span className="absolute -top-3.5 -right-2 bg-rose-500 text-white text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md shadow-sm border border-white scale-75 group-hover:scale-90 transition-transform">
                  🔊 SAI
                </span>
              </span>
            );
          }

          return (
            <span
              key={index}
              onClick={() => playWordTTS(word)}
              className="relative cursor-pointer text-2xl md:text-3xl font-black text-emerald-600 bg-emerald-50 border-2 border-emerald-300 px-3 py-1 rounded-2xl shadow-sm transition-all hover:scale-105 active:scale-95 group"
              title="Phát âm tốt! Nhấn để nghe lại 🔊"
            >
              {word}
              <span className="absolute -top-3.5 -right-2 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md shadow-sm border border-white scale-75 group-hover:scale-90 transition-transform opacity-0 group-hover:opacity-100">
                🔊 ĐÚNG
              </span>
            </span>
          );
        })}
      </div>
    );
  };

  const completedCount = checkedRoadmap.filter(Boolean).length;
  const progressPercent = Math.round((completedCount / 3) * 100);

  return (
    <div className="w-full min-h-screen pb-20 relative bg-pastel-bg dark:bg-dark-bg">
      {/* Dynamic bubbles background */}
      <div className="bubble-bg top-12 left-8 w-24 h-24 animate-float" style={{ animationDelay: "0s" }} />
      <div className="bubble-bg top-32 right-12 w-28 h-28 animate-float" style={{ animationDelay: "3s" }} />
      <div className="bubble-bg bottom-16 left-16 w-32 h-32 animate-float" style={{ animationDelay: "6s" }} />

      {/* Header bar */}
      <header className="w-full bg-white dark:bg-slate-900 border-b-4 border-slate-100 dark:border-slate-700 py-3 md:py-4 px-3 md:px-4 sticky top-0 z-30 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
          <Link href="/">
            <button className="btn-3d-gray px-2.5 md:px-4 py-2 md:py-2.5 text-[10px] md:text-xs font-black flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="hidden sm:inline">BẢNG CHỌN BÀI</span>
              <span className="sm:hidden">VỀ</span>
            </button>
          </Link>
          
          <div className="flex items-center gap-1.5 md:gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 px-2.5 md:px-4 py-1 md:py-1.5 rounded-2xl">
            <span className="text-base md:text-xl">
              {skill === "Speaking" && "🎤"}
              {skill === "Listening" && "🎧"}
              {skill === "Reading" && "📖"}
              {skill === "Writing" && "✍️"}
            </span>
            <span className="text-[10px] md:text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">
              KẾT QUẢ {skill === "Speaking" ? "NÓI" : skill === "Listening" ? "NGHE" : skill === "Reading" ? "ĐỌC" : "VIẾT"}
            </span>
          </div>

          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center border-2 border-emerald-300 dark:border-emerald-700">
            <span className="text-sm md:text-lg animate-bounce" style={{ animationDuration: "1.5s" }}>🎉</span>
          </div>
        </div>
      </header>

      {/* Content wrapper */}
      <main className="max-w-3xl w-full mx-auto px-3 md:px-4 mt-6 md:mt-8 flex flex-col gap-6 md:gap-8">
        
        {/* 1. Scoreboard and Stars Showcase Card */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl border-4 border-amber-200 dark:border-amber-900 p-5 md:p-8 shadow-xl text-center relative overflow-hidden">
          
          {/* Confetti floats */}
          <div className="absolute top-2 left-6 text-2xl animate-bounce" style={{ animationDelay: "1s" }}>✨</div>
          <div className="absolute top-8 right-8 text-2xl animate-bounce" style={{ animationDelay: "2.5s" }}>🎈</div>
          <div className="absolute bottom-6 left-10 text-xl animate-float">🎉</div>
          
          <span className="bg-yellow-100 dark:bg-yellow-950/50 text-yellow-700 dark:text-yellow-300 text-[10px] md:text-xs font-black uppercase tracking-wider px-3 md:px-4 py-1 md:py-1.5 rounded-full border border-yellow-300 dark:border-yellow-800 inline-flex items-center gap-1.5 mb-3 md:mb-4 shadow-sm">
            <Sparkles className="w-3 h-3 md:w-3.5 md:h-3.5 fill-yellow-400" />
            Bé đạt thành tích cao chuẩn Cambridge!
          </span>

          <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight mb-4 md:mb-6">
            BẢNG THÀNH TÍCH CỦA BÉ TÂM ANH
          </h2>

          {/* Golden Star rating 3D layout */}
          <div className="flex items-center justify-center gap-2 md:gap-4 mb-6">
            {Array.from({ length: 5 }).map((_, index) => {
              const active = index < data.stars;
              return (
                <Star
                  key={index}
                  className={`w-12 h-12 md:w-16 md:h-16 transition-all duration-500 ${
                    active 
                      ? "text-amber-500 fill-amber-400 drop-shadow-md animate-bounce" 
                      : "text-slate-200 fill-slate-100"
                  }`}
                  style={{ animationDelay: `${index * 150}ms`, animationDuration: "2s" }}
                />
              );
            })}
          </div>

          {/* Scoring badge stats grid */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 max-w-md mx-auto mt-4 md:mt-6">
            
            {/* Score point badge */}
            <div className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 rounded-2xl p-3 md:p-4 shadow-inner">
              <span className="text-[10px] md:text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                {skill === "Writing" ? "ĐIỂM TẬP VIẾT" : skill === "Speaking" ? "ĐIỂM PHÁT ÂM" : "ĐIỂM TRẮC NGHIỆM"}
              </span>
              <span className="text-3xl md:text-4xl font-black text-emerald-500 font-mono block mt-1">
                {data.score} <span className="text-base text-slate-400 font-sans">/ 100</span>
              </span>
            </div>

            {/* Medal achievement badge */}
            <div className={`w-full border-2 rounded-2xl p-3 md:p-4 shadow-sm flex flex-col justify-center ${medalColor}`}>
              <span className="text-xs font-black opacity-60 uppercase tracking-widest block">HUY CHƯƠNG ĐẠT ĐƯỢC</span>
              <span className="text-xl font-black block mt-1.5 flex items-center justify-center gap-1">
                <Award className="w-5 h-5 shrink-0 animate-spin" style={{ animationDuration: "12s" }} />
                {medalMascot}
              </span>
            </div>

          </div>

        </section>

        {/* 2. Visual Skill Specific details */}

        {/* A. SPEAKING FEEDBACK DETAIL */}
        {skill === "Speaking" && (
          <section className="bg-white dark:bg-slate-900 rounded-3xl border-4 border-slate-100 dark:border-slate-700 p-4 md:p-8 shadow-xl">
            <div className="mb-4 text-center sm:text-left">
              <h3 className="text-lg font-black text-slate-800 flex items-center justify-center sm:justify-start gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-500 animate-pulse" />
                Chi tiết câu đọc của con:
              </h3>
              
              {/* Voice Accent Selector */}
              <div className="mt-3 mb-2 bg-slate-50/50 border border-slate-200/60 rounded-2xl p-2.5 inline-block text-left w-full sm:w-auto">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5 text-center sm:text-left">
                  Chọn accent của cô giáo AI:
                </span>
                <div className="flex flex-wrap justify-center sm:justify-start gap-1.5">
                  {voices.map((v) => {
                    const isSelected = selectedVoice === v.code;
                    return (
                      <button
                        key={v.code}
                        onClick={() => handleVoiceChange(v.code)}
                        disabled={ttsPlaying}
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border-2 transition-all cursor-pointer ${
                          isSelected
                            ? "bg-emerald-50 border-emerald-400 text-emerald-600 font-extrabold scale-105"
                            : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                        }`}
                      >
                        {v.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <p className="text-xs text-slate-500 font-bold mt-2">
                Từ phát âm tốt tô màu <span className="text-emerald-600 font-extrabold bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100">XANH LÁ</span>. Từ phát âm chưa đúng tô màu <span className="text-rose-600 font-extrabold bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-100">ĐỎ</span>. Nhấn vào từng từ để nghe lại giọng đọc chuẩn nhé bé yêu!
              </p>
            </div>

            {renderSentenceFeedback()}

            {selectedWord ? (
              <div className="mt-6 bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs font-bold text-slate-600 flex items-center justify-between gap-3 shadow-inner animate-bounce-subtle">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-5 h-5 text-blue-500 shrink-0" />
                  <span>Bé vừa nghe từ: <strong className="text-blue-600 text-sm uppercase">"{selectedWord}"</strong>. Hãy tập bật âm của từ này nhé!</span>
                </div>
                <button 
                  onClick={() => setSelectedWord(null)}
                  className="text-[10px] bg-slate-200 border border-slate-300 text-slate-500 hover:bg-slate-300 hover:text-slate-700 rounded-lg px-2.5 py-1 font-black transition-colors"
                >
                  ĐÓNG ❌
                </button>
              </div>
            ) : (
              <div className="mt-4 text-center text-[10px] font-black text-slate-400 bg-slate-50/50 rounded-xl py-2 border border-slate-200/30">
                💡 BÉ CÓ BIẾT: Nhấn trực tiếp vào bất kỳ từ nào ở trên để học cách phát âm chuẩn nhé!
              </div>
            )}
          </section>
        )}

        {/* B. LISTENING & READING FEEDBACK DETAIL */}
        {(skill === "Listening" || skill === "Reading") && (
          <section className="bg-white dark:bg-slate-900 rounded-3xl border-4 border-slate-100 dark:border-slate-700 p-4 md:p-8 shadow-xl">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <CheckSquare className="w-5 h-5 text-blue-500" />
              Chi tiết câu trả lời trắc nghiệm:
            </h3>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 mb-6">
              <span className="text-xs font-black text-slate-400 uppercase tracking-wide block mb-1">
                {skill === "Listening" ? "Câu tiếng Anh cô giáo đã đọc:" : "Đoạn văn bé đã đọc:"}
              </span>
              <p className="text-base font-extrabold text-slate-700">
                "{data.sentence}"
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Correct answer card */}
              <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-black text-emerald-600 block">ĐÁP ÁN CHUẨN XÁC</span>
                  <p className="text-sm font-extrabold text-slate-700 mt-1">{data.targetAnswer}</p>
                </div>
              </div>

              {/* User selected card */}
              <div className={`border-2 rounded-2xl p-4 flex items-start gap-3 ${
                isCorrectChoice 
                  ? "bg-emerald-50 border-emerald-300" 
                  : "bg-rose-50 border-rose-300"
              }`}>
                {isCorrectChoice ? (
                  <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className={`text-xs font-black block ${
                    isCorrectChoice ? "text-emerald-600" : "text-rose-600"
                  }`}>
                    ĐÁP ÁN BÉ ĐÃ CHỌN
                  </span>
                  <p className="text-sm font-extrabold text-slate-700 mt-1">{data.userAnswer}</p>
                </div>
              </div>

            </div>

            <div className="mt-6 text-center">
              <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full font-black text-xs border uppercase shadow-sm ${
                isCorrectChoice 
                  ? "bg-emerald-100 border-emerald-300 text-emerald-700" 
                  : "bg-rose-100 border-rose-300 text-rose-700"
              }`}>
                {isCorrectChoice ? "🎉 Bé chọn đúng hoàn hảo!" : "😢 Bé chọn chưa chính xác rồi, cùng xem cô sửa nhé!"}
              </span>
            </div>

          </section>
        )}

        {/* C. WRITING FEEDBACK DETAIL */}
        {skill === "Writing" && (
          <section className="bg-white dark:bg-slate-900 rounded-3xl border-4 border-slate-100 dark:border-slate-700 p-4 md:p-8 shadow-xl">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <PenTool className="w-5 h-5 text-amber-500" />
              Chi tiết câu tập viết của con:
            </h3>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 mb-6">
              <span className="text-xs font-black text-slate-400 uppercase tracking-wide block mb-1">
                Gợi ý / Tranh đề bài:
              </span>
              <p className="text-sm font-extrabold text-slate-600">
                "{data.sentence}"
              </p>
            </div>

            <div className="flex flex-col gap-4">
              
              {/* Kid's writing card */}
              <div className="bg-amber-50/50 border-2 border-amber-200 rounded-2xl p-4 relative overflow-hidden">
                <span className="absolute right-3 top-3 text-2xl">✍️</span>
                <span className="text-xs font-black text-amber-700 block">CÂU CON VIẾT THỰC TẾ:</span>
                <p className="text-lg font-extrabold text-slate-700 mt-1 select-all">
                  "{data.userAnswer}"
                </p>
              </div>

              {/* AI corrections card */}
              <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 relative overflow-hidden">
                <span className="absolute right-3 top-3 text-2xl">👩‍🏫</span>
                <span className="text-xs font-black text-emerald-600 block">CÂU SỬA CHUẨN CỦA CÔ GIÁO AI:</span>
                <p className="text-lg font-extrabold text-emerald-700 mt-1 select-all font-sans">
                  "{data.corrections}"
                </p>
              </div>

            </div>

            <div className="mt-6 text-center text-[10px] font-black text-slate-400 bg-slate-50 rounded-xl py-2 border border-slate-200">
              💡 BÉ CÓ BIẾT: Hãy so sánh nốt chữ của câu bé viết và câu sửa của cô để nhớ bài học lâu hơn nhé!
            </div>

          </section>
        )}

        {/* 3. AI Tutor Empathetic feedback bubble */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl border-4 border-slate-100 dark:border-slate-700 p-4 md:p-8 shadow-xl relative overflow-hidden">
          
          <div className="flex flex-col sm:flex-row items-start gap-5">
            
            {/* Mascot Avatar column */}
            <div className="shrink-0 flex sm:flex-col items-center gap-2 self-center sm:self-start bg-slate-50 dark:bg-slate-800 border-2 border-slate-200/80 dark:border-slate-600 rounded-2xl p-3 md:p-4 w-full sm:w-28 text-center shadow-inner">
              <span className="text-5xl animate-bounce" style={{ animationDuration: "2s" }}>{levelMascotAnimal}</span>
              <div>
                <p className="text-[11px] font-black text-slate-700 dark:text-slate-200 leading-tight">{levelMascotName}</p>
                <p className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 mt-0.5">Cô giáo AI</p>
              </div>
            </div>

            {/* Bubble comment text column */}
            <div className="flex-1 w-full">
              
              {/* Encouragement text */}
              <div className="relative bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-200 dark:border-emerald-800 rounded-3xl p-4 md:p-5 shadow-sm">
                
                {/* Arrow indicator absolute */}
                <div className="hidden sm:block absolute left-0 top-8 w-4 h-4 bg-emerald-50 border-l-2 border-b-2 border-emerald-200 transform -translate-x-[9px] rotate-45" />
                
                <h4 className="text-emerald-800 font-extrabold text-sm mb-2 flex items-center gap-1">
                  ✍️ Lời khuyên ấm áp của cô giáo AI:
                </h4>
                
                <p className="text-slate-700 dark:text-slate-200 text-xs md:text-sm font-extrabold leading-relaxed">
                  "{data.feedback.tutorComment}"
                </p>
              </div>

              {/* Extra correction tips if present */}
              {data.feedback.tips && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-2xl flex items-start gap-2 shadow-sm text-xs font-bold text-yellow-800">
                  <span className="text-base leading-none -mt-0.5">💡</span>
                  <div className="w-full">
                    <span className="font-extrabold">
                      {skill === "Writing" ? "Mẹo ngữ pháp & lỗi sửa:" : "Lời giảng giải đáp án:"} 
                    </span>
                    <p className="font-medium text-slate-600 leading-relaxed font-sans mt-0.5">{data.feedback.tips}</p>
                  </div>
                </div>
              )}

            </div>

          </div>

        </section>

        {/* 4. Playful learning roadmap Checklist */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl border-4 border-slate-100 dark:border-slate-700 p-4 md:p-8 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b-2 border-slate-100">
            <h3 className="text-lg md:text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Compass className="w-6 h-6 text-blue-500 animate-spin" style={{ animationDuration: "10s" }} />
              Lộ trình rèn luyện sửa lỗi cho bé 🚀
            </h3>
            
            {/* Interactive Progress indicator inside roadmap */}
            <div className="shrink-0 bg-blue-50 border border-blue-200 rounded-xl px-3 py-1 text-xs font-black text-blue-700 flex items-center gap-1.5">
              <span>Đã làm:</span>
              <span className="font-mono text-sm text-blue-600">{completedCount}/3 bài</span>
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold leading-relaxed mb-4 md:mb-6">
            Cô giáo AI đã soạn riêng cho con 3 bài tập nhỏ vui nhộn dưới đây. Bé hãy hoàn thành từng bài và nhấn tích chọn hộp bên trái để nhận thêm huy chương chăm chỉ nhé!
          </p>

          {/* Roadmap task checklist */}
          <div className="space-y-4">
            {data.roadmap.map((task, index) => {
              const checked = checkedRoadmap[index];
              const checkedClass = checked 
                ? "bg-slate-50 border-slate-200 opacity-60 text-slate-400 line-through" 
                : "bg-white border-blue-200 hover:border-blue-400 text-slate-700 shadow-sm";

              return (
                <div
                  key={index}
                  onClick={() => toggleRoadmapItem(index)}
                  className={`border-2 rounded-2xl p-4 flex items-start gap-3.5 cursor-pointer transition-all duration-200 select-none ${checkedClass}`}
                >
                  <div className="shrink-0 mt-0.5">
                    {checked ? (
                      <CheckSquare className="w-5 h-5 text-emerald-500 fill-emerald-100" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-400 hover:text-blue-500" />
                    )}
                  </div>
                  
                  <div className="text-sm font-extrabold leading-relaxed font-sans">
                    <span className="inline-block text-xs font-black bg-blue-100/60 text-blue-600 px-2 py-0.5 rounded-md mr-2 font-mono">
                      Bài {index + 1}
                    </span>
                    {task}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Celebratory message when all checklist item checked */}
          {progressPercent === 100 && (
            <div className="mt-6 p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl text-center text-xs font-black text-emerald-800 flex items-center justify-center gap-2 shadow-sm animate-bounce-subtle">
              <span>🎉</span>
              <span>Siêu đỉnh Tâm Anh ơi! Con đã hoàn thành tất cả lộ trình rèn luyện để sửa lỗi. Ba mẹ thưởng cho con thôi nào!</span>
            </div>
          )}
        </section>

        {/* 5. Navigation and actionable controls */}
        <section className="flex flex-col sm:flex-row items-center justify-center gap-4 z-20 relative">
          
          <Link href={`/test/${data.level}?skill=${skill.toLowerCase()}`} className="w-full sm:w-auto">
            <button className="btn-3d-green w-full sm:w-auto px-8 py-4 text-sm tracking-wider uppercase flex items-center justify-center gap-1 hover:scale-105">
              <RefreshCw className="w-4 h-4" />
              THỬ THÁCH LẠI 🔄
            </button>
          </Link>

          <Link href="/" className="w-full sm:w-auto">
            <button className="btn-3d-yellow w-full sm:w-auto px-8 py-4 text-sm tracking-wider uppercase flex items-center justify-center gap-1 hover:scale-105">
              <Home className="w-4 h-4" />
              VỀ TRANG CHỦ 🏠
            </button>
          </Link>

          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: `Thành tích luyện ${skill} Tiếng Anh của bé Tâm Anh`,
                  text: `Bé Tâm Anh vừa đạt được ${data.stars} sao vàng (${data.score}/100 điểm) chuẩn Cambridge ${data.level} kỹ năng ${skill} ở ứng dụng KidSpeak!`,
                  url: window.location.href,
                }).catch(console.error);
              } else {
                alert(`Đã sao chép liên kết thành tích bài luyện tập của bé vào bộ nhớ tạm! Ba mẹ hãy chia sẻ nhé! 🎉\n${window.location.href}`);
                navigator.clipboard.writeText(window.location.href);
              }
            }}
            className="btn-3d-blue w-full sm:w-auto px-8 py-4 text-sm tracking-wider uppercase flex items-center justify-center gap-1 hover:scale-105"
          >
            <Share2 className="w-4 h-4" />
            CHIA SẺ CHO BA MẸ 👨‍👩‍👦
          </button>

        </section>

      </main>
    </div>
  );
}
