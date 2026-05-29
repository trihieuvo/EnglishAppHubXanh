"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Star, TrendingUp, Award, BookOpen, AlertTriangle, BarChart3, Mic, Headphones, PenTool, ChevronRight } from "lucide-react";

interface AssessmentData {
  _id: string;
  level: string;
  skill?: "Speaking" | "Listening" | "Reading" | "Writing";
  sentence: string;
  spokenText: string;
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

interface WordFrequency {
  word: string;
  count: number;
}

export default function DashboardPage() {
  const [assessments, setAssessments] = useState<AssessmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAssessments() {
      try {
        const res = await fetch("/api/assessments");
        if (!res.ok) {
          throw new Error("Không thể tải lịch sử bài luyện tập!");
        }
        const json = await res.json();
        if (json.success && json.data) {
          setAssessments(json.data);
        }
      } catch (err: any) {
        console.error("Lỗi tải dashboard:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchAssessments();
  }, []);

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-pastel-bg flex flex-col items-center justify-center p-6 text-center">
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-full border-8 border-blue-300 border-t-blue-500 animate-spin" />
          <span className="text-4xl absolute inset-0 flex items-center justify-center animate-bounce">📊</span>
        </div>
        <h2 className="text-2xl font-black text-slate-800 animate-pulse">
          Đang tải bảng tiến độ của con...
        </h2>
        <p className="text-sm text-slate-500 mt-2">
          Cô giáo AI đang tổng hợp thành tích học tập của bé! 🌟
        </p>
      </div>
    );
  }

  if (error || assessments.length === 0) {
    return (
      <div className="w-full min-h-screen bg-pastel-bg flex flex-col items-center justify-center p-6 text-center">
        <span className="text-6xl mb-4 animate-bounce">📭</span>
        <h2 className="text-2xl font-black text-slate-700">
          {error ? "Có lỗi xảy ra rồi..." : "Chưa có bài thi nào!"}
        </h2>
        <p className="text-sm text-slate-500 max-w-sm mt-2">
          {error
            ? "Không thể tải dữ liệu. Bé hãy thử lại sau nhé!"
            : "Con hãy bắt đầu luyện các kỹ năng tiếng Anh để xem tiến độ của mình tại đây nhé!"}
        </p>
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/">
            <button className="btn-3d-green px-8 py-3 uppercase tracking-wider font-black text-sm">
              BẮT ĐẦU LUYỆN TẬP 🚀
            </button>
          </Link>
          <Link href="/interactive-test">
            <button className="btn-3d-pink px-8 py-3 uppercase tracking-wider font-black text-sm">
              THI TƯƠNG TÁC AI 🤖
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const totalAssessments = assessments.length;
  const avgScore = Math.round(
    assessments.reduce((sum, a) => sum + a.score, 0) / totalAssessments
  );
  const avgStars = (
    assessments.reduce((sum, a) => sum + a.stars, 0) / totalAssessments
  ).toFixed(1);

  // Compute skill breakdowns
  const skillStats: Record<string, { count: number; totalScore: number; totalStars: number }> = {
    Speaking: { count: 0, totalScore: 0, totalStars: 0 },
    Listening: { count: 0, totalScore: 0, totalStars: 0 },
    Reading: { count: 0, totalScore: 0, totalStars: 0 },
    Writing: { count: 0, totalScore: 0, totalStars: 0 }
  };

  assessments.forEach((a) => {
    const s = a.skill || "Speaking";
    if (skillStats[s]) {
      skillStats[s].count += 1;
      skillStats[s].totalScore += a.score;
      skillStats[s].totalStars += a.stars;
    }
  });

  const levelCounts: Record<string, number> = {};
  assessments.forEach((a) => {
    levelCounts[a.level] = (levelCounts[a.level] || 0) + 1;
  });

  // Calculate top wrong speaking words
  const wordFrequency: Record<string, number> = {};
  assessments.forEach((a) => {
    if ((a.skill || "Speaking") === "Speaking") {
      a.mispronouncedWords.forEach((word) => {
        const w = word.toLowerCase().trim();
        if (w) {
          wordFrequency[w] = (wordFrequency[w] || 0) + 1;
        }
      });
    }
  });

  const topWrongWords: WordFrequency[] = Object.entries(wordFrequency)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const levelColor: Record<string, string> = {
    Starters: "bg-pink-100 text-pink-700 border-pink-300",
    Movers: "bg-amber-100 text-amber-700 border-amber-300",
    Flyers: "bg-blue-100 text-blue-700 border-blue-300",
  };

  const levelAnimal: Record<string, string> = {
    Starters: "🦛",
    Movers: "🐒",
    Flyers: "🦁",
  };

  return (
    <div className="w-full min-h-screen pb-16 relative bg-pastel-bg dark:bg-dark-bg">
      <div className="bubble-bg top-20 left-10 w-24 h-24 animate-float" style={{ animationDelay: "1s" }} />
      <div className="bubble-bg bottom-20 right-12 w-28 h-28 animate-float" style={{ animationDelay: "3s" }} />

      <header className="w-full bg-white dark:bg-slate-900 border-b-4 border-slate-100 dark:border-slate-700 py-3 md:py-4 px-3 md:px-4 sticky top-0 z-30 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/">
            <button className="btn-3d-gray px-4 py-2.5 text-xs font-black flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" />
              QUAY VỀ
            </button>
          </Link>

          <div className="flex items-center gap-1.5 md:gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 px-3 md:px-4 py-1 md:py-1.5 rounded-2xl">
            <BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-blue-500" />
            <span className="text-[10px] md:text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">TIẾN ĐỘ HỌC TẬP</span>
          </div>

          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center border-2 border-emerald-300 dark:border-emerald-700">
            <span className="text-lg">📈</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl w-full mx-auto px-3 md:px-4 mt-6 md:mt-8 flex flex-col gap-6 md:gap-8">
        
        {/* 1. Scoreboard Summary Card */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl border-4 border-amber-200 dark:border-amber-900 p-4 md:p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-2 right-6 text-3xl animate-bounce" style={{ animationDelay: "1s" }}>🏆</div>

          <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100 mb-4 md:mb-6 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-emerald-500" />
            Tổng quan thành tích của bé
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 text-center">
              <BookOpen className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <span className="text-3xl font-black text-blue-600 block">{totalAssessments}</span>
              <span className="text-xs font-bold text-slate-500 uppercase">Bài đã làm</span>
            </div>

            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-4 text-center">
              <Award className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <span className="text-3xl font-black text-emerald-600 block">{avgScore}</span>
              <span className="text-xs font-bold text-slate-500 uppercase">Điểm trung bình</span>
            </div>

            <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 text-center">
              <Star className="w-8 h-8 text-amber-500 mx-auto mb-2 fill-amber-400" />
              <span className="text-3xl font-black text-amber-600 block">{avgStars}</span>
              <span className="text-xs font-bold text-slate-500 uppercase">Sao trung bình</span>
            </div>

            <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-4 text-center">
              <span className="text-3xl block mb-1">📚</span>
              <span className="text-3xl font-black text-purple-600 block">{Object.keys(levelCounts).length}</span>
              <span className="text-xs font-bold text-slate-500 uppercase">Level đã học</span>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {Object.entries(levelCounts).map(([level, count]) => (
              <div
                key={level}
                className={`px-4 py-2 rounded-xl border-2 font-bold text-sm flex items-center gap-2 ${levelColor[level] || "bg-slate-100 text-slate-600 border-slate-300"}`}
              >
                <span className="text-lg">{levelAnimal[level] || "📖"}</span>
                <span>{level}: {count} bài</span>
              </div>
            ))}
          </div>
        </section>

        {/* 2. Skill-by-skill Breakdown Performance Rings */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl border-4 border-slate-100 dark:border-slate-700 p-4 md:p-6 shadow-xl">
          <h3 className="text-lg md:text-xl font-black text-slate-800 dark:text-slate-100 mb-4 md:mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
            <TrendingUp className="w-6 h-6 text-indigo-500" />
            Chi tiết 4 kỹ năng của bé 🌟
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            {/* Speaking */}
            <div className="bg-pink-50/50 border-2 border-pink-200 rounded-2xl p-4 text-center">
              <span className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-pink-500 mx-auto border border-pink-100 shadow-sm mb-3">
                <Mic className="w-5 h-5" />
              </span>
              <h4 className="text-sm font-black text-pink-700 uppercase">Speaking (Nói)</h4>
              <p className="text-[10px] text-slate-400 font-extrabold mt-0.5">Số bài: {skillStats.Speaking.count}</p>
              
              <div className="mt-4">
                <span className="text-2xl font-black text-pink-600 block">
                  {skillStats.Speaking.count > 0 ? Math.round(skillStats.Speaking.totalScore / skillStats.Speaking.count) : 0}
                  <span className="text-xs text-slate-400 font-normal"> /100</span>
                </span>
                <span className="text-xs font-bold text-slate-500 block mt-1">
                  ⭐ {skillStats.Speaking.count > 0 ? (skillStats.Speaking.totalStars / skillStats.Speaking.count).toFixed(1) : "0.0"} sao
                </span>
              </div>
            </div>

            {/* Listening */}
            <div className="bg-blue-50/50 border-2 border-blue-200 rounded-2xl p-4 text-center">
              <span className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-500 mx-auto border border-blue-100 shadow-sm mb-3">
                <Headphones className="w-5 h-5" />
              </span>
              <h4 className="text-sm font-black text-blue-700 uppercase">Listening (Nghe)</h4>
              <p className="text-[10px] text-slate-400 font-extrabold mt-0.5">Số bài: {skillStats.Listening.count}</p>
              
              <div className="mt-4">
                <span className="text-2xl font-black text-blue-600 block">
                  {skillStats.Listening.count > 0 ? Math.round(skillStats.Listening.totalScore / skillStats.Listening.count) : 0}
                  <span className="text-xs text-slate-400 font-normal"> /100</span>
                </span>
                <span className="text-xs font-bold text-slate-500 block mt-1">
                  ⭐ {skillStats.Listening.count > 0 ? (skillStats.Listening.totalStars / skillStats.Listening.count).toFixed(1) : "0.0"} sao
                </span>
              </div>
            </div>

            {/* Reading */}
            <div className="bg-emerald-50/50 border-2 border-emerald-200 rounded-2xl p-4 text-center">
              <span className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-500 mx-auto border border-emerald-100 shadow-sm mb-3">
                <BookOpen className="w-5 h-5" />
              </span>
              <h4 className="text-sm font-black text-emerald-700 uppercase">Reading (Đọc)</h4>
              <p className="text-[10px] text-slate-400 font-extrabold mt-0.5">Số bài: {skillStats.Reading.count}</p>
              
              <div className="mt-4">
                <span className="text-2xl font-black text-emerald-600 block">
                  {skillStats.Reading.count > 0 ? Math.round(skillStats.Reading.totalScore / skillStats.Reading.count) : 0}
                  <span className="text-xs text-slate-400 font-normal"> /100</span>
                </span>
                <span className="text-xs font-bold text-slate-500 block mt-1">
                  ⭐ {skillStats.Reading.count > 0 ? (skillStats.Reading.totalStars / skillStats.Reading.count).toFixed(1) : "0.0"} sao
                </span>
              </div>
            </div>

            {/* Writing */}
            <div className="bg-amber-50/50 border-2 border-amber-200 rounded-2xl p-4 text-center">
              <span className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-amber-500 mx-auto border border-amber-100 shadow-sm mb-3">
                <PenTool className="w-5 h-5" />
              </span>
              <h4 className="text-sm font-black text-amber-700 uppercase">Writing (Viết)</h4>
              <p className="text-[10px] text-slate-400 font-extrabold mt-0.5">Số bài: {skillStats.Writing.count}</p>
              
              <div className="mt-4">
                <span className="text-2xl font-black text-amber-600 block">
                  {skillStats.Writing.count > 0 ? Math.round(skillStats.Writing.totalScore / skillStats.Writing.count) : 0}
                  <span className="text-xs text-slate-400 font-normal"> /100</span>
                </span>
                <span className="text-xs font-bold text-slate-500 block mt-1">
                  ⭐ {skillStats.Writing.count > 0 ? (skillStats.Writing.totalStars / skillStats.Writing.count).toFixed(1) : "0.0"} sao
                </span>
              </div>
            </div>

          </div>
        </section>

        {/* 3. Speaking mispronounced words log */}
        {topWrongWords.length > 0 && (
          <section className="bg-white dark:bg-slate-900 rounded-3xl border-4 border-rose-200 dark:border-rose-900 p-4 md:p-6 shadow-xl">
            <h3 className="text-lg md:text-xl font-black text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-rose-500" />
              Top từ bé hay phát âm sai nhất khi Luyện Nói 🔊
            </h3>

            <div className="flex flex-wrap gap-3">
              {topWrongWords.map((item, index) => {
                const severity = item.count >= 3 ? "bg-rose-500 text-white" : item.count >= 2 ? "bg-orange-400 text-white" : "bg-yellow-300 text-slate-800";
                return (
                  <div
                    key={item.word}
                    className="flex items-center gap-2 bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2 shadow-sm"
                  >
                    <span className={`text-xs font-black px-2 py-0.5 rounded-md ${severity}`}>
                      #{index + 1}
                    </span>
                    <span className="text-sm font-bold text-slate-700 uppercase">{item.word}</span>
                    <span className="text-xs font-bold text-slate-400">× {item.count}</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 4. Complete assessment history */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl border-4 border-slate-100 dark:border-slate-700 p-4 md:p-6 shadow-xl">
          <h3 className="text-lg md:text-xl font-black text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-500" />
            Lịch sử học tập của con 📝
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200 text-slate-400">
                  <th className="text-left py-3 px-2 text-xs font-black uppercase">Ngày</th>
                  <th className="text-left py-3 px-2 text-xs font-black uppercase">Kỹ năng</th>
                  <th className="text-left py-3 px-2 text-xs font-black uppercase">Cấp độ</th>
                  <th className="text-left py-3 px-2 text-xs font-black uppercase">Bài tập / Câu mẫu</th>
                  <th className="text-center py-3 px-2 text-xs font-black uppercase">Điểm</th>
                  <th className="text-center py-3 px-2 text-xs font-black uppercase">Sao</th>
                  <th className="text-center py-3 px-2 text-xs font-black uppercase">Xem lại</th>
                </tr>
              </thead>
              <tbody>
                {assessments.map((a) => {
                  const s = a.skill || "Speaking";
                  const badgeColor =
                    s === "Listening" ? "bg-blue-50 border-blue-200 text-blue-600" :
                    s === "Reading" ? "bg-emerald-50 border-emerald-200 text-emerald-600" :
                    s === "Writing" ? "bg-amber-50 border-amber-200 text-amber-600" :
                    "bg-pink-50 border-pink-200 text-pink-600";

                  return (
                    <tr
                      key={a._id}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-3 px-2 text-xs text-slate-500">
                        {new Date(a.createdAt).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="py-3 px-2">
                        <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 text-[9px] font-black uppercase rounded-md border ${badgeColor}`}>
                          {s === "Listening" ? <Headphones className="w-2.5 h-2.5" /> :
                           s === "Reading" ? <BookOpen className="w-2.5 h-2.5" /> :
                           s === "Writing" ? <PenTool className="w-2.5 h-2.5" /> :
                           <Mic className="w-2.5 h-2.5" />}
                          {s}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-1 rounded-lg border text-xs font-bold ${levelColor[a.level] || "bg-slate-100 text-slate-600"}`}>
                          {levelAnimal[a.level]} {a.level}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-xs font-bold text-slate-700 max-w-xs truncate">
                        "{a.sentence}"
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className={`font-black text-lg ${a.score >= 80 ? "text-emerald-500" : a.score >= 50 ? "text-amber-500" : "text-rose-500"}`}>
                          {a.score}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <div className="flex items-center justify-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${i < a.stars ? "text-amber-400 fill-amber-400" : "text-slate-200"}`}
                            />
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <Link href={`/result/${a._id}`}>
                          <button className="btn-3d-gray px-3 py-1.5 text-[10px] font-black flex items-center justify-center mx-auto gap-0.5 hover:scale-105 active:translate-y-0.5">
                            CHI TIẾT
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <div className="text-center mt-4 flex flex-col sm:flex-row justify-center gap-3 md:gap-4">
          <Link href="/">
            <button className="btn-3d-green px-8 py-4 text-sm tracking-wider uppercase">
              LUYỆN THÊM BÀI MỚI 🚀
            </button>
          </Link>
          <Link href="/interactive-test">
            <button className="btn-3d-pink px-8 py-4 text-sm tracking-wider uppercase">
              THI TƯƠNG TÁC AI 🤖
            </button>
          </Link>
        </div>
      </main>
    </div>
  );
}
