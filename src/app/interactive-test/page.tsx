"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Mic, Square, Loader2, PlayCircle, Send, Image as ImageIcon,
  Star, Award, Sparkles, Volume2, BookOpen, PenTool, CheckCircle2, 
  XCircle, ChevronRight, Home, ArrowRight, Trophy, Shield, RefreshCw, Compass
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type Stage = "intro" | "warmup" | "picture" | "reading" | "writing" | "results";

interface Message {
  id: string;
  role: "ai" | "user";
  content: string;
  stage: Stage;
  audioUrl?: string;
}

// Custom YLE Shield SVG Component
const YleShield = ({ filled }: { filled: boolean }) => (
  <svg 
    className={`w-6 h-8 drop-shadow-sm transition-all duration-300 ${filled ? "text-amber-500 fill-amber-400 scale-110" : "text-slate-200 fill-slate-100"}`} 
    viewBox="0 0 24 30"
  >
    <path 
      d="M12 2 L2 5 C2 15, 6 24, 12 28 C18 24, 22 15, 22 5 Z" 
      stroke="currentColor" 
      strokeWidth="2" 
    />
    {filled && (
      <path 
        d="M12 7 L14 11 L19 11 L15 14 L17 19 L12 16 L7 19 L9 14 L5 11 L10 11 Z" 
        fill="white" 
        transform="translate(4, 5) scale(0.65)"
      />
    )}
  </svg>
);

export default function InteractiveTest() {
  const [stage, setStage] = useState<Stage>("intro");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Custom Kid States collected during the test
  const [kidName, setKidName] = useState("Con");
  const [kidAge, setKidAge] = useState("7");
  const [favAnimal, setFavAnimal] = useState("");
  
  // Dynamic AI YLE Question Generator states
  const [isGenerating, setIsGenerating] = useState(false);
  const [dynamicStory, setDynamicStory] = useState("");
  const [dynamicMcq, setDynamicMcq] = useState<any>(null);
  const [dynamicSpelling, setDynamicSpelling] = useState<any[]>([]);

  // Stage 2: 2 Pictures Sequence States
  const [picQuestions, setPicQuestions] = useState<any[]>([]);
  const [pictureIndex, setPictureIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [keywordsHitPic1, setKeywordsHitPic1] = useState(0);
  const [totalProbingTurns, setTotalProbingTurns] = useState(0);
  const [keywordsMentioned, setKeywordsMentioned] = useState<string[]>([]);
  const [probingTurnsCount, setProbingTurnsCount] = useState(0);

  // Stage 3 (Reading Aloud & MCQ) States
  const [readingAccuracyState, setReadingAccuracyState] = useState(85);
  const [showMcq, setShowMcq] = useState(false);
  const [selectedMcqOption, setSelectedMcqOption] = useState<number | null>(null);
  const [mcqAnswered, setMcqAnswered] = useState(false);
  const [isMcqCorrect, setIsMcqCorrect] = useState<boolean | null>(null);
  
  // Stage 4 (Writing & spelling 2 words) States
  const [writingTaskIndex, setWritingTaskIndex] = useState(0);
  const [typedWord, setTypedWord] = useState("");
  const [writingSubmitted, setWritingSubmitted] = useState(false);
  const [spellingCorrect1, setSpellingCorrect1] = useState<boolean | null>(null);
  const [spellingCorrect2, setSpellingCorrect2] = useState<boolean | null>(null);
  
  // Final aggregated scores out of 100
  const [scores, setScores] = useState({
    speaking: 85,
    listening: 90,
    reading: 80,
    writing: 100
  });
  
  // MongoDB sync states
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Dynamic Reference story fallback
  const activeStory = dynamicStory || "Max is a happy little monkey who lives in a very tall coconut tree in the jungle. He loves to eat sweet yellow bananas every morning. Today, Max looks down and sees a small green frog sitting on a leaf in the pond. The frog is jumping up and down and singing a funny song. Max waves hello and laughs happily!";

  // 2. Dynamic MCQ Question fallback
  const activeMcq = dynamicMcq || {
    question: "What does Max love to eat every morning?",
    options: [
      "Red apples 🍎",
      "Sweet yellow bananas 🍌",
      "Green leaves 🍃"
    ],
    correctIndex: 1
  };

  // 3. Dynamic Spelling Task fallback
  const activeSpelling = (dynamicSpelling && dynamicSpelling.length >= 2) ? dynamicSpelling : [
    {
      prompt: "Can you spell the word for the animal that lives in the tree? It starts with 'm'.",
      correctWord: "monkey"
    },
    {
      prompt: "Excellent! Now, can you spell the word for the yellow fruit that Max loves to eat? It starts with 'b'.",
      correctWord: "banana"
    }
  ];

  // Auto-scroll chat history
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isProcessing, stage]);

  const playTTS = (text: string) => {
    const cleanText = text.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '');
    const url = `/api/tts?text=${encodeURIComponent(cleanText.trim())}`;
    if (audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.play().catch(e => console.error("Lỗi phát audio:", e));
    }
  };

  const addAiMessage = (content: string) => {
    const newMessage: Message = { id: Date.now().toString(), role: "ai", content, stage };
    setMessages((prev) => [...prev, newMessage]);
    playTTS(content);
  };

  const startTest = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/interactive-test/generate");
      const data = await res.json();
      if (data.success) {
        setPicQuestions(data.pictures);
        setCurrentQuestion(data.pictures[0]);
        setDynamicStory(data.story);
        setDynamicMcq(data.mcq);
        setDynamicSpelling(data.spelling);
        console.log("🎯 [AI Generator] Đã sinh đề thi động thành công!");
      }
    } catch (err) {
      console.error("Lỗi gọi API sinh đề thi động:", err);
      // Fallback variables will take place automatically
    } finally {
      setIsGenerating(false);
      setStage("warmup");
      // Add slight delay to make transitions natural
      setTimeout(() => {
        addAiMessage("Hello! Welcome to the English test. What's your name?");
      }, 500);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await handleAudioSubmission(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      alert("Con hãy cấp quyền sử dụng Microphone cho trình duyệt nhé! 🎤");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleAudioSubmission = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob);
      formData.append("stage", stage);
      
      const currentStageMessages = messages.filter(m => m.stage === stage);
      formData.append("chatHistory", JSON.stringify(currentStageMessages.slice(-6)));
      
      if (stage === "picture" && currentQuestion) {
        formData.append("context", JSON.stringify({
          pictureIndex,
          expectedKeywords: currentQuestion.evaluationCriteria?.expectedKeywords || []
        }));
      } else if (stage === "reading") {
        formData.append("context", JSON.stringify({
          referenceStory: activeStory
        }));
      }

      const res = await fetch("/api/interactive-chat", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      
      if (data.success) {
        // 1. Add user transcription message
        setMessages((prev) => [...prev, {
          id: Date.now().toString() + "_u",
          role: "user",
          content: data.transcribedText || "(Con đã trả lời bằng giọng nói 🎤)",
          stage
        }]);

        // 2. Add AI reply
        addAiMessage(data.aiResponse);

        // 3. Extract kid info dynamically in Stage 1 Warmup
        if (stage === "warmup") {
          const userMsgs = messages.filter(m => m.role === "user");
          const transcript = (data.transcribedText || "").trim();
          
          if (userMsgs.length === 0) {
            // First user response: Name
            const name = transcript.replace(/(my name is|i am|tên con là|tên là|con là)/gi, "").trim();
            setKidName(name || "Con");
          } else if (userMsgs.length === 1) {
            // Second user response: Age
            const age = transcript.replace(/[^0-9]/g, "");
            setKidAge(age || "7");
          } else if (userMsgs.length === 2) {
            // Third user response: Favorite animal
            setFavAnimal(transcript || "monkey");
          }
        }

        // 4. Track keywords and probing turns during Stage 2 Picture description
        if (stage === "picture" && currentQuestion) {
          const expected = currentQuestion.evaluationCriteria?.expectedKeywords || [];
          const spoken = (data.transcribedText || "").toLowerCase();
          const newlyFound = expected.filter((kw: string) => spoken.includes(kw.toLowerCase()));
          
          setKeywordsMentioned((prev) => Array.from(new Set([...prev, ...newlyFound])));
          setProbingTurnsCount(prev => prev + 1);
        }

        // 5. Track reading accuracy in Stage 3 Reading Aloud
        if (stage === "reading") {
          setReadingAccuracyState(data.readingAccuracy || 85);
        }

        // 6. Handle automatic stage transitions
        if (data.stageComplete) {
          if (stage === "warmup") {
            setTimeout(() => setStage("picture"), 2500);
          } else if (stage === "picture") {
            // Handle sequential 2-picture logic
            if (pictureIndex === 0) {
              setTimeout(() => {
                setKeywordsHitPic1(keywordsMentioned.length);
                setTotalProbingTurns(prev => prev + probingTurnsCount);
                setPictureIndex(1);
                
                // Switch to second question (use modulo fallback if only 1 image seeded)
                const nextQuestion = picQuestions[1 % picQuestions.length] || currentQuestion;
                setCurrentQuestion(nextQuestion);
                
                // Rename previous picture messages to avoid affecting Picture 2's turn count on backend
                setMessages(prev => prev.map(m => m.stage === "picture" ? { ...m, stage: "intro" } as Message : m));
                
                setKeywordsMentioned([]);
                setProbingTurnsCount(0);
                setIsProcessing(false);
              }, 2500);
            } else {
              setTimeout(() => {
                setTotalProbingTurns(prev => prev + probingTurnsCount);
                setStage("reading");
              }, 2500);
            }
          } else if (stage === "reading") {
            // After reading aloud story, transition to the MCQ panel after a short delay
            setTimeout(() => setShowMcq(true), 2500);
          }
        }
      } else {
        alert("Có lỗi xảy ra: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối đến server AI.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Stage 3 MCQ Option click logic
  const handleMcqSelect = (optionIndex: number) => {
    if (mcqAnswered) return;
    
    setSelectedMcqOption(optionIndex);
    setMcqAnswered(true);
    const correct = optionIndex === activeMcq.correctIndex;
    setIsMcqCorrect(correct);

    if (correct) {
      playTTS("Perfect! You got it right! Let's do some spelling now!");
      setTimeout(() => {
        setStage("writing");
      }, 3500);
    } else {
      playTTS(`Good try! Max actually loves ${activeMcq.options[activeMcq.correctIndex]}. Let's do some spelling now!`);
      setTimeout(() => {
        setStage("writing");
      }, 4500);
    }
  };

  // Stage 4 Writing submission & scoring calculation
  const handleWritingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedWord.trim()) return;

    const isCorrect = typedWord.toLowerCase().trim() === activeSpelling[writingTaskIndex].correctWord.toLowerCase().trim();

    if (writingTaskIndex === 0) {
      // Save Task 1 result
      setSpellingCorrect1(isCorrect);
      setWritingSubmitted(true);
      
      if (isCorrect) {
        playTTS("Perfect! That's correct spelling! Next word!");
      } else {
        playTTS("Good try! Let's try spelling the next word!");
      }

      setTimeout(() => {
        setTypedWord("");
        setWritingSubmitted(false);
        setWritingTaskIndex(1);
      }, 2500);
      
    } else {
      // Save Task 2 result
      setSpellingCorrect2(isCorrect);
      setWritingSubmitted(true);
      
      if (isCorrect) {
        playTTS("Fantastic! Correct spelling!");
      } else {
        playTTS("Well done! You worked so hard!");
      }

      // Calculate final aggregated scores across all 4 stages
      const expectedKeywordsLength1 = Math.max(picQuestions[0]?.evaluationCriteria?.expectedKeywords?.length || 3, 1);
      const expectedKeywordsLength2 = Math.max(picQuestions[1 % picQuestions.length]?.evaluationCriteria?.expectedKeywords?.length || 3, 1);
      const totalExpected = expectedKeywordsLength1 + expectedKeywordsLength2;
      const totalKeywordsHit = keywordsHitPic1 + keywordsMentioned.length;

      const pictureSpeaking = Math.round((totalKeywordsHit / totalExpected) * 100);
      const speakingScore = Math.round((100 + pictureSpeaking + readingAccuracyState) / 3);

      const pictureListening = Math.max(100 - ((totalProbingTurns + probingTurnsCount) * 8), 65);
      const mcqListening = isMcqCorrect ? 100 : 40;
      const listeningScore = Math.round((pictureListening + mcqListening) / 2);

      const mcqReading = isMcqCorrect ? 100 : 30;
      const readingScore = Math.round((readingAccuracyState + mcqReading) / 2);

      // Writing score: both correct (100), one correct (65), both wrong (30)
      const correctSpellingsCount = (spellingCorrect1 ? 1 : 0) + (isCorrect ? 1 : 0);
      const writingScore = correctSpellingsCount === 2 ? 100 : correctSpellingsCount === 1 ? 65 : 30;

      const computedScores = {
        speaking: speakingScore,
        listening: listeningScore,
        reading: readingScore,
        writing: writingScore
      };

      setScores(computedScores);

      // Auto-transition to final Report Card
      setTimeout(() => {
        setStage("results");
      }, 2500);
    }
  };

  // MongoDB sync logic to log results in real DB
  const saveResultsToDb = async () => {
    setIsSaving(true);
    try {
      const skills: ("Speaking" | "Listening" | "Reading" | "Writing")[] = ["Speaking", "Listening", "Reading", "Writing"];
      const level = scores.speaking >= 85 ? "Flyers" : scores.speaking >= 60 ? "Movers" : "Starters";
      
      const promises = skills.map(async (skill) => {
        let skillScore = 0;
        if (skill === "Speaking") skillScore = scores.speaking;
        else if (skill === "Listening") skillScore = scores.listening;
        else if (skill === "Reading") skillScore = scores.reading;
        else if (skill === "Writing") skillScore = scores.writing;
        
        let stars = 5;
        if (skillScore >= 85) stars = 5;
        else if (skillScore >= 70) stars = 4;
        else if (skillScore >= 50) stars = 3;
        else if (skillScore >= 30) stars = 2;
        else stars = 1;

        const res = await fetch("/api/assessments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: `kid_entrance_${Date.now()}`,
            level,
            skill,
            sentence: skill === "Speaking" 
              ? "Entrance Interview: Life Communication & Double Picture Probing" 
              : skill === "Reading" 
              ? activeStory 
              : "Double word spelling assessment",
            score: skillScore,
            stars,
            mispronouncedWords: [],
            feedback: {
              tutorComment: skill === "Speaking" 
                ? `Bé ${kidName} miêu tả 2 bức tranh sinh động và giao tiếp tự nhiên với cô giáo AI.` 
                : skill === "Reading"
                ? `Bé ${kidName} đọc tốt câu chuyện dài, phát âm chuẩn xác ${readingAccuracyState}% số từ.`
                : `Bé hoàn thành rất tốt phần thi ${skill} đầu vào của trung tâm.`,
              tips: "Chúc mừng con đã xuất sắc hoàn thành kỳ thi đánh giá năng lực! Hãy tiếp tục duy trì đam mê nhé con!"
            },
            roadmap: skill === "Speaking" 
              ? ["Luyện tập nhại giọng theo AI trước gương", "Tự tin kể câu chuyện ngắn"] 
              : ["Xem lại lỗi nhỏ và luyện đọc to mỗi tối để nhớ chữ lâu hơn."]
          })
        });
        const json = await res.json();
        return json;
      });

      const results = await Promise.all(promises);
      const successful = results.every(r => r.success);
      if (successful) {
        setSaveSuccess(true);
      } else {
        setSaveSuccess(false);
      }
    } catch (err) {
      console.error("Lỗi đồng bộ MongoDB:", err);
      setSaveSuccess(false);
    } finally {
      setIsSaving(false);
    }
  };

  // Convert Score to YLE shields (1 to 5)
  const getShieldsCount = (score: number) => {
    if (score >= 90) return 5;
    if (score >= 75) return 4;
    if (score >= 50) return 3;
    if (score >= 30) return 2;
    return 1;
  };

  const getOverallLevel = (speakingScore: number) => {
    if (speakingScore >= 85) return { name: "Flyers (A2)", mascot: "🦁", title: "Lion Dũng Cảm", theme: "bg-blue-50 border-blue-200 text-blue-700", desc: "Wow! Bé có năng lực Tiếng Anh thật kinh ngạc! Con phát âm cực kỳ chuẩn xác, nghe hiểu nhanh nhạy và viết chính tả hoàn hảo. Con hoàn toàn sẵn sàng chinh phục các kỳ thi chuẩn quốc tế Flyers và đạt điểm tuyệt đối. Cô rất tự hào về con! 🦁🏆" };
    if (speakingScore >= 60) return { name: "Movers (A1)", mascot: "🐒", title: "Monkey Thông Minh", theme: "bg-amber-50 border-amber-200 text-amber-700", desc: "Chúc mừng bé xuất sắc đạt cấp độ Movers! Con có vốn từ vựng tốt, miêu tả tranh sinh động và đọc câu chuyện rất lưu loát. Hãy rèn luyện thêm ngữ pháp và chính tả khi viết câu để chuẩn bị cho nấc thang Flyers đầy thú vị tiếp theo nhé! 🐒👑" };
    return { name: "Starters (Pre-A1)", mascot: "🦛", title: "Hippo Dễ Thương", theme: "bg-pink-50 border-pink-200 text-pink-700", desc: "Bé ơi, con đã rất dũng cảm hoàn thành bài thi! Con có phản xạ nghe nói cơ bản, nhận diện được các từ quen thuộc. Cùng cô giáo AI rèn luyện thêm vốn từ vựng và tự tin bật âm để nhanh chóng chinh phục nấc thang Movers nhé! Cô chúc mừng con! 🦛🌟" };
  };

  const roadmapTasks = () => {
    if (scores.speaking >= 85) {
      return [
        "Thử thách tự viết 1 đoạn văn ngắn 5 câu giới thiệu về bản thân và gia đình ✍️",
        "Luyện nghe các đoạn hội thoại dài và tóm tắt lại ý chính 🎧",
        "Trở thành trợ giảng nhí giúp cô giáo AI hướng dẫn các bạn nhỏ hơn đọc bài nhé 👩‍🏫"
      ];
    } else if (scores.speaking >= 60) {
      return [
        "Luyện miêu tả 1 bức tranh con thích bằng 3 câu tiếng Anh trôi chảy 🖼️",
        "Luyện chép chính tả 3 từ vựng khó chủ đề trường học và sở thích 📓",
        "Đọc to câu chuyện ngắn mỗi tối để luyện ngữ điệu lên xuống tự nhiên 📖"
      ];
    } else {
      return [
        "Luyện nghe & nhại giọng theo cô giáo AI 3 câu nói cơ bản mỗi ngày 🗣️",
        "Chơi trò chơi 'Đuổi hình bắt chữ' để tăng 20 từ vựng chủ đề phòng ngủ & động vật 🧸",
        "Viết nắn nót bảng chữ cái tiếng Anh và các từ ngắn 3 lần vào vở học tập ✍️"
      ];
    }
  };

  const overallLevelInfo = getOverallLevel(scores.speaking);

  // 0. Dynamic YLE Test Loading overlay
  if (isGenerating) {
    return (
      <div className="w-full min-h-screen bg-pastel-bg flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-full border-8 border-indigo-300 border-t-indigo-600 animate-spin" />
          <span className="text-4xl absolute inset-0 flex items-center justify-center animate-bounce">👩‍🏫</span>
        </div>
        <h2 className="text-2xl font-black text-slate-800 animate-pulse">
          Cô giáo AI đang soạn bộ đề thi riêng cho con...
        </h2>
        <p className="text-sm text-slate-500 mt-3 max-w-sm leading-relaxed">
          Đợi một chút xíu nhé! Cô đang lấy những bức tranh đẹp nhất từ MongoDB và nhờ trí tuệ nhân tạo dệt thành câu chuyện đọc hiểu lôi cuốn nhất dành riêng cho con đấy! 🚀✨
        </p>
      </div>
    );
  }

  // 1. Intro view
  if (stage === "intro") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Decorative background bubbles */}
        <div className="bubble-bg top-12 left-8 w-24 h-24 animate-float" style={{ animationDelay: "0s" }} />
        <div className="bubble-bg top-32 right-12 w-28 h-28 animate-float" style={{ animationDelay: "3s" }} />
        <div className="bubble-bg bottom-16 left-16 w-32 h-32 animate-float" style={{ animationDelay: "6s" }} />

        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border-4 border-blue-100 relative z-10">
          <div className="text-6xl mb-4 animate-bounce" style={{ animationDuration: "2.5s" }}>🌟</div>
          <h1 className="text-3xl font-black text-blue-600 mb-2">BÀI THI TƯƠNG TÁC AI</h1>
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Đánh giá năng lực đầu vào</h3>
          
          <div className="bg-slate-50 rounded-2xl p-4 text-left border border-slate-200 space-y-3 mb-8">
            <h4 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider">Lộ trình bài test:</h4>
            <div className="flex items-start gap-2.5 text-xs text-slate-600 font-bold">
              <span className="w-5 h-5 rounded-full bg-pink-100 border border-pink-200 text-pink-500 flex items-center justify-center shrink-0">1</span>
              <span><strong>Warm-up:</strong> Chào hỏi tự nhiên, phản xạ nói cơ bản</span>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-slate-600 font-bold">
              <span className="w-5 h-5 rounded-full bg-amber-100 border border-amber-200 text-amber-500 flex items-center justify-center shrink-0">2</span>
              <span><strong>Speaking:</strong> Tương tác và miêu tả <strong>2 Bức tranh</strong> liên tiếp</span>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-slate-600 font-bold">
              <span className="w-5 h-5 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-500 flex items-center justify-center shrink-0">3</span>
              <span><strong>Reading:</strong> Đọc to <strong>Truyện dài động</strong> & MCQ trắc nghiệm</span>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-slate-600 font-bold">
              <span className="w-5 h-5 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-500 flex items-center justify-center shrink-0">4</span>
              <span><strong>Writing:</strong> Đánh vần và gõ <strong>2 từ vựng</strong> (Không gợi ý!)</span>
            </div>
          </div>

          <p className="text-xs text-slate-500 mb-8 font-extrabold">
            Bé hãy bật loa thật to và chuẩn bị sát Mic để thi cùng cô giáo AI nhé! 🎤👩‍🏫
          </p>

          <button 
            onClick={startTest}
            className="w-full btn-3d-green py-4 font-bold text-xl shadow-lg hover:scale-105 transition-transform cursor-pointer"
          >
            <PlayCircle className="inline-block mr-2 w-6 h-6 animate-pulse" />
            BẮT ĐẦU PHÒNG THI
          </button>
          
          <Link href="/" className="block mt-4 text-slate-400 font-bold hover:text-slate-600 text-xs">
            Quay lại Trang Chủ
          </Link>
        </div>
      </div>
    );
  }

  // 2. Report Card view (Results screen)
  if (stage === "results") {
    return (
      <div className="w-full min-h-screen pb-20 relative bg-pastel-bg overflow-x-hidden">
        {/* Decorative bubbles */}
        <div className="bubble-bg top-12 left-8 w-24 h-24 animate-float" style={{ animationDelay: "0s" }} />
        <div className="bubble-bg top-32 right-12 w-28 h-28 animate-float" style={{ animationDelay: "3s" }} />
        <div className="bubble-bg bottom-16 left-16 w-32 h-32 animate-float" style={{ animationDelay: "6s" }} />

        {/* Header bar */}
        <header className="w-full bg-white border-b-4 border-slate-100 py-4 px-4 sticky top-0 z-30 shadow-sm">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <Link href="/">
              <button className="btn-3d-gray px-4 py-2.5 text-xs font-black flex items-center gap-1">
                Quay Lại Trang Chủ
              </button>
            </Link>
            
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-4 py-1.5 rounded-2xl">
              <Trophy className="w-5 h-5 text-amber-500 animate-bounce" />
              <span className="text-sm font-black text-slate-700 uppercase tracking-wider">
                Kết Quả Đánh Giá Năng Lực Đầu Vào
              </span>
            </div>

            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center border-2 border-emerald-300">
              <span className="text-lg">👑</span>
            </div>
          </div>
        </header>

        <main className="max-w-3xl w-full mx-auto px-4 mt-8 flex flex-col gap-8 relative z-10">
          
          {/* Certificate Showcase Card */}
          <section className="bg-white rounded-3xl border-4 border-amber-300 p-8 shadow-xl text-center relative overflow-hidden">
            <div className="absolute top-2 left-6 text-2xl animate-bounce" style={{ animationDelay: "1s" }}>✨</div>
            <div className="absolute top-8 right-8 text-2xl animate-bounce" style={{ animationDelay: "2.5s" }}>🎈</div>
            
            <span className="bg-blue-50 text-blue-600 text-xs font-black uppercase tracking-wider px-4 py-1.5 rounded-full border border-blue-200 inline-flex items-center gap-1.5 mb-4 shadow-sm">
              <Award className="w-3.5 h-3.5 text-blue-500 fill-blue-100" />
              Chứng Nhận Năng Lực Quốc Tế Cambridge YLE
            </span>

            <h2 className="text-3xl font-black text-slate-800 tracking-tight">
              BẢNG KẾT QUẢ CỦA BÉ {kidName.toUpperCase()}
            </h2>
            <p className="text-sm text-slate-400 font-extrabold mt-1">Tuổi học viên: {kidAge} tuổi</p>

            {/* Recommended level badge */}
            <div className="my-8 max-w-sm mx-auto">
              <div className={`border-2 rounded-3xl p-6 shadow-md transition-all hover:scale-105 duration-300 ${overallLevelInfo.theme}`}>
                <span className="text-5xl block animate-bounce" style={{ animationDuration: "2s" }}>
                  {overallLevelInfo.mascot}
                </span>
                <span className="text-xs font-black opacity-60 uppercase tracking-widest block mt-2">
                  Trình độ khuyến nghị
                </span>
                <span className="text-3xl font-black block mt-1 tracking-tight font-sans">
                  {overallLevelInfo.name}
                </span>
                <span className="inline-block mt-3 bg-white/70 px-3 py-1 rounded-xl text-xs font-bold border border-current">
                  {overallLevelInfo.title}
                </span>
              </div>
            </div>

            {/* YLE Shields Matrix Grid */}
            <div className="bg-slate-50 border-2 border-slate-200 rounded-3xl p-6 shadow-inner mt-6">
              <h3 className="text-sm font-black text-slate-500 uppercase tracking-wider mb-6">
                Đánh giá theo 4 kỹ năng ngôn ngữ
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                {/* Speaking */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-700">🎤 Speaking (Kỹ năng Nói)</h4>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">Điểm quy đổi: {scores.speaking}/100</p>
                  </div>
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <YleShield key={i} filled={i < getShieldsCount(scores.speaking)} />
                    ))}
                  </div>
                </div>

                {/* Listening */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-700">🎧 Listening (Kỹ năng Nghe)</h4>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">Điểm quy đổi: {scores.listening}/100</p>
                  </div>
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <YleShield key={i} filled={i < getShieldsCount(scores.listening)} />
                    ))}
                  </div>
                </div>

                {/* Reading */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-700">📖 Reading (Kỹ năng Đọc)</h4>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">Điểm quy đổi: {scores.reading}/100</p>
                  </div>
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <YleShield key={i} filled={i < getShieldsCount(scores.reading)} />
                    ))}
                  </div>
                </div>

                {/* Writing */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-700">✍️ Writing (Kỹ năng Viết)</h4>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">Điểm quy đổi: {scores.writing}/100</p>
                  </div>
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <YleShield key={i} filled={i < getShieldsCount(scores.writing)} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </section>

          {/* AI Feedback Section */}
          <section className="bg-white rounded-3xl border-4 border-slate-100 p-6 md:p-8 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start gap-5">
              
              <div className="shrink-0 flex sm:flex-col items-center gap-2 self-center sm:self-start bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 w-full sm:w-28 text-center shadow-inner">
                <span className="text-5xl animate-bounce" style={{ animationDuration: "2.5s" }}>
                  {overallLevelInfo.mascot}
                </span>
                <div>
                  <p className="text-[11px] font-black text-slate-700 leading-tight">
                    {overallLevelInfo.title}
                  </p>
                  <p className="text-[9px] font-extrabold text-slate-400 mt-0.5">Cô giáo AI</p>
                </div>
              </div>

              <div className="flex-1 w-full">
                <div className="relative bg-emerald-50 border-2 border-emerald-200 rounded-3xl p-5 shadow-sm">
                  <div className="hidden sm:block absolute left-0 top-8 w-4 h-4 bg-emerald-50 border-l-2 border-b-2 border-emerald-200 transform -translate-x-[9px] rotate-45" />
                  
                  <h4 className="text-emerald-800 font-extrabold text-sm mb-2 flex items-center gap-1.5">
                    Lời khuyên nồng nhiệt của cô giáo dành cho bé {kidName}:
                  </h4>
                  
                  <p className="text-slate-700 text-sm font-extrabold leading-relaxed">
                    "{overallLevelInfo.desc}"
                  </p>
                </div>
              </div>

            </div>
          </section>

          {/* Learning Roadmap checklist */}
          <section className="bg-white rounded-3xl border-4 border-slate-100 p-6 md:p-8 shadow-xl">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-4 border-b pb-4">
              <Compass className="w-6 h-6 text-blue-500 animate-spin" style={{ animationDuration: "8s" }} />
              Lộ trình rèn luyện nâng cao năng lực 🚀
            </h3>
            
            <p className="text-xs text-slate-500 font-bold leading-relaxed mb-6">
              Dựa trên kết quả thi đầu vào, cô giáo AI đã chuẩn hóa riêng cho con 3 bài tập nhỏ luyện tập tại nhà:
            </p>

            <div className="space-y-4">
              {roadmapTasks().map((task, index) => (
                <div key={index} className="border-2 border-blue-50 bg-white rounded-2xl p-4 flex items-start gap-3 shadow-sm hover:border-blue-200 transition-colors">
                  <span className="inline-block text-xs font-black bg-blue-100/60 text-blue-600 px-2 py-0.5 rounded-md mr-2 font-mono shrink-0">
                    Bài {index + 1}
                  </span>
                  <div className="text-sm font-extrabold leading-relaxed text-slate-700">
                    {task}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Control Actions / MongoDB Sync trigger */}
          <section className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-20">
            
            {saveSuccess === null ? (
              <button 
                onClick={saveResultsToDb}
                disabled={isSaving}
                className="btn-3d-green w-full sm:w-auto px-8 py-4 text-sm tracking-wider uppercase flex items-center justify-center gap-2 hover:scale-105 disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang lưu trữ...
                  </>
                ) : (
                  <>
                    Lưu kết quả học tập 💾
                  </>
                )}
              </button>
            ) : saveSuccess ? (
              <div className="w-full sm:w-auto px-6 py-3 bg-emerald-50 border-2 border-emerald-300 text-emerald-700 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 shadow-sm">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Đồng bộ database thành công! 🚀
              </div>
            ) : (
              <div className="w-full sm:w-auto px-6 py-3 bg-rose-50 border-2 border-rose-300 text-rose-700 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 shadow-sm">
                <XCircle className="w-4 h-4 shrink-0" />
                Không thể kết nối. Lưu offline! 🔌
              </div>
            )}

            <button
              onClick={() => {
                setStage("intro");
                setMessages([]);
                setKeywordsMentioned([]);
                setProbingTurnsCount(0);
                setShowMcq(false);
                setSelectedMcqOption(null);
                setMcqAnswered(false);
                setIsMcqCorrect(null);
                setTypedWord("");
                setWritingSubmitted(false);
                setSaveSuccess(null);
                setPictureIndex(0);
                setKeywordsHitPic1(0);
                setTotalProbingTurns(0);
                setWritingTaskIndex(0);
                setSpellingCorrect1(null);
                setSpellingCorrect2(null);
              }}
              className="btn-3d-yellow w-full sm:w-auto px-8 py-4 text-sm tracking-wider uppercase flex items-center justify-center gap-1 hover:scale-105 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Thi Lại Bài Test 🔄
            </button>

            <Link href="/" className="w-full sm:w-auto">
              <button className="btn-3d-blue w-full sm:w-auto px-8 py-4 text-sm tracking-wider uppercase flex items-center justify-center gap-1 hover:scale-105 cursor-pointer">
                <Home className="w-4 h-4" />
                Về Trang Chủ 🏠
              </button>
            </Link>

          </section>

        </main>
      </div>
    );
  }

  // 3. Main Testing stages interface
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col max-w-4xl mx-auto h-screen relative">
      {/* Hidden audio element for TTS */}
      <audio ref={audioRef} className="hidden" />

      {/* Header with Stage indicators */}
      <div className="bg-white p-4 shadow-sm flex items-center justify-between sticky top-0 z-10 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-xl">👩‍🏫</div>
          <div>
            <h2 className="font-bold text-slate-800">Cô giáo AI</h2>
            <p className="text-xs text-blue-500 font-medium capitalize">
              Đang trong phòng thi (Giai đoạn {stage === "warmup" ? "1" : stage === "picture" ? "2" : stage === "reading" ? "3" : "4"})
            </p>
          </div>
        </div>

        {/* Cambridge Progress Bar */}
        <div className="hidden sm:flex items-center gap-2 max-w-xs w-full bg-slate-100 rounded-full h-3 border border-slate-200 px-0.5 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
            style={{ 
              width: 
                stage === "warmup" ? "25%" : 
                stage === "picture" ? "50%" : 
                stage === "reading" ? "75%" : "95%" 
            }}
          />
        </div>

        <Link href="/" className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-200">
          Thoát
        </Link>
      </div>

      {/* Context Area - Dynamically based on current stage */}
      {stage === "picture" && currentQuestion && (
        <div className="bg-amber-50 p-4 border-b border-amber-200 flex flex-col items-center select-none">
          <h3 className="font-extrabold text-amber-700 mb-2.5 flex items-center gap-2 text-sm uppercase tracking-wider text-center">
            <ImageIcon className="w-5 h-5 shrink-0 animate-bounce" /> 
            [Picture {pictureIndex + 1}/2] Look at this picture and describe what you see:
          </h3>
          {currentQuestion.imagePath && (
            <div className="relative w-full max-w-md aspect-video rounded-2xl overflow-hidden shadow-md border-4 border-white">
              <Image 
                src={currentQuestion.imagePath} 
                alt="Test image" 
                fill 
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 450px"
              />
            </div>
          )}
          
          {/* Real-time word mentions rewards for kids */}
          {keywordsMentioned.length > 0 && (
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {keywordsMentioned.map((word) => (
                <span key={word} className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 animate-bounce-subtle">
                  ✨ {word}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {stage === "reading" && (
        <div className="bg-emerald-50 p-6 border-b border-emerald-200 flex flex-col items-center">
          
          {!showMcq ? (
            // Reading Aloud slide
            <div className="w-full max-w-xl text-center">
              <h3 className="font-extrabold text-emerald-800 mb-3 flex items-center justify-center gap-2 text-sm uppercase tracking-wider">
                <BookOpen className="w-5 h-5 animate-pulse text-emerald-600" />
                Read this story out loud for the AI Teacher:
              </h3>
              
              <div className="bg-white border-4 border-emerald-300 rounded-3xl p-6 shadow-md my-4">
                <p className="text-base md:text-lg font-bold text-slate-800 leading-relaxed font-sans select-none">
                  "{activeStory}"
                </p>
              </div>
            </div>
          ) : (
            // Reading MCQ slide
            <div className="w-full max-w-xl text-center animate-pulse-slow">
              <h3 className="font-extrabold text-blue-800 mb-3 flex items-center justify-center gap-2 text-sm uppercase tracking-wider">
                <Sparkles className="w-5 h-5 text-blue-500 fill-blue-100" />
                Question Time! Choose the correct answer:
              </h3>
              
              <div className="bg-white border-4 border-blue-200 rounded-3xl p-5 shadow-sm my-4 text-center">
                <p className="text-lg md:text-xl font-extrabold text-slate-700">
                  {activeMcq.question}
                </p>
              </div>

              {/* Interactive MCQ Choices */}
              <div className="flex flex-col gap-3.5 mt-6 w-full max-w-md mx-auto text-left">
                {activeMcq.options.map((option: string, idx: number) => {
                  const isSelected = selectedMcqOption === idx;
                  const isCorrectOption = idx === activeMcq.correctIndex;
                  
                  let optionClass = "bg-white border-2 border-slate-200 text-slate-700 hover:border-blue-400";
                  if (mcqAnswered) {
                    if (isCorrectOption) {
                      optionClass = "bg-emerald-50 border-2 border-emerald-400 text-emerald-700 scale-105 shadow-md shadow-emerald-100";
                    } else if (isSelected) {
                      optionClass = "bg-rose-50 border-2 border-rose-400 text-rose-700 scale-95 opacity-80";
                    } else {
                      optionClass = "bg-slate-50 border border-slate-100 text-slate-400 opacity-60";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleMcqSelect(idx)}
                      disabled={mcqAnswered}
                      className={`w-full p-4 rounded-2xl font-extrabold text-base transition-all duration-200 cursor-pointer shadow-sm flex items-center justify-between ${optionClass}`}
                    >
                      <span>{option}</span>
                      {mcqAnswered && isCorrectOption && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-100 shrink-0 ml-2" />
                      )}
                      {mcqAnswered && isSelected && !isCorrectOption && (
                        <XCircle className="w-5 h-5 text-rose-500 fill-rose-100 shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      )}

      {stage === "writing" && (
        <div className="bg-indigo-50 p-6 border-b border-indigo-200 flex flex-col items-center">
          <div className="w-full max-w-xl text-center">
            <h3 className="font-extrabold text-indigo-800 mb-3 flex items-center justify-center gap-2 text-sm uppercase tracking-wider">
              <PenTool className="w-5 h-5 animate-pulse text-indigo-500" />
              Spelling Task [{writingTaskIndex + 1}/2]! Type the correct word:
            </h3>

            <div className="bg-white border-4 border-indigo-200 rounded-3xl p-6 shadow-md my-4 flex flex-col items-center max-w-md mx-auto">
              <div className="text-5xl mb-3 animate-bounce" style={{ animationDuration: "3s" }}>
                {writingTaskIndex === 0 ? "🐒" : "🍌"}
              </div>
              
              <p className="text-slate-600 font-extrabold text-sm leading-relaxed mb-4 text-center">
                Cô giáo AI hỏi: "{activeSpelling[writingTaskIndex].prompt}"
              </p>

              <form onSubmit={handleWritingSubmit} className="w-full">
                <input 
                  type="text" 
                  value={typedWord}
                  onChange={(e) => setTypedWord(e.target.value)}
                  disabled={writingSubmitted}
                  placeholder="Gõ câu trả lời của con tại đây..."
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-indigo-200 rounded-2xl font-black text-center text-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all shadow-inner uppercase tracking-wider"
                  autoComplete="off"
                  autoCorrect="off"
                />

                <button
                  type="submit"
                  disabled={!typedWord.trim() || writingSubmitted}
                  className="w-full mt-4 btn-3d-blue py-3 font-extrabold text-base flex items-center justify-center gap-2 hover:scale-105 disabled:opacity-50 cursor-pointer"
                >
                  Nộp bài viết 🚀
                </button>
              </form>

              {writingSubmitted && (
                <div className="mt-4 animate-bounce-subtle text-xs font-black text-center">
                  {typedWord.toLowerCase().trim() === activeSpelling[writingTaskIndex].correctWord.toLowerCase().trim() ? (
                    <span className="text-emerald-600">🎉 Xuất sắc! Con đã viết chính xác rồi!</span>
                  ) : (
                    <span className="text-rose-500">✍️ Con viết gần đúng rồi, cô đang ghi nhận điểm nhé!</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Chat Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "ai" ? "justify-start" : "justify-end"}`}>
            <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${
              msg.role === "ai" 
                ? "bg-white border-2 border-blue-100 text-slate-800 rounded-tl-sm" 
                : "bg-blue-500 text-white rounded-tr-sm"
            }`}>
              <p className="font-medium">{msg.content}</p>
            </div>
          </div>
        ))}
        
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-white border-2 border-blue-100 p-4 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-2 text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              <span className="font-medium text-sm">Cô giáo đang nghe...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Microphone recording input triggers */}
      <div className="p-4 bg-white border-t sticky bottom-0">
        <div className="flex items-center justify-center gap-4">
          {!isRecording ? (
            <button 
              onClick={startRecording}
              disabled={isProcessing || showMcq || stage === "writing"}
              className="w-20 h-20 bg-green-500 text-white rounded-full flex flex-col items-center justify-center hover:scale-105 hover:bg-green-600 disabled:opacity-30 disabled:hover:scale-100 transition-all shadow-lg cursor-pointer"
            >
              <Mic className="w-8 h-8 mb-1" />
              <span className="text-[10px] font-black uppercase">Nói</span>
            </button>
          ) : (
            <button 
              onClick={stopRecording}
              className="w-20 h-20 bg-rose-500 text-white rounded-full flex flex-col items-center justify-center hover:scale-105 animate-pulse shadow-lg shadow-rose-200 cursor-pointer"
            >
              <Square className="w-8 h-8 mb-1" />
              <span className="text-[10px] font-black uppercase">Dừng</span>
            </button>
          )}
        </div>
        <p className="text-center text-xs text-slate-400 mt-3 font-medium select-none">
          {stage === "writing" 
            ? "Con gõ từ vào ô nhập liệu ở trên rồi bấm Nộp bài nhé" 
            : showMcq 
            ? "Bé hãy bấm chọn 1 đáp án trắc nghiệm ở trên nhé!" 
            : isRecording 
            ? "Đang nghe... Bấm nút Dừng màu Đỏ khi nói xong" 
            : "Bấm nút Nói màu Xanh để trả lời cô giáo"}
        </p>
      </div>
    </div>
  );
}
