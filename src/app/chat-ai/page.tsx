"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Send, ShieldPlus, Sparkles, User, Activity } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

interface Message {
  id: string;
  role: "user" | "bot";
  content: string;
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "bot",
      content: "Halo! Saya adalah **Derma-Scan AI**, asisten medis virtual Anda. Saya dapat membantu memberikan informasi terkait masalah kulit, analisis gejala, serta panduan kesehatan kulit secara umum. \n\n*Apa yang bisa saya bantu hari ini?*",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const sendMessage = async (textToSend: string, currentMessages: Message[]) => {
    if (!textToSend.trim()) return;

    const userMessage = { id: Date.now().toString(), role: "user" as const, content: textToSend.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...currentMessages, userMessage] }),
      });

      const data = await response.json();
      
      setMessages((prev) => [
        ...prev,
        { 
          id: (Date.now() + 1).toString(), 
          role: "bot", 
          content: data.response || 
                   (data.error ? `${data.error}\n\n*Detail Error: ${data.details || "Tidak ada detail tambahan"}*` : "") || 
                   "Maaf, terjadi kesalahan saat memproses pesan Anda." 
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "bot", content: "Maaf, terjadi gangguan jaringan. Silakan coba lagi." },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const text = input;
    setInput("");
    await sendMessage(text, messages);
  };

  const didInitRef = useRef(false);

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;

    const params = new URLSearchParams(window.location.search);
    const source = params.get("source");

    const welcomeMessage = {
      id: "welcome",
      role: "bot" as const,
      content: "Halo! Saya adalah **Derma-Scan AI**, asisten medis virtual Anda. Saya dapat membantu memberikan informasi terkait masalah kulit, analisis gejala, serta panduan kesehatan kulit secara umum. \n\n*Apa yang bisa saya bantu hari ini?*",
    };

    if (source === "scanner") {
      const label = params.get("label") || "";
      const confidence = params.get("confidence") || "";
      const text = `Saya baru saja melakukan pemindaian lesi kulit menggunakan model YOLOv12. Hasil deteksi menunjukkan kemungkinan: **${label}** dengan tingkat keyakinan **${confidence}%**. Bisa tolong jelaskan apa artinya dan langkah medis apa yang harus saya lakukan selanjutnya?`;
      sendMessage(text, [welcomeMessage]);
    } else if (source === "iot") {
      const distance = params.get("distance") || "";
      const status = params.get("status") || "";
      const baseline = params.get("baseline") || "";
      const target = params.get("target") || "";
      
      const text = `Saya melakukan analisis komparatif warna kulit menggunakan sensor warna TCS34725. Hasil komparasi menunjukkan perbedaan sebesar **${distance} Delta-E** (Status: **${status.toUpperCase()}**). \n\nDetail:\n- Warna kulit sehat: **${baseline}**\n- Warna area lesi/luka: **${target}**\n\nApakah perbedaan pigmen warna kulit seperti ini tergolong berisiko atau normal?`;
      sendMessage(text, [welcomeMessage]);
    } else if (source === "combined") {
      const label = params.get("label") || "";
      const confidence = params.get("confidence") || "";
      const distance = params.get("distance") || "";
      const status = params.get("status") || "";
      const baseline = params.get("baseline") || "";
      const target = params.get("target") || "";

      const text = `Saya ingin mengonsultasikan kondisi kulit saya berdasarkan pemeriksaan terintegrasi:\n\n` +
        `1. **Hasil Pemindaian Visual (YOLOv12 Scanner)**:\n` +
        `   - Prediksi Jenis Lesi: **${label}**\n` +
        `   - Tingkat Keyakinan: **${confidence}%**\n\n` +
        `2. **Hasil Analisis Warna Pigmen (Sensor TCS34725)**:\n` +
        `   - Perbedaan Warna: **${distance} Delta-E** (Status: **${status.toUpperCase()}**)\n` +
        `   - Warna Kulit Sehat (Baseline): **${baseline}**\n` +
        `   - Warna Area Lesi (Target): **${target}**\n\n` +
        `Mohon berikan penjelasan medis komprehensif yang mengintegrasikan kedua hasil analisis di atas (prediksi jenis lesi visual & variasi tingkat keparahan perbedaan pigmen warna kulit). Apakah kombinasi hasil ini menunjukkan risiko tinggi, dan langkah medis apa yang Anda rekomendasikan?`;
      sendMessage(text, [welcomeMessage]);
    }
  }, []);

  return (
    <div className="flex flex-col w-full h-screen max-w-5xl mx-auto bg-slate-50 dark:bg-slate-950 md:border-x border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden transition-colors duration-300">
      {/* Decorative Header Background */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-blue-100/50 dark:from-blue-900/20 to-transparent z-0 pointer-events-none" />

      {/* Header */}
      <div className="flex items-center px-6 py-5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 z-10 sticky top-0 shadow-sm dark:shadow-slate-900/50">
        <Link href="/" className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mr-4 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-700 dark:text-slate-300" />
        </Link>
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20">
              <ShieldPlus className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              Derma-Scan AI
              <Sparkles className="w-4 h-4 text-amber-400" />
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
              <Activity className="w-3 h-3 text-green-500" /> Professional Medical Assistant
            </p>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6 pb-32 space-y-6 z-10 scroll-smooth">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div 
              key={msg.id} 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={clsx(
                "flex w-full",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div className={clsx(
                "flex max-w-[85%] gap-3",
                msg.role === "user" ? "flex-row-reverse" : "flex-row"
              )}>
                
                {/* Avatar */}
                <div className="flex-shrink-0 mt-auto">
                  {msg.role === "user" ? (
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                      <User className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                      <ShieldPlus className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>

                {/* Bubble */}
                <div className={clsx(
                  "px-5 py-4 shadow-sm relative",
                  msg.role === "user" 
                    ? "bg-blue-600 dark:bg-blue-600 text-white rounded-3xl rounded-br-sm" 
                    : "bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-3xl rounded-bl-sm"
                )}>
                  <div className={clsx(
                    "prose prose-sm max-w-none leading-relaxed",
                    msg.role === "user" ? "prose-invert" : "dark:prose-invert prose-slate"
                  )}>
                    {msg.role === "bot" ? (
                      <ReactMarkdown
                        components={{
                          strong: ({node, ...props}) => <span className="font-bold text-indigo-700 dark:text-indigo-400" {...props}/>,
                          ul: ({node, ...props}) => <ul className="list-disc pl-4 space-y-1 my-2" {...props}/>,
                          ol: ({node, ...props}) => <ol className="list-decimal pl-4 space-y-1 my-2" {...props}/>,
                          p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props}/>
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    ) : (
                      <p>{msg.content}</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isTyping && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start w-full"
          >
             <div className="flex gap-3">
                <div className="flex-shrink-0 mt-auto">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                    <ShieldPlus className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl rounded-bl-sm px-5 py-5 shadow-sm flex items-center gap-2">
                  <motion.div className="w-2 h-2 rounded-full bg-indigo-500 dark:bg-indigo-400" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} />
                  <motion.div className="w-2 h-2 rounded-full bg-indigo-500 dark:bg-indigo-400" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} />
                  <motion.div className="w-2 h-2 rounded-full bg-indigo-500 dark:bg-indigo-400" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} />
                </div>
             </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="absolute bottom-0 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 p-4 z-20">
        <div className="max-w-4xl mx-auto flex items-end gap-3 relative">
          <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-3xl p-2 flex items-end shadow-inner focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 dark:focus-within:border-indigo-400 transition-all">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Jelaskan gejala kulit yang Anda alami..."
              className="flex-1 bg-transparent px-4 py-2 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none resize-none max-h-32 min-h-[44px]"
              rows={1}
              style={{ overflowY: 'auto' }}
            />
          </div>
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="w-[60px] h-[60px] rounded-full bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 disabled:opacity-50 hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all active:scale-95 shrink-0"
          >
            <Send className="w-5 h-5 ml-1" />
          </button>
        </div>
        <p className="text-center text-[10px] text-slate-400 mt-3 font-medium">
          Derma-Scan AI dapat membuat kesalahan. Harap selalu konsultasikan dengan dokter ahli.
        </p>
      </div>
    </div>
  );
}
