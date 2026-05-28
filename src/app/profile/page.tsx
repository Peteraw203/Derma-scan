"use client";

import { useState } from "react";
import { User, LogOut, FileText, Loader2, X, Sparkles, Calendar, Clock, Activity } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import clsx from "clsx";

export default function ProfileScreen() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);

  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);

  const handleSaveName = async () => {
    if (!newName.trim() || !user) return;
    setIsSavingName(true);
    try {
      await updateProfile(user, { displayName: newName.trim() });
      await user.reload();
      window.location.reload();
    } catch (e) {
      console.error("Gagal memperbarui nama:", e);
      alert("Gagal memperbarui nama. Silakan coba lagi.");
    } finally {
      setIsSavingName(false);
      setIsEditingName(false);
    }
  };

  const fetchHistory = async () => {
    if (!user) return;
    setIsHistoryOpen(true);
    setIsFetchingHistory(true);
    try {
      const q = query(
        collection(db, "users", user.uid, "history"),
        orderBy("timestamp", "desc")
      );
      const querySnapshot = await getDocs(q);
      const list: any[] = [];
      querySnapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setHistoryList(list);
    } catch (e) {
      console.error("Gagal mengambil riwayat medis:", e);
    } finally {
      setIsFetchingHistory(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/");
    } catch (e) {
      console.error("Gagal logout:", e);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-[400px]">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-2" />
        <span className="text-sm text-slate-500 dark:text-slate-400 font-semibold">Memuat profil...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center w-full px-5 py-20">
        <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] shadow-lg text-center max-w-md w-full">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-850 flex items-center justify-center mb-5 text-slate-400">
            <User className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-850 dark:text-white mb-2 tracking-tight">Anda Belum Masuk</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 font-medium leading-relaxed">
            Masuk atau buat akun baru untuk menyimpan riwayat analisis kulit, berkonsultasi dengan dokter, dan mengaktifkan fitur pencarian klinik.
          </p>
          <Link 
            href="/login" 
            className="px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold rounded-2xl transition-all shadow-md shadow-emerald-500/10 cursor-pointer text-sm w-full"
          >
            Masuk Sekarang
          </Link>
        </div>
      </div>
    );
  }

  const userDisplayName = user.displayName || user.email?.split("@")[0] || "User";
  const userEmail = user.email || "user@example.com";
  const avatarLetter = (userDisplayName[0] || "U").toUpperCase();

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto md:py-10 relative">
      <div className="bg-health-green text-white px-5 py-10 md:rounded-[30px] rounded-b-[30px] flex flex-col items-center shadow-md md:mx-0">
        <div className="w-24 h-24 rounded-full bg-white/20 border-4 border-white flex items-center justify-center text-4xl font-bold mb-4 shadow-inner">
          {avatarLetter}
        </div>
        <h1 className="text-[22px] font-bold">{userDisplayName}</h1>
        <p className="text-white/80 text-sm">{userEmail}</p>
      </div>

      <div className="px-5 mt-6 flex flex-col gap-3">
        <div 
          onClick={() => {
            setNewName(userDisplayName);
            setIsEditingName(true);
          }}
          className="w-full rounded-[16px] bg-white dark:bg-white/5 border border-slate-100 dark:border-slate-800/50 shadow-sm p-4 flex items-center gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-health-green/10 flex items-center justify-center">
            <User className="w-5 h-5 text-health-green" />
          </div>
          <span className="font-semibold text-health-dark-blue flex-1 dark:text-slate-200">Edit Nama</span>
        </div>

        <div 
          onClick={fetchHistory}
          className="w-full rounded-[16px] bg-white dark:bg-white/5 border border-slate-100 dark:border-slate-800/50 shadow-sm p-4 flex items-center gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-health-green/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-health-green" />
          </div>
          <span className="font-semibold text-health-dark-blue flex-1 dark:text-slate-200">Medical History</span>
        </div>

        <button 
          onClick={handleLogout}
          className="w-full rounded-[16px] bg-white dark:bg-white/5 border border-slate-100 dark:border-slate-800/50 shadow-sm p-4 flex items-center gap-4 cursor-pointer hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors mt-4 text-left"
        >
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center flex-shrink-0">
            <LogOut className="w-5 h-5 text-red-500" />
          </div>
          <span className="font-semibold text-red-500 flex-1">Log Out</span>
        </button>
      </div>

      {/* Medical History Slide-over Drawer */}
      <AnimatePresence>
        {isHistoryOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHistoryOpen(false)}
              className="fixed inset-0 bg-slate-900 z-45 backdrop-blur-sm"
            />
            {/* Drawer */}
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed inset-y-0 right-0 w-full max-w-lg bg-slate-50 dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-50 flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">Riwayat Pemeriksaan</h2>
                    <p className="text-xs text-slate-400 dark:text-slate-500">Koleksi diagnosa log medis Anda</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsHistoryOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-850 hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {isFetchingHistory ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-3" />
                    <span className="text-sm text-slate-400 font-semibold">Mengambil data klinis...</span>
                  </div>
                ) : historyList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-300 mb-4">
                      <Activity className="w-8 h-8" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-350 mb-1">Belum Ada Riwayat</h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500 max-w-[250px] leading-relaxed">
                      Lakukan pemindaian lesi kulit AI atau gunakan sensor warna untuk merekam riwayat medis pertama Anda.
                    </p>
                  </div>
                ) : (
                  historyList.map((item) => {
                    const date = item.timestamp?.toDate ? item.timestamp.toDate() : (item.timestamp ? new Date(item.timestamp) : new Date());
                    const timeString = date.toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    });

                    if (item.type === "scanner") {
                      const isDanger = item.label.includes("Melanoma") || item.label.includes("Carcinoma");
                      return (
                        <div key={item.id} className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                          <div className={clsx(
                            "absolute left-0 top-0 bottom-0 w-1.5",
                            isDanger ? "bg-red-500" : "bg-emerald-500"
                          )} />
                          
                          <div className="flex justify-between items-start mb-3">
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> {timeString}
                            </span>
                            <span className={clsx(
                              "text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider",
                              isDanger ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500"
                            )}>
                              {isDanger ? "Mencurigakan" : "Lunak / Benign"}
                            </span>
                          </div>

                          <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mb-1">AI Vision Scanner (YOLOv12)</h4>
                          <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 font-medium">
                            <p>Prediksi Lesi: <span className="font-extrabold text-slate-700 dark:text-slate-350">{item.label}</span></p>
                            <p>Confidence Score: <span className="font-extrabold text-slate-700 dark:text-slate-350">{item.confidence}%</span></p>
                          </div>

                          <Link 
                            href={`/chat-ai?source=scanner&label=${encodeURIComponent(item.label)}&confidence=${item.confidence}`}
                            className="mt-4 w-full bg-slate-50 dark:bg-slate-800 hover:bg-emerald-500 dark:hover:bg-emerald-500 hover:text-white dark:hover:text-white border border-slate-200 dark:border-slate-750 text-slate-700 dark:text-slate-350 font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all text-xs"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-500 group-hover:text-amber-300 transition-colors animate-pulse" /> Konsultasikan ke AI
                          </Link>
                        </div>
                      );
                    } else if (item.type === "iot") {
                      const isDanger = item.status === "danger";
                      const isWarning = item.status === "warning";
                      return (
                        <div key={item.id} className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                          <div className={clsx(
                            "absolute left-0 top-0 bottom-0 w-1.5",
                            isDanger ? "bg-red-500" : isWarning ? "bg-amber-500" : "bg-emerald-500"
                          )} />

                          <div className="flex justify-between items-start mb-3">
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> {timeString}
                            </span>
                            <span className={clsx(
                              "text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider",
                              isDanger ? "bg-red-500/10 text-red-500" : isWarning ? "bg-amber-500/10 text-amber-500" : "bg-emerald-500/10 text-emerald-500"
                            )}>
                              {item.status === "danger" ? "Mencurigakan" : item.status === "warning" ? "Peringatan" : "Aman"}
                            </span>
                          </div>

                          <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mb-2">Sensor Warna (TCS34725)</h4>
                          <div className="text-xs text-slate-500 dark:text-slate-400 space-y-2 font-medium mb-3">
                            <p>Perbedaan Warna: <span className="font-extrabold text-slate-700 dark:text-slate-350">{item.distance} Delta-E</span></p>
                            <div className="flex items-center gap-3 mt-1">
                              <div className="flex items-center gap-1">
                                <div className="w-4 h-4 rounded-full border border-slate-200 dark:border-white/10 shadow-sm" style={{ backgroundColor: item.baseline }} />
                                <span className="text-[10px] text-slate-400">Baseline</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <div className="w-4 h-4 rounded-full border border-slate-200 dark:border-white/10 shadow-sm" style={{ backgroundColor: item.target }} />
                                <span className="text-[10px] text-slate-400">Target</span>
                              </div>
                            </div>
                          </div>

                          <Link 
                            href={`/chat-ai?source=iot&distance=${item.distance}&status=${item.status}&baseline=${encodeURIComponent(item.baseline)}&target=${encodeURIComponent(item.target)}`}
                            className="w-full bg-slate-50 dark:bg-slate-800 hover:bg-emerald-500 dark:hover:bg-emerald-500 hover:text-white dark:hover:text-white border border-slate-200 dark:border-slate-750 text-slate-700 dark:text-slate-350 font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all text-xs"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-500 group-hover:text-amber-300 transition-colors animate-pulse" /> Konsultasikan ke AI
                          </Link>
                        </div>
                      );
                    }
                    return null;
                  })
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Edit Name Modal */}
      <AnimatePresence>
        {isEditingName && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-[24px] p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-black text-slate-800 dark:text-white mb-2">Edit Nama</h3>
              <p className="text-xs text-slate-400 mb-4">Ubah nama tampilan akun Anda.</p>
              
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nama Lengkap"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 mb-5 text-slate-800 dark:text-white"
              />
              
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setIsEditingName(false)}
                  disabled={isSavingName}
                  className="px-4 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveName}
                  disabled={isSavingName || !newName.trim()}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors flex items-center gap-2 shadow-md shadow-emerald-500/10"
                >
                  {isSavingName ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Menyimpan...
                    </>
                  ) : "Simpan"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
