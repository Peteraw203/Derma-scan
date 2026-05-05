"use client";

import { useState } from "react";
import { Home, MapPin, Cpu, User, Sparkles, MessageSquare, Microscope, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Scanner", href: "/scanner", icon: Microscope },
    { name: "Consult", href: "/consult", icon: Sparkles },
    { name: "AI Chat", href: "/chat-ai", icon: MessageSquare },
    { name: "Maps", href: "/maps", icon: MapPin },
    { name: "IoT", href: "/iot", icon: Cpu },
    { name: "Profile", href: "/profile", icon: User },
  ];

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#f8fafc]">
      
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-900/50 z-40 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar (Desktop static & Mobile sliding) */}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 shadow-xl md:shadow-none flex flex-col transition-transform duration-300 ease-in-out flex-shrink-0 ${
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      }`}>
        <div className="h-16 md:h-20 flex items-center justify-between px-6 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-emerald-500 rounded-xl shadow-md shadow-emerald-200">
              <Microscope className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-extrabold text-slate-800 tracking-tight">Derma<span className="text-emerald-500">Scan</span></span>
          </div>
          {/* Close button for mobile */}
          <button 
            className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 py-6 px-4 flex flex-col gap-3 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link 
                key={item.name} 
                href={item.href} 
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-5 px-5 py-4 rounded-2xl font-bold transition-all duration-200 ${
                  isActive 
                    ? 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100/50' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-[22px] h-[22px] ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span className="text-[15px]">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex-shrink-0">
          <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:border-emerald-200 hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold border-2 border-white shadow-sm flex-shrink-0">
              U
            </div>
            <div className="flex flex-col flex-1 overflow-hidden">
              <span className="text-sm font-bold text-slate-800 truncate">User Name</span>
              <span className="text-[11px] text-slate-500 font-medium truncate">Free Plan</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        
        {/* Top Navbar (Mobile Only) */}
        <header className="md:hidden flex-shrink-0 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Microscope className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-800">Derma<span className="text-emerald-500">Scan</span></span>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100"
          >
            <Menu className="w-6 h-6" />
          </button>
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto w-full relative">
          {children}
        </main>
      </div>
    </div>
  );
}
