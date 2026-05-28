"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  Database,
  Image as ImageIcon,
  Loader2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Tag,
  BookOpen,
  PenTool,
  X,
  Trash2,
  Filter,
  Layers,
  ChevronRight,
  RefreshCw,
  HelpCircle
} from "lucide-react";

interface QuestionData {
  _id: string;
  id: string;
  level: "Starters" | "Movers" | "Flyers";
  part: number;
  type: string;
  imagePath: string;
  contextTags: string[];
  examinerScript: string;
  evaluationCriteria: {
    expectedKeywords: string[];
    targetGrammar: string[];
  };
  createdAt: string;
}

export default function CambridgeImportPage() {
  // Questions list state
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  
  // Table level filter tab: "All" | "Starters" | "Movers" | "Flyers"
  const [selectedFilter, setSelectedFilter] = useState<string>("All");

  // Edit mode states
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState("");

  // Form states
  const [qId, setQId] = useState("");
  const [level, setLevel] = useState<"Starters" | "Movers" | "Flyers">("Starters");
  const [part, setPart] = useState("1");
  const [type, setType] = useState("Scene_Description");
  const [customType, setCustomType] = useState("");
  const [examinerScript, setExaminerScript] = useState("");
  const [contextTags, setContextTags] = useState("");
  const [expectedKeywords, setExpectedKeywords] = useState("");
  const [targetGrammar, setTargetGrammar] = useState("");
  
  // Image file & preview states
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Submit states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Load questions list on mount
  const fetchQuestions = async () => {
    setLoadingList(true);
    setListError(null);
    try {
      const res = await fetch("/api/questions");
      if (!res.ok) {
        throw new Error("Không thể tải danh sách học liệu hiện tại!");
      }
      const json = await res.json();
      if (json.success && json.data) {
        setQuestions(json.data);
      }
    } catch (err: any) {
      console.error("Lỗi lấy danh sách học liệu:", err);
      setListError(err.message);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  // Handle Drag & Drop events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const isPdf = file.name.endsWith(".pdf") || file.type === "application/pdf";
      const isImg = file.type.startsWith("image/");
      
      if (!isPdf && !isImg) {
        showToast("error", "Vui lòng chọn tệp tin hình ảnh hoặc tệp PDF Cambridge nhé!");
        return;
      }
      setImageFile(file);
      if (isImg) {
        setImagePreview(URL.createObjectURL(file));
      } else {
        setImagePreview(null);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const isPdf = file.name.endsWith(".pdf") || file.type === "application/pdf";
      const isImg = file.type.startsWith("image/");
      
      if (!isPdf && !isImg) {
        showToast("error", "Vui lòng chọn tệp tin hình ảnh hoặc tệp PDF Cambridge nhé!");
        return;
      }
      setImageFile(file);
      if (isImg) {
        setImagePreview(URL.createObjectURL(file));
      } else {
        setImagePreview(null);
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    // Auto clear toast after 6 seconds
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 6000);
  };

  // Reset form helper
  const resetForm = () => {
    setQId("");
    setLevel("Starters");
    setPart("1");
    setType("Scene_Description");
    setCustomType("");
    setExaminerScript("");
    setContextTags("");
    setExpectedKeywords("");
    setTargetGrammar("");
    removeImage();
    setIsEditing(false);
    setEditingId("");
  };

  // Handle Edit question (Load into form)
  const handleEdit = (q: QuestionData) => {
    setIsEditing(true);
    setEditingId(q.id);
    setQId(q.id);
    setLevel(q.level);
    setPart(String(q.part));
    
    const standardTypes = ["Scene_Description", "Object_Card", "Storytelling", "Find_Differences"];
    if (standardTypes.includes(q.type)) {
      setType(q.type);
      setCustomType("");
    } else {
      setType("Custom");
      setCustomType(q.type);
    }
    
    setExaminerScript(q.examinerScript);
    setContextTags(q.contextTags ? q.contextTags.join(", ") : "");
    setExpectedKeywords(q.evaluationCriteria?.expectedKeywords ? q.evaluationCriteria.expectedKeywords.join(", ") : "");
    setTargetGrammar(q.evaluationCriteria?.targetGrammar ? q.evaluationCriteria.targetGrammar.join(", ") : "");
    
    setImageFile(null);
    setImagePreview(q.imagePath); // display current Cloudinary URL
    
    // Smooth scroll to top form
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handle Delete question
  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm(
      `Bé/Admin có chắc chắn muốn xóa vĩnh viễn học liệu mã '${id}' không? Hành động này không thể hoàn tác! 🗑️`
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/questions?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gặp sự cố khi xóa học liệu!");
      }
      showToast("success", `Đã xóa thành công học liệu mã '${id}' khỏi cơ sở dữ liệu! 🗑️`);
      fetchQuestions();
      
      // If we are currently editing this question, reset the form
      if (isEditing && editingId === id) {
        resetForm();
      }
    } catch (err: any) {
      showToast("error", err.message || "Không thể xóa học liệu!");
    }
  };

  // AI Auto-digitalizer function
  const handleAutoDigitalize = async () => {
    if (!imageFile) {
      showToast("error", "Bé/Admin vui lòng chọn hoặc kéo thả một tệp hình ảnh trước nhé! 📸");
      return;
    }

    setIsAnalyzing(true);
    setToast(null);

    try {
      const formData = new FormData();
      formData.append("image", imageFile);

      console.log("🤖 Đang tải ảnh lên AI Vision API để phân tích tự động...");
      const res = await fetch("/api/questions/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gặp lỗi phân tích ảnh.");
      }

      if (data.success && data.data) {
        const item = data.data;
        setQId(item.id || "");
        setLevel(item.level || "Starters");
        setPart(item.part ? String(item.part) : "1");
        
        const standardTypes = ["Scene_Description", "Object_Card", "Storytelling", "Find_Differences"];
        if (standardTypes.includes(item.type)) {
          setType(item.type);
          setCustomType("");
        } else {
          setType("Custom");
          setCustomType(item.type || "");
        }
        
        setExaminerScript(item.examinerScript || "");
        setContextTags(item.contextTags ? item.contextTags.join(", ") : "");
        setExpectedKeywords(item.expectedKeywords ? item.expectedKeywords.join(", ") : "");
        setTargetGrammar(item.targetGrammar ? item.targetGrammar.join(", ") : "");

        showToast("success", "AI đã phân tích ảnh bóc tách và tự động điền đầy đủ siêu dữ liệu cực chuẩn Cambridge! Bạn hãy kiểm tra lại và nhấn nút lưu nhé! ✨🤖");
      }
    } catch (err: any) {
      console.error("Lỗi tự động điền bằng AI:", err);
      showToast("error", err.message || "Trí tuệ Nhân tạo phân tích ảnh bóc tách thất bại!");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Submit Form Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validations
    if (!qId.trim()) {
      showToast("error", "Bé/Admin ơi, hãy nhập mã ID duy nhất cho học liệu nhé!");
      return;
    }
    if (!examinerScript.trim()) {
      showToast("error", "Admin vui lòng nhập kịch bản phát âm của Giám khảo AI!");
      return;
    }
    if (!imageFile && !imagePreview) {
      showToast("error", "Admin cần tải lên hình ảnh bóc tách cắt từ tệp PDF đề thi!");
      return;
    }

    const partNum = parseInt(part, 10);
    if (isNaN(partNum)) {
      showToast("error", "Phần thi (Part) phải là một số nguyên hợp lệ!");
      return;
    }

    setIsSubmitting(true);
    setToast(null);

    try {
      const formData = new FormData();
      formData.append("id", qId.trim());
      formData.append("level", level);
      formData.append("part", part);
      
      const finalType = type === "Custom" ? customType.trim() : type;
      formData.append("type", finalType || "Scene_Description");
      
      formData.append("examinerScript", examinerScript.trim());
      formData.append("contextTags", contextTags.trim());
      formData.append("expectedKeywords", expectedKeywords.trim());
      formData.append("targetGrammar", targetGrammar.trim());
      
      if (imageFile) {
        formData.append("image", imageFile);
      }

      console.log(isEditing ? "📤 Đang cập nhật dữ liệu học liệu..." : "📤 Đang gửi dữ liệu học liệu lên Cloudinary & MongoDB...");
      const res = await fetch("/api/questions", {
        method: isEditing ? "PUT" : "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gặp sự cố không xác định khi upload!");
      }

      if (isEditing) {
        showToast("success", `Cập nhật học liệu mã '${qId}' thành công! 🎉`);
      } else {
        showToast("success", `Số hóa học liệu mã '${qId}' lên Cloudinary và cơ sở dữ liệu MongoDB thành công! 🎉`);
      }
      resetForm();
      // Re-fetch questions list
      fetchQuestions();
    } catch (err: any) {
      console.error("Lỗi gửi import:", err);
      showToast("error", err.message || "Không thể đồng bộ học liệu lên đám mây!");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter questions dynamically
  const filteredQuestions = questions.filter((q) => {
    if (selectedFilter === "All") return true;
    return q.level === selectedFilter;
  });

  const levelBadges: Record<string, string> = {
    Starters: "bg-pink-100 text-pink-700 border-pink-300",
    Movers: "bg-amber-100 text-amber-700 border-amber-300",
    Flyers: "bg-blue-100 text-blue-700 border-blue-300",
  };

  const levelAnimals: Record<string, string> = {
    Starters: "🦛",
    Movers: "🐒",
    Flyers: "🦁",
  };

  return (
    <div className="w-full min-h-screen pb-20 relative bg-pastel-bg flex flex-col font-sans">
      {/* Decorative Bubble Backgrounds */}
      <div className="bubble-bg top-24 left-10 w-24 h-24 animate-float" style={{ animationDelay: "1s" }} />
      <div className="bubble-bg bottom-16 right-16 w-28 h-28 animate-float" style={{ animationDelay: "3s" }} />

      {/* Navigation Header */}
      <header className="w-full bg-white border-b-4 border-slate-100 py-4 px-4 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/dashboard">
            <button className="btn-3d-gray px-4 py-2.5 text-xs font-black flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" />
              QUAY VỀ
            </button>
          </Link>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-4 py-1.5 rounded-2xl shadow-inner">
            <Layers className="w-5 h-5 text-indigo-500" />
            <span className="text-xs font-black text-slate-700 uppercase tracking-wider">Cambridge Digitalizer</span>
          </div>

          <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center border-2 border-indigo-200">
            <span className="text-lg">☁️</span>
          </div>
        </div>
      </header>

      {/* Main Workspace content */}
      <main className="max-w-6xl w-full mx-auto px-4 mt-8 flex flex-col gap-8 flex-1">
        
        {/* Banner Alert Toast */}
        {toast && (
          <div
            className={`w-full p-4 rounded-3xl border-2 shadow-md flex items-start gap-3 animate-bounce-subtle z-20 ${
              toast.type === "success"
                ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                : "bg-rose-50 border-rose-300 text-rose-800"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="w-6 h-6 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-6 h-6 shrink-0 text-rose-600" />
            )}
            <div className="flex-1">
              <h4 className="font-black text-sm uppercase tracking-wide">
                {toast.type === "success" ? "Thành Công Rực Rỡ!" : "Úp! Có lỗi rồi Admin ơi:"}
              </h4>
              <p className="text-xs font-bold mt-0.5 leading-relaxed font-sans">{toast.message}</p>
            </div>
            <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600 shrink-0">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Title block */}
        <div className="text-center md:text-left bg-gradient-to-r from-indigo-50 to-purple-50 border-4 border-indigo-100 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-center gap-6">
          <div className="w-20 h-20 bg-indigo-500 rounded-2xl flex items-center justify-center text-5xl shadow-md text-white animate-pulse">
            📚
          </div>
          <div>
            <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md inline-block">
              Hệ thống nhập học liệu Số hóa PDF
            </span>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight mt-1">
              Cambridge YLE Learning Bank Digitalizer
            </h1>
            <p className="text-xs font-bold text-slate-500 mt-1 leading-relaxed">
              Trang công cụ dành riêng cho Quản trị viên của <strong className="text-indigo-600">HUB Xanh Digital University</strong> để cắt bóc tách đề thi Cambridge gốc (.pdf) thành các câu hỏi AI tương tác sinh động, lưu trữ đám mây Cloudinary và đồng bộ MongoDB.
            </p>
          </div>
        </div>

        {/* Form and Preview Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: Import Form (8 cols on large) */}
          <div className="bg-white rounded-3xl border-4 border-slate-100 p-6 md:p-8 shadow-xl lg:col-span-8 flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <PenTool className="w-6 h-6 text-indigo-500" />
                {isEditing ? "Cập Nhật Học Liệu & Kịch Bản AI ✏️" : "Siêu dữ liệu Học liệu & Kịch bản AI"}
              </h3>
              
              <button
                type="button"
                onClick={handleAutoDigitalize}
                disabled={isAnalyzing || isSubmitting || !imageFile}
                className={`px-4 py-2.5 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                  !imageFile
                    ? "btn-3d-gray opacity-60 cursor-not-allowed"
                    : "btn-3d-purple animate-pulse hover:scale-105 active:translate-y-0.5"
                }`}
                title={!imageFile ? "Vui lòng chọn hoặc kéo thả tệp hình ảnh trước" : "Bấm để AI tự động phân tích và điền siêu dữ liệu"}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Đang bóc tách... 🤖
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Tự động điền AI ✨
                  </>
                )}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              
              {/* Row 1: ID, Level, Part */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                <div>
                  <label className="block text-slate-700 font-extrabold text-xs uppercase tracking-wide mb-1.5" htmlFor="qId">
                    Question ID <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="qId"
                    type="text"
                    required
                    disabled={isEditing}
                    value={qId}
                    onChange={(e) => setQId(e.target.value)}
                    placeholder="Ví dụ: ST_P1_03"
                    className={`w-full rounded-2xl border-2 p-3 text-sm font-extrabold outline-none transition-colors ${
                      isEditing
                        ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed font-sans"
                        : "border-slate-200 focus:border-indigo-400 text-slate-700"
                    }`}
                  />
                  <span className="text-[10px] text-slate-400 font-bold block mt-1">
                    {isEditing ? "Không thể thay đổi Mã ID khi đang chỉnh sửa" : "Mã duy nhất: Cấp độ_Phần_Số câu"}
                  </span>
                </div>

                <div>
                  <label className="block text-slate-700 font-extrabold text-xs uppercase tracking-wide mb-1.5" htmlFor="level">
                    Cấp độ (Level) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="level"
                    value={level}
                    onChange={(e) => setLevel(e.target.value as any)}
                    className="w-full rounded-2xl border-2 border-slate-200 focus:border-indigo-400 p-3 text-sm font-extrabold text-slate-700 outline-none transition-colors bg-white cursor-pointer"
                  >
                    <option value="Starters">Starters 🦛</option>
                    <option value="Movers">Movers 🐒</option>
                    <option value="Flyers">Flyers 🦁</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-extrabold text-xs uppercase tracking-wide mb-1.5" htmlFor="part">
                    Phần thi (Part) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="part"
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={part}
                    onChange={(e) => setPart(e.target.value)}
                    placeholder="Ví dụ: 1"
                    className="w-full rounded-2xl border-2 border-slate-200 focus:border-indigo-400 p-3 text-sm font-extrabold text-slate-700 outline-none transition-colors"
                  />
                </div>

              </div>

              {/* Row 2: Type, Custom Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-extrabold text-xs uppercase tracking-wide mb-1.5" htmlFor="type">
                    Loại bối cảnh học liệu <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="type"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full rounded-2xl border-2 border-slate-200 focus:border-indigo-400 p-3 text-sm font-extrabold text-slate-700 outline-none transition-colors bg-white cursor-pointer"
                  >
                    <option value="Scene_Description">Scene Description (Mô tả tranh bối cảnh)</option>
                    <option value="Object_Card">Object Card (Thẻ vật thể bóc tách)</option>
                    <option value="Storytelling">Storytelling (Kể chuyện theo tranh liên hoàn)</option>
                    <option value="Find_Differences">Find the Differences (Tìm điểm khác biệt)</option>
                    <option value="Custom">Custom (Nhập loại bối cảnh mới...)</option>
                  </select>
                </div>

                {type === "Custom" && (
                  <div>
                    <label className="block text-slate-700 font-extrabold text-xs uppercase tracking-wide mb-1.5" htmlFor="customType">
                      Nhập loại bối cảnh tùy chỉnh <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="customType"
                      type="text"
                      required
                      value={customType}
                      onChange={(e) => setCustomType(e.target.value)}
                      placeholder="Ví dụ: Picture_Matching"
                      className="w-full rounded-2xl border-2 border-slate-200 focus:border-indigo-400 p-3 text-sm font-extrabold text-slate-700 outline-none transition-colors animate-pulse"
                    />
                  </div>
                )}
              </div>

              {/* Row 3: Examiner Script */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-slate-700 font-extrabold text-xs uppercase tracking-wide" htmlFor="script">
                    Kịch bản câu hỏi của Giám khảo AI <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-bold">Giám khảo AI sẽ đọc/phát âm đoạn này</span>
                </div>
                <textarea
                  id="script"
                  required
                  rows={3}
                  value={examinerScript}
                  onChange={(e) => setExaminerScript(e.target.value)}
                  placeholder="Ví dụ: Look at this scene. Here is a family on the beach. Where is the boy? What is the dog doing?"
                  className="w-full rounded-2xl border-2 border-slate-200 focus:border-indigo-400 p-3.5 text-sm font-extrabold text-slate-700 outline-none transition-colors resize-none font-sans"
                />
              </div>

              {/* Row 4: Context Tags */}
              <div>
                <label className="block text-slate-700 font-extrabold text-xs uppercase tracking-wide mb-1.5" htmlFor="tags">
                  Từ khóa bối cảnh (Context Tags)
                </label>
                <input
                  id="tags"
                  type="text"
                  value={contextTags}
                  onChange={(e) => setContextTags(e.target.value)}
                  placeholder="beach, animals, family, swimming, sunny"
                  className="w-full rounded-2xl border-2 border-slate-200 focus:border-indigo-400 p-3 text-sm font-extrabold text-slate-700 outline-none transition-colors"
                />
                <span className="text-[10px] text-slate-400 font-bold block mt-1">Cách nhau bằng dấu phẩy (,)</span>
              </div>

              {/* Evaluation criteria: Expected keywords, Target Grammar */}
              <div className="bg-slate-50/70 border-2 border-slate-100 rounded-3xl p-4 md:p-5 flex flex-col gap-4 shadow-inner">
                <h4 className="text-xs font-black text-slate-600 uppercase tracking-widest flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-emerald-500" />
                  Tiêu chí chấm điểm của Trí tuệ Nhân tạo (AI Grading Criteria)
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-600 font-extrabold text-xs uppercase tracking-wide mb-1.5" htmlFor="keywords">
                      Từ khóa dự kiến có (Expected Keywords)
                    </label>
                    <input
                      id="keywords"
                      type="text"
                      value={expectedKeywords}
                      onChange={(e) => setExpectedKeywords(e.target.value)}
                      placeholder="beach, dog, running, coconut, ball"
                      className="w-full rounded-2xl border-2 border-slate-200 focus:border-indigo-400 bg-white p-3 text-sm font-extrabold text-slate-700 outline-none transition-colors"
                    />
                    <span className="text-[9px] text-slate-400 font-semibold block mt-1">Từ khóa tối thiểu học viên cần đọc chuẩn</span>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-extrabold text-xs uppercase tracking-wide mb-1.5" htmlFor="grammar">
                      Cấu trúc đích (Target Grammar)
                    </label>
                    <input
                      id="grammar"
                      type="text"
                      value={targetGrammar}
                      onChange={(e) => setTargetGrammar(e.target.value)}
                      placeholder="present continuous, there is, there are, behind, under"
                      className="w-full rounded-2xl border-2 border-slate-200 focus:border-indigo-400 bg-white p-3 text-sm font-extrabold text-slate-700 outline-none transition-colors"
                    />
                    <span className="text-[9px] text-slate-400 font-semibold block mt-1">Các giới từ, thì ngữ pháp ưu tiên để AI phát hiện</span>
                  </div>
                </div>
              </div>

              {/* Mobile image selector (shows up here only on smaller screens) */}
              <div className="lg:hidden">
                <label className="block text-slate-700 font-extrabold text-xs uppercase tracking-wide mb-1.5">
                  Tệp học liệu PDF hoặc ảnh minh họa <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={triggerFileInput}
                    className="btn-3d-gray py-3 px-4 text-xs font-black shrink-0"
                  >
                    Chọn ảnh hoặc PDF 📄
                  </button>
                  {imageFile && (
                    <div className="flex-1 flex items-center gap-2 truncate text-xs font-bold text-slate-600 bg-slate-50 border p-2 rounded-xl">
                      <ImageIcon className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span className="truncate">{imageFile.name}</span>
                      <button type="button" onClick={removeImage} className="text-rose-500 hover:text-rose-700 ml-auto shrink-0">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Action tactical 3D buttons */}
              <div className="flex gap-3 border-t border-slate-100 pt-5 mt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={isSubmitting}
                  className="btn-3d-gray px-6 py-4 text-sm font-black uppercase tracking-wider shrink-0 disabled:opacity-50"
                >
                  {isEditing ? "HỦY SỬA ❌" : "Xóa trắng 🗑️"}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex-1 py-4 text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                    isEditing ? "btn-3d-yellow text-slate-800" : "btn-3d-green"
                  } ${
                    isSubmitting ? "brightness-95 shadow-none translate-y-[4px]" : "hover:scale-[1.01]"
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {isEditing ? "ĐANG CẬP NHẬT DỮ LIỆU..." : "ĐANG TẢI LÊN CLOUDINARY & LƯU DB..."}
                    </>
                  ) : isEditing ? (
                    <>
                      <PenTool className="w-5 h-5" />
                      CẬP NHẬT HỌC LIỆU 💾
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      IMPORT INTO ASSET BANK 🚀
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>

          {/* RIGHT: Image drag-drop preview & guidelines (4 cols on large) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Image Preview Box */}
            <div className="bg-white rounded-3xl border-4 border-slate-100 p-6 shadow-xl relative overflow-hidden">
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <ImageIcon className="w-4.5 h-4.5 text-indigo-500" />
                Học liệu gốc (Ảnh / PDF)
              </h4>

              {/* Drag and Drop Container */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={!imageFile ? triggerFileInput : undefined}
                className={`w-full min-h-[220px] rounded-3xl border-4 border-dashed transition-all flex flex-col items-center justify-center p-4 text-center select-none cursor-pointer ${
                  imageFile
                    ? "border-emerald-200 bg-emerald-50/10"
                    : isDragActive
                    ? "border-indigo-400 bg-indigo-50/40 scale-98"
                    : "border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {imagePreview ? (
                  <div className="w-full h-full flex flex-col items-center justify-center relative group">
                    <img
                      src={imagePreview}
                      alt="Xem trước hình bóc tách"
                      className="max-h-[200px] object-contain rounded-2xl shadow-sm border border-slate-100 bg-white"
                    />
                    
                    {/* Hover delete button overlay */}
                    <div className="absolute inset-0 bg-slate-900/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={removeImage}
                        className="bg-white hover:bg-rose-50 text-rose-500 hover:text-rose-700 p-3 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all font-black"
                      >
                        <Trash2 className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                ) : imageFile ? (
                  <div className="w-full h-full flex flex-col items-center justify-center relative group p-4 bg-rose-50/20 rounded-2xl border border-rose-100 animate-pulse-slow">
                    <div className="text-6xl animate-bounce mb-3" style={{ animationDuration: "3s" }}>📕</div>
                    <span className="text-xs font-black text-rose-600 block uppercase tracking-wider">Tệp tài liệu PDF</span>
                    <span className="text-[10px] text-slate-500 font-bold block mt-1 truncate max-w-[200px]">{imageFile.name}</span>
                    
                    {/* Hover delete button overlay */}
                    <div className="absolute inset-0 bg-slate-900/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={removeImage}
                        className="bg-white hover:bg-rose-50 text-rose-500 hover:text-rose-700 p-3 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all font-black"
                      >
                        <Trash2 className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-3 border border-slate-200">
                      <Upload className="w-6 h-6 text-slate-400" />
                    </div>
                    <span className="text-xs font-black text-slate-600 block">Kéo & Thả ảnh / PDF đề thi vào đây</span>
                    <span className="text-[10px] text-slate-400 font-bold block mt-1">hoặc click để duyệt tệp tin</span>
                    <span className="text-[9px] bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-md px-2 py-0.5 mt-3 font-semibold uppercase">
                      Hỗ trợ PNG, JPG, WEBP, PDF
                    </span>
                  </div>
                )}
              </div>

              {imageFile && (
                <div className="mt-4 flex flex-col gap-3">
                  <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-[11px] font-bold text-slate-500">
                    <span className="truncate max-w-[200px]">{imageFile.name}</span>
                    <span>{(imageFile.size / 1024).toFixed(1)} KB</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleAutoDigitalize}
                    disabled={isAnalyzing || isSubmitting}
                    className="btn-3d-purple w-full py-3 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 hover:scale-[1.02] disabled:opacity-50"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4.5 h-4.5 animate-spin" />
                        AI ĐANG PHÂN TÍCH ẢNH... 🤖
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4.5 h-4.5" />
                        Tự động điền bằng AI ✨
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Quick PDF Extraction Instruction Guidelines */}
            <div className="bg-white rounded-3xl border-4 border-slate-100 p-6 shadow-xl">
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-3.5 flex items-center gap-1.5">
                <HelpCircle className="w-4.5 h-4.5 text-amber-500" />
                Hướng dẫn cắt bóc tách từ PDF
              </h4>
              
              <ul className="text-xs font-bold text-slate-500 flex flex-col gap-3 leading-relaxed">
                <li className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-[10px] font-black text-amber-800 shrink-0">1</div>
                  <span>Sử dụng công cụ chụp màn hình (Snipping Tool / Lightshot) chụp sắc nét bức tranh mô tả cảnh hoặc Object Cards trong PDF đề thi Cambridge chuẩn.</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-[10px] font-black text-amber-800 shrink-0">2</div>
                  <span>Đặt tên ID học liệu tương ứng cấu trúc để dễ truy xuất (Ví dụ: <code>ST_P1_03</code> là Starters Part 1 Câu 03).</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-[10px] font-black text-amber-800 shrink-0">3</div>
                  <span>Nhập kịch bản câu hỏi bản xứ và từ khóa dự kiến để giúp cô giáo AI có cơ sở tự động đánh giá phát âm cho học viên nhé!</span>
                </li>
              </ul>
            </div>

          </div>

        </section>

        {/* Live Question Bank Data Table */}
        <section className="bg-white rounded-3xl border-4 border-slate-100 p-6 md:p-8 shadow-xl mb-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-6">
            <div>
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <Database className="w-6 h-6 text-indigo-500" />
                Ngân hàng Học liệu đã Số hóa ({filteredQuestions.length})
              </h3>
              <p className="text-xs font-bold text-slate-400 mt-0.5">Dữ liệu thời gian thực được đồng bộ trên cơ sở dữ liệu đám mây</p>
            </div>

            {/* Filter Tabs by Level */}
            <div className="flex items-center gap-1.5 bg-slate-50 border-2 border-slate-200/70 p-1.5 rounded-2xl shrink-0">
              {["All", "Starters", "Movers", "Flyers"].map((tab) => {
                const isActive = selectedFilter === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setSelectedFilter(tab)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      isActive
                        ? "bg-indigo-500 text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-700 bg-transparent hover:bg-slate-100"
                    }`}
                  >
                    {tab === "All" ? "Tất cả" : `${levelAnimals[tab]} ${tab}`}
                  </button>
                );
              })}
              
              {/* Refresh trigger button */}
              <button
                onClick={fetchQuestions}
                disabled={loadingList}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer shrink-0 disabled:opacity-50"
                title="Làm mới dữ liệu"
              >
                <RefreshCw className={`w-4 h-4 ${loadingList ? "animate-spin text-indigo-500" : ""}`} />
              </button>
            </div>
          </div>

          {/* Table container */}
          {loadingList ? (
            <div className="w-full py-16 flex flex-col items-center justify-center text-center">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-3" />
              <p className="text-sm font-extrabold text-slate-600 animate-pulse">Đang tải danh sách học liệu chuẩn...</p>
              <p className="text-xs font-semibold text-slate-400 mt-1">Hệ thống đang truy vấn cơ sở dữ liệu MongoDB Atlas</p>
            </div>
          ) : listError ? (
            <div className="w-full py-12 flex flex-col items-center justify-center text-center bg-rose-50/50 border border-dashed border-rose-200 rounded-3xl">
              <span className="text-4xl mb-2">🛑</span>
              <h4 className="text-sm font-black text-rose-600 uppercase">Lỗi truy vấn dữ liệu!</h4>
              <p className="text-xs font-bold text-slate-500 max-w-sm mt-1">{listError}</p>
              <button
                onClick={fetchQuestions}
                className="mt-4 bg-white text-rose-600 border border-rose-200 hover:bg-rose-100 px-4 py-2 rounded-xl text-xs font-extrabold shadow-sm active:translate-y-0.5 transition-transform"
              >
                Thử tải lại danh sách 🔄
              </button>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="w-full py-16 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/20">
              <span className="text-5xl mb-3 animate-bounce" style={{ animationDuration: "4s" }}>🏜️</span>
              <h4 className="text-sm font-black text-slate-700 uppercase">Kho học liệu cấp độ này đang trống!</h4>
              <p className="text-xs font-bold text-slate-400 max-w-xs mt-1">Admin hãy sử dụng form bên trên tải ảnh cắt PDF để bổ sung câu hỏi nhé! 🚀</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-extrabold">
                    <th className="py-4 px-4 text-xs font-black uppercase text-center w-16">STT</th>
                    <th className="py-4 px-4 text-xs font-black uppercase w-20">Ảnh bóc tách</th>
                    <th className="py-4 px-4 text-xs font-black uppercase w-24">Mã ID</th>
                    <th className="py-4 px-4 text-xs font-black uppercase w-24">Cấp độ</th>
                    <th className="py-4 px-4 text-xs font-black uppercase w-16 text-center">Part</th>
                    <th className="py-4 px-4 text-xs font-black uppercase w-32">Loại bối cảnh</th>
                    <th className="py-4 px-4 text-xs font-black uppercase">Kịch bản Giám khảo AI</th>
                    <th className="py-4 px-4 text-xs font-black uppercase w-48">Tiêu chí chấm điểm</th>
                    <th className="py-4 px-4 text-xs font-black uppercase text-center w-36">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold text-slate-600">
                  {filteredQuestions.map((q, idx) => {
                    return (
                      <tr key={q._id} className="hover:bg-slate-50/50 transition-colors">
                        
                        <td className="py-4 px-4 text-center font-extrabold text-slate-400 w-16">
                          {idx + 1}
                        </td>
                        
                        <td className="py-4 px-4 w-20">
                          <div className="w-14 h-14 rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm flex items-center justify-center group relative cursor-zoom-in">
                            <img
                              src={q.imagePath}
                              alt={q.id}
                              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
                            />
                            {/* Hover overlay static target link */}
                            <a
                              href={q.imagePath}
                              target="_blank"
                              rel="noreferrer"
                              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[9px] font-black uppercase"
                            >
                              XEM 🔗
                            </a>
                          </div>
                        </td>
                        
                        <td className="py-4 px-4 font-black text-slate-800 uppercase w-24">
                          {q.id}
                        </td>

                        <td className="py-4 px-4 w-24">
                          <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 text-[9px] font-black uppercase rounded-md border ${levelBadges[q.level] || "bg-slate-100"}`}>
                            {levelAnimals[q.level]} {q.level}
                          </span>
                        </td>

                        <td className="py-4 px-4 text-center font-extrabold text-slate-800 w-16">
                          {q.part}
                        </td>

                        <td className="py-4 px-4 text-slate-500 w-32 truncate max-w-[130px]" title={q.type || ""}>
                          {(q.type || "").replace(/_/g, " ")}
                        </td>

                        <td className="py-4 px-4 text-slate-700 font-medium leading-relaxed max-w-xs md:max-w-sm truncate" title={q.examinerScript}>
                          "{q.examinerScript}"
                        </td>

                        <td className="py-4 px-4 w-48 text-[10px] leading-relaxed text-slate-400 font-sans">
                          {q.evaluationCriteria.expectedKeywords.length > 0 && (
                            <div>
                              <strong className="text-slate-500">Keywords:</strong>{" "}
                              <span className="text-emerald-600 font-bold bg-emerald-50 px-1 py-0.5 rounded border border-emerald-100">
                                {q.evaluationCriteria.expectedKeywords.join(", ")}
                              </span>
                            </div>
                          )}
                          {q.evaluationCriteria.targetGrammar.length > 0 && (
                            <div className="mt-1">
                              <strong className="text-slate-500">Grammar:</strong>{" "}
                              <span className="text-indigo-600 font-bold bg-indigo-50 px-1 py-0.5 rounded border border-indigo-100">
                                {q.evaluationCriteria.targetGrammar.join(", ")}
                              </span>
                            </div>
                          )}
                          {q.contextTags.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-0.5 items-center">
                              <Tag className="w-2.5 h-2.5 text-slate-400" />
                              <span className="italic text-[9px] font-bold text-slate-400">
                                {q.contextTags.join(", ")}
                              </span>
                            </div>
                          )}
                        </td>

                        <td className="py-4 px-4 w-36 text-center align-middle">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleEdit(q)}
                              className="btn-3d-yellow px-3 py-2 text-[10px] font-black flex items-center gap-1 hover:scale-105 active:translate-y-0.5 shadow-sm transition-transform cursor-pointer"
                              title="Sửa học liệu này"
                            >
                              ✏️ SỬA
                            </button>
                            <button
                              onClick={() => handleDelete(q.id)}
                              className="btn-3d-pink px-3 py-2 text-[10px] font-black flex items-center gap-1 hover:scale-105 active:translate-y-0.5 shadow-sm transition-transform cursor-pointer"
                              title="Xóa học liệu này"
                            >
                              🗑️ XÓA
                            </button>
                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
