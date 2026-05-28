"use client";

import { Bell, Search, Microscope, MessageSquare, Stethoscope, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col items-center w-full min-h-full py-6 md:py-12 px-5 md:px-8 transition-colors duration-300">
      <div className="w-full max-w-4xl flex flex-col gap-12 md:gap-16">

        {/* Header & Search Group */}
        <div className="flex flex-col gap-8 w-full">
          {/* Header */}
          <div className="flex w-full items-center justify-between">
            <div className="flex flex-col">
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">Hello, {user ? (user.displayName || user.email?.split("@")[0] || "User") : "Guest"} 👋</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm md:text-base font-medium">Ready to protect your skin health today?</p>
            </div>
            <button className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 hover:shadow-md transition-all cursor-pointer flex-shrink-0">
              <Bell className="w-5 h-5 md:w-6 md:h-6 text-slate-700 dark:text-slate-300" />
            </button>
          </div>

          {/* Search */}
          <div className="w-full flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl group focus-within:ring-4 focus-within:ring-emerald-500/10 dark:focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all overflow-hidden">
            <div className="pl-6 flex items-center justify-center">
              <Search className="w-5 h-5 text-slate-400 dark:text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search conditions, clinics, doctors..."
              className="flex-1 h-14 md:h-16 pl-4 pr-5 bg-transparent outline-none text-slate-700 dark:text-slate-200 font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm md:text-base"
            />
          </div>
        </div>

        {/* Banner - Centered Approach */}
        <div className="w-full rounded-[32px] bg-gradient-to-br from-emerald-500 to-emerald-700 dark:from-emerald-600 dark:to-emerald-900 p-8 md:p-12 flex flex-col items-center text-center shadow-xl dark:shadow-emerald-900/20 relative overflow-hidden group hover:shadow-2xl transition-all duration-300">
          {/* Decorative Backgrounds */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

          <div className="relative z-10 flex flex-col items-center">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-white/10 rounded-3xl backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner mb-6 group-hover:scale-110 transition-transform duration-500">
              <Microscope className="w-10 h-10 md:w-12 md:h-12 text-white drop-shadow-md" />
            </div>

            <span className="inline-block px-4 py-1.5 bg-white/20 text-white text-[11px] md:text-xs font-bold rounded-full backdrop-blur-md mb-4 uppercase tracking-widest">
              AI-Powered Scanner
            </span>

            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4 leading-tight tracking-tight">
              Early protection for<br className="hidden md:block" /> your skin health
            </h2>

            <p className="text-emerald-50 text-sm md:text-base mb-8 max-w-lg font-medium leading-relaxed opacity-90">
              Use our advanced computer vision model to detect potential skin cancer symptoms in seconds.
            </p>

            <Link href="/scanner" className="inline-flex items-center justify-center px-8 py-4 bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 font-bold text-sm md:text-base rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 hover:scale-105 active:scale-95 transition-all shadow-lg gap-2 border border-emerald-500 dark:border-emerald-600">
              Start Checkup <ArrowRight className="w-5 h-5 ml-1" />
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="w-full flex flex-col gap-6">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Our Services</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            <Link href="/scanner" className="flex flex-col items-center text-center p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-lg hover:-translate-y-1 transition-all group">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-5 group-hover:bg-emerald-500 transition-colors">
                <Microscope className="w-7 h-7 md:w-8 md:h-8 text-emerald-600 dark:text-emerald-400 group-hover:text-white" />
              </div>
              <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-1.5 text-base md:text-lg">Scan</h4>
              <p className="text-[13px] md:text-sm text-slate-500 dark:text-slate-400 font-medium">AI skin test</p>
            </Link>

            <Link href="/chat-ai" className="flex flex-col items-center text-center p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-lg hover:-translate-y-1 transition-all group">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center mb-5 group-hover:bg-blue-500 transition-colors">
                <MessageSquare className="w-7 h-7 md:w-8 md:h-8 text-blue-600 dark:text-blue-400 group-hover:text-white" />
              </div>
              <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-1.5 text-base md:text-lg">Derma AI</h4>
              <p className="text-[13px] md:text-sm text-slate-500 dark:text-slate-400 font-medium">24/7 Chatbot</p>
            </Link>

            <Link href="/consult" className="flex flex-col items-center text-center p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-lg hover:-translate-y-1 transition-all group">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center mb-5 group-hover:bg-purple-500 transition-colors">
                <Stethoscope className="w-7 h-7 md:w-8 md:h-8 text-purple-600 dark:text-purple-400 group-hover:text-white" />
              </div>
              <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-1.5 text-base md:text-lg">Our Doctors</h4>
              <p className="text-[13px] md:text-sm text-slate-500 dark:text-slate-400 font-medium">Specialists</p>
            </Link>

            <Link href="/consult" className="flex flex-col items-center text-center p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-lg hover:-translate-y-1 transition-all group">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center mb-5 group-hover:bg-orange-500 transition-colors">
                <MessageSquare className="w-7 h-7 md:w-8 md:h-8 text-orange-600 dark:text-orange-400 group-hover:text-white" />
              </div>
              <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-1.5 text-base md:text-lg">Live Consult</h4>
              <p className="text-[13px] md:text-sm text-slate-500 dark:text-slate-400 font-medium">Telemedicine</p>
            </Link>
          </div>
        </div>

        {/* Subtle Footer */}
        <div className="w-full text-center py-6 border-t border-slate-100 dark:border-slate-800/30 mt-8">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium tracking-wide">
            made by{" "}
            <a 
              href="https://peterabednegowijaya.vercel.app" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-slate-500 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors hover:underline"
            >
              peter
            </a>{" "}
            —{" "}
            <a 
              href="https://peterabednegowijaya.vercel.app" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-slate-500 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors hover:underline"
            >
              peterabednegowijaya.vercel.app
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
