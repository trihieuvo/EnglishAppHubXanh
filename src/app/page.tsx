"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Award, Trophy, Star, Clock, ChevronRight, Volume2, Sparkles, BarChart3, Mic, Headphones, BookOpen, PenTool, X, Upload } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

interface AssessmentItem {
  _id: string;
  level: "Starters" | "Movers" | "Flyers";
  skill?: "Speaking" | "Listening" | "Reading" | "Writing";
  sentence: string;
  score: number;
  stars: number;
  createdAt: string;
}

export default function Dashboard() {
  const [history, setHistory] = useState<AssessmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalStars, setTotalStars] = useState(0);
  const [activeModalLevel, setActiveModalLevel] = useState<string | null>(null);

  // Fetch recent speech tests history
  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch("/api/assessments");
        const json = await res.json();
        if (json.success && json.data) {
          setHistory(json.data);
          // Calculate total stars collected across all tests
          const starsSum = json.data.reduce((acc: number, item: AssessmentItem) => acc + item.stars, 0);
          setTotalStars(starsSum);
        }
      } catch (error) {
        console.error("Lỗi khi tải lịch sử đánh giá:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  const levels = [
    {
      id: "Starters",
      title: "Starters",
      cambridge: "Pre-A1 Cambridge",
      character: "🦛",
      charName: "Hippo Dễ Thương",
      ageRange: "Bé từ 6 - 7 tuổi",
      bgColor: "bg-pink-100 dark:bg-pink-950/40 border-pink-300 dark:border-pink-800 text-pink-700 dark:text-pink-300",
      accentBg: "bg-pink-500",
      btnClass: "btn-3d-pink",
      description: "Học từ vựng cơ bản, đồ vật, động vật và màu sắc siêu thú vị xung quanh con.",
      progressBarColor: "bg-pink-500",
      mockProgress: 80,
    },
    {
      id: "Movers",
      title: "Movers",
      cambridge: "A1 Cambridge",
      character: "🐒",
      charName: "Monkey Thông Minh",
      ageRange: "Bé từ 8 - 9 tuổi",
      bgColor: "bg-yellow-100 dark:bg-yellow-950/40 border-yellow-300 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300",
      accentBg: "bg-amber-500",
      btnClass: "btn-3d-yellow",
      description: "Luyện đọc các câu ngắn mô tả hành động, thời tiết, các hoạt động vui chơi hàng ngày.",
      progressBarColor: "bg-amber-400",
      mockProgress: 45,
    },
    {
      id: "Flyers",
      title: "Flyers",
      cambridge: "A2 Cambridge",
      character: "🦁",
      charName: "Lion Dũng Cảm",
      ageRange: "Bé từ 10 - 11 tuổi",
      bgColor: "bg-blue-100 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300",
      accentBg: "bg-blue-500",
      btnClass: "btn-3d-blue",
      description: "Thử thách kể chuyện qua tranh ảnh, miêu tả sở thích cá nhân và các chuyến du lịch.",
      progressBarColor: "bg-blue-500",
      mockProgress: 0,
    },
  ];

  return (
    <div className="w-full min-h-screen pb-20 relative bg-pastel-bg dark:bg-dark-bg">
      {/* Playful Floating Bubbles Background Decor */}
      <div className="bubble-bg top-10 left-10 w-24 h-24 animate-float" style={{ animationDelay: "0s" }} />
      <div className="bubble-bg top-40 right-20 w-32 h-32 animate-float" style={{ animationDelay: "2s" }} />
      <div className="bubble-bg bottom-20 left-12 w-28 h-28 animate-float" style={{ animationDelay: "4s" }} />
      
      {/* 1. Playful Welcome Header */}
      <header className="w-full bg-white dark:bg-slate-900 border-b-4 border-amber-200/50 dark:border-slate-700 shadow-md py-4 md:py-6 px-3 md:px-8 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex flex-col gap-3 md:gap-4">
          
          {/* Top Row: Logo + Theme Toggle */}
          <div className="flex items-center justify-between">
            {/* Logo Brand */}
            <div className="flex items-center gap-2 md:gap-3">
              <span className="text-3xl md:text-4xl animate-bounce" style={{ animationDuration: "2s" }}>🚀</span>
              <div>
                <h1 className="text-xl md:text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-1">
                  KidSpeak <span className="text-emerald-500">English</span>
                </h1>
                <p className="text-[9px] md:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
                  Cambridge Primary Speaking Hub
                </p>
              </div>
            </div>

            {/* Theme Toggle */}
            <ThemeToggle />
          </div>

          {/* Bottom Row: User Kid Status Dashboard — scrollable on mobile */}
          <div className="flex items-center gap-2 md:gap-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl px-3 md:px-5 py-2 shadow-inner overflow-x-auto scrollbar-hide">
            <Link href="/dashboard/import" className="shrink-0">
              <button className="btn-3d-purple px-2.5 md:px-3 py-1.5 text-[10px] md:text-xs font-black flex items-center gap-1">
                <Upload className="w-3.5 h-3.5 md:w-4 md:h-4" />
                SỐ HÓA
              </button>
            </Link>

            <Link href="/dashboard" className="shrink-0">
              <button className="btn-3d-blue px-2.5 md:px-3 py-1.5 text-[10px] md:text-xs font-black flex items-center gap-1">
                <BarChart3 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                TIẾN ĐỘ
              </button>
            </Link>

            <div className="flex items-center gap-2 border-r-2 border-slate-200 dark:border-slate-600 pr-3 md:pr-4 shrink-0">
              <span className="text-xl md:text-2xl">👦🏻</span>
              <div>
                <p className="text-[10px] md:text-xs font-bold text-slate-400 dark:text-slate-500">Học viên nhí</p>
                <p className="text-xs md:text-sm font-extrabold text-slate-700 dark:text-slate-200">Tâm Anh</p>
              </div>
            </div>

            {/* Total Star Counter */}
            <div className="flex items-center gap-1 md:gap-1.5 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-xl px-2 md:px-3 py-1 animate-bounce-subtle shrink-0">
              <Star className="w-4 h-4 md:w-5 md:h-5 text-amber-500 fill-amber-400" />
              <span className="text-sm md:text-lg font-black text-amber-600 dark:text-amber-400 font-mono">
                {totalStars + 10} {/* Seeding 10 base stars for kid encouragement */}
              </span>
            </div>

            {/* Medal Badges */}
            <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-950/50 border border-yellow-200 dark:border-yellow-800 rounded-xl px-2 md:px-2.5 py-1 shrink-0">
              <Trophy className="w-4 h-4 md:w-5 md:h-5 text-yellow-500" />
              <span className="text-[10px] md:text-xs font-black text-yellow-700 dark:text-yellow-400">
                {totalStars > 12 ? "VÀNG" : totalStars > 5 ? "BẠC" : "ĐỒNG"}
              </span>
            </div>
          </div>

        </div>
      </header>

      {/* 2. Welcome Banner */}
      <main className="max-w-6xl mx-auto px-3 md:px-8 mt-6 md:mt-10">
        
        {/* Banner Section */}
        <section className="bg-gradient-to-r from-yellow-300 via-amber-300 to-orange-400 rounded-3xl border-4 border-amber-400 shadow-xl p-6 md:p-8 relative overflow-hidden mb-8 md:mb-12">
          {/* Decorative background vectors */}
          <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full -mr-16 -mt-16" />
          <div className="absolute left-1/3 bottom-0 w-32 h-32 bg-white/10 rounded-full -mb-16" />
          
          <div className="relative z-10 max-w-2xl text-slate-900">
            <span className="bg-white/95 border-2 border-amber-500 text-amber-700 font-black text-[10px] md:text-xs px-3 md:px-3.5 py-1 md:py-1.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1 mb-3 md:mb-4 shadow-sm animate-bounce-subtle">
              <Sparkles className="w-3 h-3 md:w-3.5 md:h-3.5" />
              Vừa học vừa chơi cực vui
            </span>
            
            <h2 className="text-2xl md:text-5xl font-black tracking-tight leading-tight text-amber-950">
              Luyện Nói Tiếng Anh Chuẩn Cambridge Cùng AI!
            </h2>
            <p className="text-sm md:text-lg font-extrabold text-amber-900/90 mt-3 md:mt-4 leading-relaxed">
              Bé thỏa sức đóng vai các con vật dễ thương, thu âm giọng nói siêu đỉnh và nhận vô vàn sao vàng cùng huy hiệu từ cô giáo AI nhé! 🦁🐒🦛
            </p>
          </div>
          
          {/* Mascot absolute position for desktop */}
          <span className="hidden md:inline absolute right-12 bottom-4 text-9xl animate-float">🎉</span>
        </section>

        {/* 2.5. Interactive YLE AI Placement Entrance Test Banner */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl border-4 border-indigo-150 dark:border-slate-700 p-5 md:p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 mb-8 md:mb-12 relative overflow-hidden">
          <div className="absolute top-2 right-4 text-3xl animate-bounce" style={{ animationDelay: "1s" }}>🌟</div>
          <div className="max-w-xl text-left relative z-10">
            <span className="bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-[10px] md:text-xs font-black uppercase tracking-wider px-3 md:px-3.5 py-1 md:py-1.5 rounded-full border border-indigo-200 dark:border-indigo-800 inline-flex items-center gap-1.5 mb-3 shadow-sm">
              <Sparkles className="w-3 h-3 md:w-3.5 md:h-3.5 fill-indigo-300" />
              BÀI TEST ĐẦU VÀO ĐỘC QUYỀN
            </span>
            <h3 className="text-xl md:text-3xl font-black text-slate-800 dark:text-slate-100 leading-tight">
              Bài Thi Thử Thách Tương Tác AI 👩‍🏫
            </h3>
            <p className="text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Đánh giá toàn diện 4 kỹ năng tiếng Anh (Nghe, Nói, Đọc, Viết) chuẩn Cambridge YLE qua hội thoại đối thoại sinh động với Cô giáo AI. Hệ thống tính điểm hình Khiên quốc tế và đề xuất lộ trình học tập tức thì!
            </p>
          </div>
          <Link href="/interactive-test" className="w-full md:w-auto shrink-0 relative z-10">
            <button className="w-full md:w-auto btn-3d-pink px-6 md:px-8 py-3 md:py-4 tracking-wider uppercase font-black flex items-center justify-center gap-2 hover:scale-105 transition-transform text-xs md:text-base cursor-pointer">
              <Mic className="w-4 h-4 md:w-5 md:h-5 animate-pulse" />
              THI TƯƠNG TÁC NGAY 🚀
            </button>
          </Link>
        </section>

        {/* 3. Level Selection Section */}
        <section className="mb-10 md:mb-14">
          <div className="text-center md:text-left mb-6 md:mb-8 flex flex-col gap-4">
            <div>
              <h3 className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center justify-center md:justify-start gap-2">
                🏆 Bé chọn Cấp độ để thử thách nhé:
              </h3>
              <p className="text-slate-500 dark:text-slate-400 font-bold text-xs md:text-sm mt-1">
                Mỗi cấp độ được biên soạn kỹ lưỡng theo khung chuẩn Cambridge English Primary.
              </p>
            </div>
            
            {/* NEW CAT BUTTON */}
            <div className="flex justify-center md:justify-end">
              <Link href="/adaptive-test">
                <button className="bg-gradient-to-r from-emerald-400 to-teal-500 border-b-4 border-teal-700 hover:border-b-0 hover:translate-y-1 text-white rounded-2xl px-4 md:px-6 py-2.5 md:py-3 font-black tracking-wider uppercase flex items-center gap-2 shadow-lg transition-all animate-bounce-subtle text-xs md:text-base">
                  <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
                  KIỂM TRA NĂNG LỰC BẰNG AI
                  <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              </Link>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {levels.map((lvl) => (
              <div
                key={lvl.id}
                className={`rounded-3xl border-4 ${lvl.bgColor} p-5 md:p-6 flex flex-col justify-between shadow-lg relative overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl group`}
              >
                {/* Level Tag floating */}
                <div className="absolute right-3 md:right-4 top-3 md:top-4 flex items-center gap-1.5 bg-white/90 dark:bg-slate-800/90 border border-slate-200/50 dark:border-slate-600 rounded-2xl px-2.5 md:px-3 py-1 shadow-sm">
                  <Award className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-500 dark:text-slate-400" />
                  <span className="text-[9px] md:text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">{lvl.cambridge}</span>
                </div>

                <div>
                  {/* Animal Mascot Avatar */}
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-4xl md:text-5xl shadow-md border-2 border-slate-200/60 dark:border-slate-600 mb-4 md:mb-6 group-hover:animate-bounce" style={{ animationDuration: "1s" }}>
                    {lvl.character}
                  </div>

                  <h4 className="text-xl md:text-2xl font-black">{lvl.title}</h4>
                  <p className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2 mt-0.5">{lvl.charName}</p>
                  
                  <span className="inline-block bg-white/70 dark:bg-slate-800/70 rounded-full px-2.5 py-0.5 text-xs font-bold mb-3 md:mb-4">
                    👦🏻 {lvl.ageRange}
                  </span>

                  <p className="text-xs md:text-sm font-bold text-slate-600 dark:text-slate-300 leading-relaxed mb-4 md:mb-6">
                    {lvl.description}
                  </p>
                </div>

                {/* Progress bar inside card */}
                <div className="mt-auto w-full pt-3 md:pt-4 border-t border-slate-200/30 dark:border-slate-600/30">
                  <div className="flex items-center justify-between text-[10px] md:text-xs font-extrabold mb-1">
                    <span>Tiến trình hoàn thành:</span>
                    <span className="font-mono">{lvl.mockProgress}%</span>
                  </div>
                  
                  <div className="w-full h-3 md:h-3.5 bg-slate-200/80 dark:bg-slate-700 rounded-full overflow-hidden border border-slate-300/40 dark:border-slate-600 p-0.5 mb-4 md:mb-6">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${lvl.progressBarColor}`}
                      style={{ width: `${lvl.mockProgress}%` }}
                    />
                  </div>

                  {/* Play Button */}
                  <button
                    onClick={() => setActiveModalLevel(lvl.id)}
                    className={`${lvl.btnClass} w-full py-3 md:py-3.5 text-xs md:text-sm tracking-wider uppercase flex items-center justify-center gap-1`}
                  >
                    CHƠI NGAY
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 4. History Widget */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl border-4 border-slate-100 dark:border-slate-700 p-5 md:p-8 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4 mb-4 md:mb-6 pb-3 md:pb-4 border-b-2 border-slate-100 dark:border-slate-700">
            <h3 className="text-lg md:text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Clock className="w-5 h-5 md:w-6 md:h-6 text-emerald-500 animate-spin" style={{ animationDuration: "8s" }} />
              Lịch sử luyện nói gần đây của bé
            </h3>
            <span className="text-[10px] md:text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-3 py-1 rounded-full">
              Đã làm {history.length} bài nói
            </span>
          </div>

          {loading ? (
            <div className="py-8 flex flex-col items-center justify-center text-slate-400 gap-2">
              <div className="w-8 h-8 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
              <span className="text-sm font-bold">Đang tải lịch sử...</span>
            </div>
          ) : history.length === 0 ? (
            <div className="py-8 text-center bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-600 px-4">
              <span className="text-5xl block mb-3">🏆</span>
              <p className="text-slate-600 dark:text-slate-300 font-extrabold text-sm">Con chưa có bài thu âm nào.</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
                Bé hãy nhấn nút <strong>CHƠI NGAY</strong> của các cấp độ Starters, Movers hoặc Flyers ở trên để thực hiện bài nói đầu tiên nhé!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700 max-h-[380px] overflow-y-auto pr-2">
              {history.map((item) => {
                const badgeColor =
                  item.level === "Starters"
                    ? "bg-pink-100 dark:bg-pink-950/50 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800"
                    : item.level === "Movers"
                    ? "bg-yellow-100 dark:bg-yellow-950/50 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800"
                    : "bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800";

                return (
                  <div key={item._id} className="py-3 md:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 md:gap-4 group transition-colors hover:bg-slate-50/40 dark:hover:bg-slate-800/40 px-2 md:px-3 rounded-2xl -mx-2 md:-mx-3">
                    
                    {/* Level icon + sentence */}
                    <div className="flex items-start gap-2.5 md:gap-3.5 max-w-xl min-w-0">
                      <div className={`shrink-0 text-[10px] md:text-xs font-extrabold uppercase px-2 md:px-2.5 py-1 rounded-xl border ${badgeColor} text-center`}>
                        <span className="block text-base md:text-lg mb-0.5">
                          {item.level === "Starters" ? "🦛" : item.level === "Movers" ? "🐒" : "🦁"}
                        </span>
                        {item.level}
                      </div>
                      
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs md:text-sm font-extrabold text-slate-700 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                            &quot;{item.sentence}&quot;
                          </p>
                          <span className={`inline-flex items-center gap-0.5 px-1.5 md:px-2 py-0.5 text-[8px] md:text-[9px] font-black uppercase rounded-md border ${
                            item.skill === "Listening" ? "bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400" :
                            item.skill === "Reading" ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400" :
                            item.skill === "Writing" ? "bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400" :
                            "bg-pink-50 dark:bg-pink-950/50 border-pink-200 dark:border-pink-800 text-pink-600 dark:text-pink-400"
                          }`}>
                            {item.skill === "Listening" ? <Headphones className="w-2.5 h-2.5" /> :
                             item.skill === "Reading" ? <BookOpen className="w-2.5 h-2.5" /> :
                             item.skill === "Writing" ? <PenTool className="w-2.5 h-2.5" /> :
                             <Mic className="w-2.5 h-2.5" />}
                            {item.skill || "Speaking"}
                          </span>
                        </div>
                        <p className="text-[10px] md:text-[11px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">
                          Ngày làm: {new Date(item.createdAt).toLocaleDateString("vi-VN", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Star badge & click link */}
                    <div className="flex items-center gap-3 md:gap-4 w-full sm:w-auto justify-between sm:justify-end border-t border-dashed border-slate-100 dark:border-slate-700 pt-2 md:pt-3 sm:pt-0 sm:border-0">
                      
                      {/* Interactive Stars */}
                      <div className="flex items-center bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-xl px-2 py-0.5 shrink-0">
                        {Array.from({ length: item.stars }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 md:w-3.5 md:h-3.5 text-amber-500 fill-amber-400" />
                        ))}
                        {Array.from({ length: 5 - item.stars }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 md:w-3.5 md:h-3.5 text-slate-200 dark:text-slate-600" />
                        ))}
                        <span className="text-[9px] md:text-[10px] font-black text-amber-700 dark:text-amber-400 ml-1.5 font-mono">
                          {item.score}/100
                        </span>
                      </div>

                      {/* Review details link */}
                      <Link href={`/result/${item._id}`}>
                        <button className="btn-3d-gray px-3 md:px-4 py-1.5 md:py-2 text-[10px] md:text-xs uppercase tracking-wider flex items-center gap-0.5 font-black hover:scale-105">
                          XEM LẠI
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </Link>

                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </section>

      </main>

      {/* 🚀 Playful Kid-Friendly Skill Selector Modal */}
      {activeModalLevel && (() => {
        const lvlObj = levels.find(l => l.id === activeModalLevel);
        if (!lvlObj) return null;
        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border-4 border-slate-200 dark:border-slate-700 shadow-2xl max-w-lg w-full relative overflow-hidden animate-bounce-subtle p-5 md:p-8">
              
              {/* Close Button */}
              <button 
                onClick={() => setActiveModalLevel(null)}
                className="absolute top-3 right-3 md:top-4 md:right-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 rounded-full p-2 border border-slate-200 dark:border-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Character Mascot Header */}
              <div className="flex items-center gap-3 md:gap-4 mb-5 md:mb-6 border-b-2 border-slate-100 dark:border-slate-700 pb-4">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 flex items-center justify-center text-3xl md:text-4xl shadow-sm shrink-0 animate-bounce">
                  {lvlObj.character}
                </div>
                <div>
                  <span className="bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md">
                    Cấp độ {lvlObj.title}
                  </span>
                  <h3 className="text-lg md:text-xl font-black text-slate-800 dark:text-slate-100 leading-tight">
                    Mascot {lvlObj.charName} chào con!
                  </h3>
                </div>
              </div>

              <p className="text-slate-600 dark:text-slate-300 font-extrabold text-xs md:text-sm text-center mb-5 md:mb-6 leading-relaxed bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-3">
                🌟 &quot;Bé muốn thử thách kỹ năng tiếng Anh nào cùng cô giáo AI hôm nay?&quot;
              </p>

              {/* Grid of 4 Skills */}
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                
                {/* 1. Speaking (Nói) */}
                <Link href={`/test/${lvlObj.id}?skill=speaking`} onClick={() => setActiveModalLevel(null)}>
                  <div className="bg-pink-50 dark:bg-pink-950/30 hover:bg-pink-100 dark:hover:bg-pink-950/50 border-2 border-pink-200 dark:border-pink-800 hover:border-pink-300 rounded-2xl p-3 md:p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 hover:-translate-y-1 shadow-sm group">
                    <span className="w-10 h-10 md:w-12 md:h-12 bg-white dark:bg-slate-800 rounded-xl border border-pink-100 dark:border-pink-800 flex items-center justify-center text-pink-500 shadow-sm mb-2 md:mb-3 group-hover:scale-110 transition-transform">
                      <Mic className="w-5 h-5 md:w-6 md:h-6" />
                    </span>
                    <span className="text-xs md:text-sm font-black text-pink-700 dark:text-pink-300 uppercase tracking-wide block">Luyện Nói</span>
                    <span className="text-[9px] md:text-[10px] font-bold text-pink-400 mt-0.5 block">Speaking Game</span>
                  </div>
                </Link>

                {/* 2. Listening (Nghe) */}
                <Link href={`/test/${lvlObj.id}?skill=listening`} onClick={() => setActiveModalLevel(null)}>
                  <div className="bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-950/50 border-2 border-blue-200 dark:border-blue-800 hover:border-blue-300 rounded-2xl p-3 md:p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 hover:-translate-y-1 shadow-sm group">
                    <span className="w-10 h-10 md:w-12 md:h-12 bg-white dark:bg-slate-800 rounded-xl border border-blue-100 dark:border-blue-800 flex items-center justify-center text-blue-500 shadow-sm mb-2 md:mb-3 group-hover:scale-110 transition-transform">
                      <Headphones className="w-5 h-5 md:w-6 md:h-6" />
                    </span>
                    <span className="text-xs md:text-sm font-black text-blue-700 dark:text-blue-300 uppercase tracking-wide block">Luyện Nghe</span>
                    <span className="text-[9px] md:text-[10px] font-bold text-blue-400 mt-0.5 block">Listening Game</span>
                  </div>
                </Link>

                {/* 3. Reading (Đọc) */}
                <Link href={`/test/${lvlObj.id}?skill=reading`} onClick={() => setActiveModalLevel(null)}>
                  <div className="bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 border-2 border-emerald-200 dark:border-emerald-800 hover:border-emerald-300 rounded-2xl p-3 md:p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 hover:-translate-y-1 shadow-sm group">
                    <span className="w-10 h-10 md:w-12 md:h-12 bg-white dark:bg-slate-800 rounded-xl border border-emerald-100 dark:border-emerald-800 flex items-center justify-center text-emerald-500 shadow-sm mb-2 md:mb-3 group-hover:scale-110 transition-transform">
                      <BookOpen className="w-5 h-5 md:w-6 md:h-6" />
                    </span>
                    <span className="text-xs md:text-sm font-black text-emerald-700 dark:text-emerald-300 uppercase tracking-wide block">Luyện Đọc</span>
                    <span className="text-[9px] md:text-[10px] font-bold text-emerald-400 mt-0.5 block">Reading Game</span>
                  </div>
                </Link>

                {/* 4. Writing (Viết) */}
                <Link href={`/test/${lvlObj.id}?skill=writing`} onClick={() => setActiveModalLevel(null)}>
                  <div className="bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-950/50 border-2 border-amber-200 dark:border-amber-800 hover:border-amber-300 rounded-2xl p-3 md:p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 hover:-translate-y-1 shadow-sm group">
                    <span className="w-10 h-10 md:w-12 md:h-12 bg-white dark:bg-slate-800 rounded-xl border border-amber-100 dark:border-amber-800 flex items-center justify-center text-amber-500 shadow-sm mb-2 md:mb-3 group-hover:scale-110 transition-transform">
                      <PenTool className="w-5 h-5 md:w-6 md:h-6" />
                    </span>
                    <span className="text-xs md:text-sm font-black text-amber-700 dark:text-amber-300 uppercase tracking-wide block">Luyện Viết</span>
                    <span className="text-[9px] md:text-[10px] font-bold text-amber-400 mt-0.5 block">Writing Game</span>
                  </div>
                </Link>

              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
}
