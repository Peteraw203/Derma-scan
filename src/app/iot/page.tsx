"use client";

import { Cpu, Activity } from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function IotScreen() {
  const [rgb, setRgb] = useState({ r: 120, g: 85, b: 60 });

  // Simulate real-time data update
  useEffect(() => {
    const interval = setInterval(() => {
      setRgb({
        r: Math.floor(Math.random() * 255),
        g: Math.floor(Math.random() * 255),
        b: Math.floor(Math.random() * 255),
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col w-full min-h-screen p-6 md:p-10 relative overflow-hidden transition-colors duration-300">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-red-500/10 dark:bg-red-500/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-[100px]" />
      
      <div className="flex items-center gap-3 mb-10 relative z-10">
        <Cpu className="w-8 h-8 text-emerald-500 dark:text-emerald-400" />
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Sensor Warna <span className="text-emerald-500 dark:text-emerald-400">TCS34725</span></h1>
        <div className="ml-auto flex items-center gap-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-full border border-emerald-200 dark:border-emerald-500/30">
          <Activity className="w-4 h-4 animate-pulse" />
          <span className="text-sm font-semibold tracking-wider">LIVE</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        {/* Red Card */}
        <motion.div 
          key={`r-${rgb.r}`}
          initial={{ opacity: 0.8, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-white/80 dark:bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-red-200 dark:border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.1)] flex flex-col items-center justify-center relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 dark:from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <h2 className="text-red-600 dark:text-red-400 font-bold text-xl mb-2 tracking-widest">RED</h2>
          <div className="text-7xl font-black text-slate-800 dark:text-white tabular-nums drop-shadow-sm dark:drop-shadow-md">{rgb.r}</div>
        </motion.div>

        {/* Green Card */}
        <motion.div 
          key={`g-${rgb.g}`}
          initial={{ opacity: 0.8, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-white/80 dark:bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-green-200 dark:border-green-500/30 shadow-[0_0_30px_rgba(34,197,94,0.1)] flex flex-col items-center justify-center relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 dark:from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <h2 className="text-green-600 dark:text-green-400 font-bold text-xl mb-2 tracking-widest">GREEN</h2>
          <div className="text-7xl font-black text-slate-800 dark:text-white tabular-nums drop-shadow-sm dark:drop-shadow-md">{rgb.g}</div>
        </motion.div>

        {/* Blue Card */}
        <motion.div 
          key={`b-${rgb.b}`}
          initial={{ opacity: 0.8, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-white/80 dark:bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-blue-200 dark:border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.1)] flex flex-col items-center justify-center relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 dark:from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <h2 className="text-blue-600 dark:text-blue-400 font-bold text-xl mb-2 tracking-widest">BLUE</h2>
          <div className="text-7xl font-black text-slate-800 dark:text-white tabular-nums drop-shadow-sm dark:drop-shadow-md">{rgb.b}</div>
        </motion.div>
      </div>
      
      <div className="mt-12 w-full h-32 bg-white/50 dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl p-6 relative z-10 flex items-center justify-center shadow-inner">
         <div 
           className="w-full h-full rounded-xl transition-colors duration-500 shadow-sm" 
           style={{ backgroundColor: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` }} 
         />
      </div>
      <p className="text-center text-slate-500 dark:text-slate-400 mt-4 text-sm tracking-wide">Warna yang terdeteksi oleh sensor</p>
    </div>
  );
}
