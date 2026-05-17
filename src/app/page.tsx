"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Award, Trophy, Star, Clock, ChevronRight, Volume2, Sparkles, BarChart3 } from "lucide-react";

interface AssessmentItem {
  _id: string;
  level: "Starters" | "Movers" | "Flyers";
  sentence: string;
  score: number;
  stars: number;
  createdAt: string;
}

export default function Dashboard() {
  const [history, setHistory] = useState<AssessmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalStars, setTotalStars] = useState(0);

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
      bgColor: "bg-pink-100 border-pink-300 text-pink-700",
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
      bgColor: "bg-yellow-100 border-yellow-300 text-yellow-700",
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
      bgColor: "bg-blue-100 border-blue-300 text-blue-700",
      accentBg: "bg-blue-500",
      btnClass: "btn-3d-blue",
      description: "Thử thách kể chuyện qua tranh ảnh, miêu tả sở thích cá nhân và các chuyến du lịch.",
      progressBarColor: "bg-blue-500",
      mockProgress: 0,
    },
  ];

  return (
    <div className="w-full min-h-screen pb-20 relative bg-pastel-bg">
      {/* Playful Floating Bubbles Background Decor */}
      <div className="bubble-bg top-10 left-10 w-24 h-24 animate-float" style={{ animationDelay: "0s" }} />
      <div className="bubble-bg top-40 right-20 w-32 h-32 animate-float" style={{ animationDelay: "2s" }} />
      <div className="bubble-bg bottom-20 left-12 w-28 h-28 animate-float" style={{ animationDelay: "4s" }} />
      
      {/* 1. Playful Welcome Header */}
      <header className="w-full bg-white border-b-4 border-amber-200/50 shadow-md py-6 px-4 md:px-8 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-3">
            <span className="text-4xl animate-bounce" style={{ animationDuration: "2s" }}>🚀</span>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-1">
                KidSpeak <span className="text-emerald-500">English</span>
              </h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                Cambridge Primary Speaking Hub
              </p>
            </div>
          </div>

          {/* User Kid Status Dashboard */}
          <div className="flex items-center gap-4 bg-slate-50 border-2 border-slate-200 rounded-2xl px-5 py-2.5 shadow-inner">
            <Link href="/dashboard">
              <button className="btn-3d-blue px-3 py-1.5 text-xs font-black flex items-center gap-1">
                <BarChart3 className="w-4 h-4" />
                TIẾN ĐỘ
              </button>
            </Link>

            <div className="flex items-center gap-2 border-r-2 border-slate-200 pr-4">
              <span className="text-2xl">👦🏻</span>
              <div>
                <p className="text-xs font-bold text-slate-400">Học viên nhí</p>
                <p className="text-sm font-extrabold text-slate-700">Tâm Anh</p>
              </div>
            </div>

            {/* Total Star Counter */}
            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1 animate-bounce-subtle">
              <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
              <span className="text-lg font-black text-amber-600 font-mono">
                {totalStars + 10} {/* Seeding 10 base stars for kid encouragement */}
              </span>
            </div>

            {/* Medal Badges */}
            <div className="flex items-center gap-1 bg-yellow-50 border border-yellow-200 rounded-xl px-2.5 py-1">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span className="text-xs font-black text-yellow-700">
                {totalStars > 12 ? "VÀNG" : totalStars > 5 ? "BẠC" : "ĐỒNG"}
              </span>
            </div>
          </div>

        </div>
      </header>

      {/* 2. Welcome Banner */}
      <main className="max-w-6xl mx-auto px-4 md:px-8 mt-10">
        
        {/* Banner Section */}
        <section className="bg-gradient-to-r from-yellow-300 via-amber-300 to-orange-400 rounded-3xl border-4 border-amber-400 shadow-xl p-8 relative overflow-hidden mb-12">
          {/* Decorative background vectors */}
          <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full -mr-16 -mt-16" />
          <div className="absolute left-1/3 bottom-0 w-32 h-32 bg-white/10 rounded-full -mb-16" />
          
          <div className="relative z-10 max-w-2xl text-slate-900">
            <span className="bg-white/95 border-2 border-amber-500 text-amber-700 font-black text-xs px-3.5 py-1.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1 mb-4 shadow-sm animate-bounce-subtle">
              <Sparkles className="w-3.5 h-3.5" />
              Vừa học vừa chơi cực vui
            </span>
            
            <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight text-amber-950">
              Luyện Nói Tiếng Anh Chuẩn Cambridge Cùng AI!
            </h2>
            <p className="text-base md:text-lg font-extrabold text-amber-900/90 mt-4 leading-relaxed">
              Bé thỏa sức đóng vai các con vật dễ thương, thu âm giọng nói siêu đỉnh và nhận vô vàn sao vàng cùng huy hiệu từ cô giáo AI nhé! 🦁🐒🦛
            </p>
          </div>
          
          {/* Mascot absolute position for desktop */}
          <span className="hidden md:inline absolute right-12 bottom-4 text-9xl animate-float">🎉</span>
        </section>

        {/* 3. Level Selection Section */}
        <section className="mb-14">
          <div className="text-center md:text-left mb-8">
            <h3 className="text-2xl font-black text-slate-800 tracking-tight flex items-center justify-center md:justify-start gap-2">
              🏆 Bé chọn Cấp độ để thử thách nhé:
            </h3>
            <p className="text-slate-500 font-bold text-sm mt-1">
              Mỗi cấp độ được biên soạn kỹ lưỡng theo khung chuẩn Cambridge English Primary.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {levels.map((lvl) => (
              <div
                key={lvl.id}
                className={`rounded-3xl border-4 ${lvl.bgColor} p-6 flex flex-col justify-between shadow-lg relative overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl group`}
              >
                {/* Level Tag floating */}
                <div className="absolute right-4 top-4 flex items-center gap-1.5 bg-white/90 border border-slate-200/50 rounded-2xl px-3 py-1 shadow-sm">
                  <Award className="w-4 h-4 text-slate-500" />
                  <span className="text-[10px] font-black uppercase tracking-wider">{lvl.cambridge}</span>
                </div>

                <div>
                  {/* Animal Mascot Avatar */}
                  <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center text-5xl shadow-md border-2 border-slate-200/60 mb-6 group-hover:animate-bounce" style={{ animationDuration: "1s" }}>
                    {lvl.character}
                  </div>

                  <h4 className="text-2xl font-black">{lvl.title}</h4>
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2 mt-0.5">{lvl.charName}</p>
                  
                  <span className="inline-block bg-white/70 rounded-full px-2.5 py-0.5 text-xs font-bold mb-4">
                    👦🏻 {lvl.ageRange}
                  </span>

                  <p className="text-sm font-bold text-slate-600 leading-relaxed mb-6">
                    {lvl.description}
                  </p>
                </div>

                {/* Progress bar inside card */}
                <div className="mt-auto w-full pt-4 border-t border-slate-200/30">
                  <div className="flex items-center justify-between text-xs font-extrabold mb-1">
                    <span>Tiến trình hoàn thành:</span>
                    <span className="font-mono">{lvl.mockProgress}%</span>
                  </div>
                  
                  <div className="w-full h-3.5 bg-slate-200/80 rounded-full overflow-hidden border border-slate-300/40 p-0.5 mb-6">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${lvl.progressBarColor}`}
                      style={{ width: `${lvl.mockProgress}%` }}
                    />
                  </div>

                  {/* Play Button */}
                  <Link href={`/test/${lvl.id}`} className="w-full block">
                    <button className={`${lvl.btnClass} w-full py-3.5 text-sm tracking-wider uppercase flex items-center justify-center gap-1`}>
                      CHƠI NGAY
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 4. History Widget */}
        <section className="bg-white rounded-3xl border-4 border-slate-100 p-8 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b-2 border-slate-100">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <Clock className="w-6 h-6 text-emerald-500 animate-spin" style={{ animationDuration: "8s" }} />
              Lịch sử luyện nói gần đây của bé
            </h3>
            <span className="text-xs font-bold bg-slate-100 text-slate-500 px-3 py-1 rounded-full">
              Đã làm {history.length} bài nói
            </span>
          </div>

          {loading ? (
            <div className="py-8 flex flex-col items-center justify-center text-slate-400 gap-2">
              <div className="w-8 h-8 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
              <span className="text-sm font-bold">Đang tải lịch sử...</span>
            </div>
          ) : history.length === 0 ? (
            <div className="py-8 text-center bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200 px-4">
              <span className="text-5xl block mb-3">🏆</span>
              <p className="text-slate-600 font-extrabold text-sm">Con chưa có bài thu âm nào.</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Bé hãy nhấn nút <strong>CHƠI NGAY</strong> của các cấp độ Starters, Movers hoặc Flyers ở trên để thực hiện bài nói đầu tiên nhé!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto pr-2">
              {history.map((item) => {
                const badgeColor =
                  item.level === "Starters"
                    ? "bg-pink-100 text-pink-700 border-pink-200"
                    : item.level === "Movers"
                    ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                    : "bg-blue-100 text-blue-700 border-blue-200";

                return (
                  <div key={item._id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group transition-colors hover:bg-slate-50/40 px-3 rounded-2xl -mx-3">
                    
                    {/* Level icon + sentence */}
                    <div className="flex items-start gap-3.5 max-w-xl">
                      <div className={`shrink-0 text-xs font-extrabold uppercase px-2.5 py-1 rounded-xl border ${badgeColor} text-center`}>
                        <span className="block text-lg mb-0.5">
                          {item.level === "Starters" ? "🦛" : item.level === "Movers" ? "🐒" : "🦁"}
                        </span>
                        {item.level}
                      </div>
                      
                      <div>
                        <p className="text-sm font-extrabold text-slate-700 group-hover:text-emerald-600 transition-colors line-clamp-1">
                          "{item.sentence}"
                        </p>
                        <p className="text-[11px] font-bold text-slate-400 mt-0.5">
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
                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t border-dashed border-slate-100 pt-3 sm:pt-0 sm:border-0">
                      
                      {/* Interactive Stars */}
                      <div className="flex items-center bg-amber-50 border border-amber-200 rounded-xl px-2 py-0.5 shrink-0">
                        {Array.from({ length: item.stars }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                        ))}
                        {Array.from({ length: 5 - item.stars }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 text-slate-200" />
                        ))}
                        <span className="text-[10px] font-black text-amber-700 ml-1.5 font-mono">
                          {item.score}/100
                        </span>
                      </div>

                      {/* Review details link */}
                      <Link href={`/result/${item._id}`}>
                        <button className="btn-3d-gray px-4 py-2 text-xs uppercase tracking-wider flex items-center gap-0.5 font-black hover:scale-105">
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
    </div>
  );
}
