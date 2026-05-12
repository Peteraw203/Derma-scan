"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Send, Bot, User } from "lucide-react";
import Link from "next/link";

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
      content: "Halo! Saya adalah asisten AI Derma-Scan. Saya siap membantu Anda dengan informasi mengenai kesehatan kulit, jerawat, hingga deteksi dini kanker kulit. Ada yang bisa saya bantu?",
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

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { id: Date.now().toString(), role: "user" as const, content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      const data = await response.json();
      
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "bot", content: data.response || data.error || "Sorry, an error occurred." },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "bot", content: "Sorry, there was a network error." },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col w-full h-screen max-w-4xl mx-auto bg-white md:border-x md:border-gray-100 shadow-sm relative">
      {/* Header */}
      <div className="flex items-center px-6 py-5 bg-white border-b border-gray-100 z-10 relative">
        <Link href="/" className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-3 hover:bg-gray-200 transition-colors">
          <ArrowLeft className="w-5 h-5 text-health-dark-blue" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-health-green/10 flex items-center justify-center">
            <Bot className="w-6 h-6 text-health-green" />
          </div>
          <div>
            <h1 className="text-base font-bold text-health-dark-blue">Derma-Scan AI</h1>
            <p className="text-xs text-text-gray">Always active</p>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-5 pb-24 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl p-4 ${
              msg.role === "user" 
                ? "bg-health-green text-white rounded-tr-none" 
                : "bg-white border border-gray-100 text-health-dark-blue rounded-tl-none shadow-sm"
            }`}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-none p-4 shadow-sm flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-health-green animate-bounce" style={{ animationDelay: "0ms" }}></div>
              <div className="w-2 h-2 rounded-full bg-health-green animate-bounce" style={{ animationDelay: "150ms" }}></div>
              <div className="w-2 h-2 rounded-full bg-health-green animate-bounce" style={{ animationDelay: "300ms" }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="absolute bottom-0 w-full bg-white border-t border-gray-100 p-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Tanyakan tentang kesehatan kulit..."
            className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-5 py-3 text-sm focus:outline-none focus:border-health-green"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="w-12 h-12 rounded-full bg-health-green flex items-center justify-center text-white disabled:opacity-50 hover:bg-health-green/90 transition-colors shrink-0"
          >
            <Send className="w-5 h-5 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
}
