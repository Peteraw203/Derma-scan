"use client";

import { useState, useEffect } from "react";
import { Home, MapPin, Cpu, User, Sparkles, MessageSquare, Microscope, Menu, X, Moon, Sun } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { APIProvider } from "@vis.gl/react-google-maps";
import { useTheme } from "next-themes";
import { useAuth } from "@/context/AuthContext";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);
  
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  const navItems = [
    { name: "Overview", href: "/", icon: Home },
    { name: "Scan Kulit", href: "/scanner", icon: Microscope },
    { name: "Sensor Warna", href: "/iot", icon: Cpu },
    { name: "Konsultasi AI", href: "/chat-ai", icon: MessageSquare },
    { name: "Klinik Terdekat", href: "/maps", icon: MapPin },
    { name: "Riwayat & Profil", href: "/profile", icon: User },
  ];

  return (
    <APIProvider apiKey={googleMapsApiKey} libraries={['routes', 'geometry', 'marker', 'places']}>
      <div className="flex h-screen w-full overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        
        {/* Mobile Sidebar Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="md:hidden fixed inset-0 bg-slate-900/50 dark:bg-black/60 z-40 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar (Desktop static & Mobile sliding) */}
        <aside className={`fixed md:static inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-xl md:shadow-none flex flex-col transition-transform duration-300 ease-in-out flex-shrink-0 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}>
          <div className="h-16 md:h-20 flex items-center justify-between px-6 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-emerald-500 rounded-xl shadow-md shadow-emerald-200 dark:shadow-none">
                <Microscope className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">Derma<span className="text-emerald-500">Scan</span></span>
            </div>
            {/* Close button for mobile */}
            <button 
              className="md:hidden p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
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
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 shadow-sm border border-emerald-100/50 dark:border-emerald-500/20' 
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className={`w-[22px] h-[22px] ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`} />
                  <span className="text-[15px]">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col gap-3 flex-shrink-0">
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors w-full justify-center shadow-sm"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-5 h-5" />
                    <span className="text-sm font-semibold">Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-5 h-5" />
                    <span className="text-sm font-semibold">Dark Mode</span>
                  </>
                )}
              </button>
            )}
            
            <Link 
              href={user ? "/profile" : "/login"}
              className="flex items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer hover:border-emerald-200 dark:hover:border-emerald-500/50 hover:shadow-md transition-all text-left"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold border-2 border-white dark:border-slate-800 shadow-sm flex-shrink-0">
                {user ? (user.displayName?.[0] || user.email?.[0] || "U").toUpperCase() : "G"}
              </div>
              <div className="flex flex-col flex-1 overflow-hidden">
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                  {user ? (user.displayName || user.email?.split("@")[0] || "User") : "Guest"}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                  {user ? user.email : "Klik untuk Masuk"}
                </span>
              </div>
            </Link>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0 bg-slate-50 dark:bg-slate-950">
          
          {/* Top Navbar (Mobile Only) */}
          <header className="md:hidden flex-shrink-0 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 z-30">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <Microscope className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-slate-800 dark:text-white">Derma<span className="text-emerald-500">Scan</span></span>
            </div>
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
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
    </APIProvider>
  );
}
