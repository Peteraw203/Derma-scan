"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Mail, Lock, User, ArrowRight, ShieldCheck, Sparkles, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import clsx from "clsx";

export default function LoginScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isSignUp) {
        if (!name.trim()) {
          throw new Error("Nama lengkap wajib diisi.");
        }
        // Sign Up
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, {
          displayName: name.trim()
        });
      } else {
        // Sign In
        await signInWithEmailAndPassword(auth, email, password);
      }
      
      // Redirect to homepage
      router.push("/");
    } catch (err: any) {
      console.error(err);
      let errMsg = "Terjadi kesalahan. Silakan coba lagi.";
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
        errMsg = "Email atau password yang Anda masukkan salah.";
      } else if (err.code === "auth/email-already-in-use") {
        errMsg = "Alamat email ini sudah terdaftar.";
      } else if (err.code === "auth/weak-password") {
        errMsg = "Password terlalu lemah (minimal 6 karakter).";
      } else if (err.code === "auth/invalid-email") {
        errMsg = "Format alamat email tidak valid.";
      } else if (err.message) {
        errMsg = err.message;
      }
      setError(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen p-5 relative overflow-hidden transition-colors duration-300">
      {/* Decorative Background */}
      <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[500px] h-[500px] bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Back to Home Button */}
      <Link 
        href="/" 
        className="absolute top-6 left-6 px-4 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/80 rounded-xl shadow-sm z-30"
      >
        ← Kembali ke Beranda
      </Link>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-[32px] p-8 shadow-2xl relative z-10"
      >
        {/* Logo/Icon */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-4">
            <ShieldCheck className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-1.5">
            Derma-Scan AI
            <Sparkles className="w-5 h-5 text-emerald-500 animate-pulse" />
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">Sistem Pemantau Kesehatan Kulit Terintegrasi</p>
        </div>

        {/* Tab switch */}
        <div className="bg-slate-100 dark:bg-slate-850 p-1.5 rounded-2xl flex items-center border border-slate-200/55 dark:border-slate-800/60 relative select-none mb-6">
          <div 
            className="absolute top-1.5 bottom-1.5 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200/30 dark:border-slate-700/50 transition-all duration-300 ease-out"
            style={{
              left: isSignUp ? 'calc(50% + 2px)' : '6px',
              width: 'calc(50% - 8px)'
            }}
          />
          <button 
            type="button"
            onClick={() => { setIsSignUp(false); setError(null); }}
            className={clsx(
              "relative z-10 flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-colors duration-300 cursor-pointer",
              !isSignUp ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"
            )}
          >
            Masuk (Sign In)
          </button>
          <button 
            type="button"
            onClick={() => { setIsSignUp(true); setError(null); }}
            className={clsx(
              "relative z-10 flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-colors duration-300 cursor-pointer",
              isSignUp ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"
            )}
          >
            Daftar (Sign Up)
          </button>
        </div>

        {/* Alert Error */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-5 overflow-hidden"
            >
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl p-4 flex gap-3 text-red-700 dark:text-red-400">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span className="text-xs font-bold leading-relaxed">{error}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleAuth} className="space-y-4">
          <AnimatePresence mode="popLayout">
            {isSignUp && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="space-y-1.5"
              >
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block pl-2">Nama Lengkap</label>
                <div className="relative flex items-center bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-2xl focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
                  <User className="w-4 h-4 text-slate-400 absolute left-4" />
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Masukkan nama lengkap Anda"
                    required={isSignUp}
                    className="w-full bg-transparent pl-11 pr-4 py-3.5 text-sm text-slate-800 dark:text-slate-200 outline-none placeholder-slate-400 dark:placeholder-slate-500"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block pl-2">Alamat Email</label>
            <div className="relative flex items-center bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-2xl focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
              <Mail className="w-4 h-4 text-slate-400 absolute left-4" />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                required
                className="w-full bg-transparent pl-11 pr-4 py-3.5 text-sm text-slate-800 dark:text-slate-200 outline-none placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block pl-2">Kata Sandi (Password)</label>
            <div className="relative flex items-center bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-2xl focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
              <Lock className="w-4 h-4 text-slate-400 absolute left-4" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full bg-transparent pl-11 pr-4 py-3.5 text-sm text-slate-800 dark:text-slate-200 outline-none placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-500/10 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all text-sm flex items-center justify-center gap-2 cursor-pointer mt-6 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Memproses...
              </span>
            ) : (
              <>
                {isSignUp ? "Buat Akun Baru" : "Masuk ke Akun"}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
