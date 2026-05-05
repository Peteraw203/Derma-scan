import { Bell, Search, Microscope, MessageSquare, Stethoscope, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center w-full min-h-full py-6 md:py-12 px-5 md:px-8">
      <div className="w-full max-w-4xl flex flex-col gap-12 md:gap-16">

        {/* Header & Search Group */}
        <div className="flex flex-col gap-8 w-full">
          {/* Header */}
          <div className="flex w-full items-center justify-between">
            <div className="flex flex-col">
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Hello, User 👋</h1>
              <p className="text-slate-500 mt-2 text-sm md:text-base font-medium">Ready to protect your skin health today?</p>
            </div>
            <button className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center hover:bg-slate-50 hover:shadow-md transition-all cursor-pointer flex-shrink-0">
              <Bell className="w-5 h-5 md:w-6 md:h-6 text-slate-700" />
            </button>
          </div>

          {/* Search */}
          <div className="w-full flex items-center bg-white border border-slate-200 shadow-sm rounded-2xl group focus-within:ring-4 focus-within:ring-emerald-500/10 focus-within:border-emerald-500 transition-all overflow-hidden">
            <div className="pl-6 flex items-center justify-center">
              <Search className="w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search conditions, clinics, doctors..."
              className="flex-1 h-14 md:h-16 pl-4 pr-5 bg-transparent outline-none text-slate-700 font-medium placeholder:text-slate-400 text-sm md:text-base"
            />
          </div>
        </div>

        {/* Banner - Centered Approach */}
        <div className="w-full rounded-[32px] bg-gradient-to-br from-emerald-500 to-emerald-700 p-8 md:p-12 flex flex-col items-center text-center shadow-xl relative overflow-hidden group hover:shadow-2xl transition-all duration-300">
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

            <Link href="/scanner" className="inline-flex items-center justify-center px-8 py-4 bg-white text-emerald-600 font-bold text-sm md:text-base rounded-2xl hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all shadow-lg gap-2 border border-emerald-500">
              Start Checkup <ArrowRight className="w-5 h-5 ml-1" />
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="w-full flex flex-col gap-6">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">Our Services</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            <Link href="/scanner" className="flex flex-col items-center text-center p-6 bg-white rounded-3xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-lg hover:-translate-y-1 transition-all group">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-5 group-hover:bg-emerald-500 transition-colors">
                <Microscope className="w-7 h-7 md:w-8 md:h-8 text-emerald-600 group-hover:text-white" />
              </div>
              <h4 className="font-bold text-slate-800 mb-1.5 text-base md:text-lg">Scan</h4>
              <p className="text-[13px] md:text-sm text-slate-500 font-medium">AI skin test</p>
            </Link>

            <Link href="/chat-ai" className="flex flex-col items-center text-center p-6 bg-white rounded-3xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-lg hover:-translate-y-1 transition-all group">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-5 group-hover:bg-blue-500 transition-colors">
                <MessageSquare className="w-7 h-7 md:w-8 md:h-8 text-blue-600 group-hover:text-white" />
              </div>
              <h4 className="font-bold text-slate-800 mb-1.5 text-base md:text-lg">Derma AI</h4>
              <p className="text-[13px] md:text-sm text-slate-500 font-medium">24/7 Chatbot</p>
            </Link>

            <Link href="/consult" className="flex flex-col items-center text-center p-6 bg-white rounded-3xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-lg hover:-translate-y-1 transition-all group">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-purple-50 flex items-center justify-center mb-5 group-hover:bg-purple-500 transition-colors">
                <Stethoscope className="w-7 h-7 md:w-8 md:h-8 text-purple-600 group-hover:text-white" />
              </div>
              <h4 className="font-bold text-slate-800 mb-1.5 text-base md:text-lg">Our Doctors</h4>
              <p className="text-[13px] md:text-sm text-slate-500 font-medium">Specialists</p>
            </Link>

            <Link href="/consult" className="flex flex-col items-center text-center p-6 bg-white rounded-3xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-lg hover:-translate-y-1 transition-all group">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-orange-50 flex items-center justify-center mb-5 group-hover:bg-orange-500 transition-colors">
                <MessageSquare className="w-7 h-7 md:w-8 md:h-8 text-orange-600 group-hover:text-white" />
              </div>
              <h4 className="font-bold text-slate-800 mb-1.5 text-base md:text-lg">Live Consult</h4>
              <p className="text-[13px] md:text-sm text-slate-500 font-medium">Telemedicine</p>
            </Link>
          </div>
        </div>

        {/* Doctors */}
        <div className="w-full flex flex-col gap-6">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">Top Specialists</h3>
            <button className="text-sm font-bold text-emerald-600 hover:text-emerald-700 hover:underline">See all</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div className="flex items-center p-5 md:p-6 bg-white rounded-3xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-lg hover:border-emerald-100 transition-all cursor-pointer group">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-700 font-extrabold text-2xl md:text-3xl mr-5 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors flex-shrink-0">
                M
              </div>
              <div className="flex-1 overflow-hidden">
                <h4 className="text-lg md:text-xl font-bold text-slate-800 truncate">Dr. Maya, MD</h4>
                <p className="text-sm md:text-base text-slate-500 mb-1.5 font-medium truncate">Dermatologist</p>
                <div className="flex items-center gap-1.5">
                  <span className="text-amber-400 text-sm">★</span>
                  <span className="text-sm font-bold text-slate-700">4.8</span>
                  <span className="text-xs md:text-sm text-slate-400 ml-1">(120 reviews)</span>
                </div>
              </div>
              <button className="px-5 py-2.5 md:py-3 md:px-6 bg-slate-50 text-emerald-600 font-bold text-sm md:text-base rounded-xl group-hover:bg-emerald-500 group-hover:text-white transition-colors border border-slate-100 group-hover:border-emerald-500 flex-shrink-0 ml-2">
                Chat
              </button>
            </div>

            <div className="flex items-center p-5 md:p-6 bg-white rounded-3xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-lg hover:border-emerald-100 transition-all cursor-pointer group">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-700 font-extrabold text-2xl md:text-3xl mr-5 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors flex-shrink-0">
                A
              </div>
              <div className="flex-1 overflow-hidden">
                <h4 className="text-lg md:text-xl font-bold text-slate-800 truncate">Dr. Arva, MD</h4>
                <p className="text-sm md:text-base text-slate-500 mb-1.5 font-medium truncate">Oncologist</p>
                <div className="flex items-center gap-1.5">
                  <span className="text-amber-400 text-sm">★</span>
                  <span className="text-sm font-bold text-slate-700">4.9</span>
                  <span className="text-xs md:text-sm text-slate-400 ml-1">(84 reviews)</span>
                </div>
              </div>
              <button className="px-5 py-2.5 md:py-3 md:px-6 bg-slate-50 text-emerald-600 font-bold text-sm md:text-base rounded-xl group-hover:bg-emerald-500 group-hover:text-white transition-colors border border-slate-100 group-hover:border-emerald-500 flex-shrink-0 ml-2">
                Chat
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
