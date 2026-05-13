"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Image as ImageIcon, UploadCloud, RefreshCw, Zap, ShieldAlert, CheckCircle2, Activity, Camera, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

export default function ScannerScreen() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<{ label: string; confidence: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    let file;
    if ('dataTransfer' in e) {
      file = e.dataTransfer.files?.[0];
    } else {
      file = (e.target as HTMLInputElement).files?.[0];
    }

    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(imageUrl);
      setResult(null);
      setIsCameraOpen(false);
    }
  };

  const startCamera = async () => {
    try {
      setIsCameraOpen(true);
      setSelectedImage(null);
      setResult(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan.");
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext("2d");
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageUrl = canvas.toDataURL("image/jpeg");
        setSelectedImage(imageUrl);
        stopCamera();
      }
    }
  };

  const runModel = () => {
    if (!selectedImage) return;
    
    setIsScanning(true);
    
    // Simulating YOLOv12 Inference delay
    setTimeout(() => {
      setIsScanning(false);
      setResult({ label: "Benign (Non-Cancerous)", confidence: 98.4 }); 
    }, 2500);
  };

  return (
    <div className="flex flex-col w-full min-h-screen p-6 md:p-10 relative overflow-hidden pb-20 transition-colors duration-300">
      {/* Decorative Background */}
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <div className="flex items-center gap-4 mb-8 relative z-10">
        <Link href="/" className="w-10 h-10 rounded-xl bg-white dark:bg-white/10 backdrop-blur-md border border-slate-200 dark:border-white/20 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-white/20 transition-all shadow-sm">
          <ArrowLeft className="w-5 h-5 text-slate-700 dark:text-white" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">AI Lesion <span className="text-emerald-500 dark:text-emerald-400">Scanner</span></h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">YOLOv12 Medical Vision Model</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-8 w-full max-max-7xl mx-auto relative z-10">
        
        {/* Left Column: Drag & Drop / Camera Area */}
        <div className="flex-1 flex flex-col">
          <div 
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleImageUpload}
            className={clsx(
              "w-full flex-1 min-h-[400px] lg:min-h-[500px] bg-white/80 dark:bg-white/5 backdrop-blur-xl border-2 border-dashed rounded-[32px] flex flex-col items-center justify-center overflow-hidden relative shadow-lg dark:shadow-2xl transition-all group",
              isDragging ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10" : "border-slate-300 dark:border-white/20"
            )}
          >
            {isCameraOpen ? (
              <div className="absolute inset-0 z-20 flex flex-col">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-6 px-6">
                  <button 
                    onClick={stopCamera}
                    className="w-16 h-16 rounded-full bg-red-500/80 backdrop-blur-md flex items-center justify-center text-white shadow-xl hover:bg-red-600 transition-all"
                  >
                    <X className="w-8 h-8" />
                  </button>
                  <button 
                    onClick={capturePhoto}
                    className="w-20 h-20 rounded-full bg-white dark:bg-emerald-500 flex items-center justify-center text-emerald-600 dark:text-white shadow-2xl border-4 border-white/20 hover:scale-110 active:scale-95 transition-all"
                  >
                    <div className="w-16 h-16 rounded-full border-2 border-slate-200 dark:border-emerald-300 flex items-center justify-center">
                      <Camera className="w-8 h-8" />
                    </div>
                  </button>
                </div>
              </div>
            ) : selectedImage ? (
              <>
                <Image src={selectedImage} alt="Selected Lesion" fill className="object-contain p-2" />
                {isScanning && (
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center z-10"
                  >
                    <div className="relative">
                      <div className="w-24 h-24 border-4 border-emerald-500/30 rounded-full border-t-emerald-500 animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Zap className="w-8 h-8 text-emerald-600 dark:text-emerald-400 animate-pulse" />
                      </div>
                    </div>
                    <p className="text-emerald-600 dark:text-emerald-400 font-bold mt-6 animate-pulse tracking-widest uppercase text-sm">Running YOLOv12...</p>
                  </motion.div>
                )}
                <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-3">
                   <button 
                     onClick={() => { setSelectedImage(null); setResult(null); }}
                     className="bg-slate-900/50 dark:bg-black/50 backdrop-blur-md px-4 py-2 rounded-full text-xs font-medium border border-white/20 dark:border-white/10 text-white shadow-lg hover:bg-red-500/50 transition-colors"
                   >
                      Hapus Gambar
                   </button>
                   <button 
                     onClick={() => fileInputRef.current?.click()}
                     className="bg-slate-900/50 dark:bg-black/50 backdrop-blur-md px-4 py-2 rounded-full text-xs font-medium border border-white/20 dark:border-white/10 text-white shadow-lg hover:bg-emerald-500/50 transition-colors"
                   >
                      Ganti Gambar
                   </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center text-slate-500 dark:text-slate-400 p-6 text-center">
                <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-6">
                  <UploadCloud className="w-10 h-10 text-emerald-500 dark:text-emerald-400" />
                </div>
                <p className="text-xl font-bold text-slate-800 dark:text-white mb-2">Pilih Foto Lesi Kulit</p>
                <p className="text-sm opacity-70 max-w-xs text-slate-600 dark:text-slate-400 mb-8">Ambil foto langsung dari kamera atau unggah file gambar (JPG/PNG).</p>
                
                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                  <button 
                    onClick={startCamera}
                    className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-emerald-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Camera className="w-5 h-5" />
                    Buka Kamera
                  </button>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-sm shadow-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <UploadCloud className="w-5 h-5" />
                    Unggah File
                  </button>
                </div>
                <p className="mt-6 text-[11px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-semibold italic">atau Drag & Drop di sini</p>
              </div>
            )}
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
            />
          </div>
        </div>

        {/* Right Column: Result Card & Controls */}
        <div className="w-full lg:w-[400px] flex flex-col gap-6">
          
          {/* Analysis Card */}
          <div className="w-full bg-white dark:bg-white/10 backdrop-blur-xl rounded-[32px] p-8 border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-2xl relative overflow-hidden min-h-[300px] flex flex-col transition-colors duration-300">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-blue-500" />
            
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-300 mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
              Hasil Analisis YOLOv12
            </h3>

            <div className="flex-1 flex flex-col justify-center">
              <AnimatePresence mode="wait">
                {!result ? (
                  <motion.div 
                    key="empty"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex flex-col items-center text-center text-slate-400 dark:text-slate-500"
                  >
                    <ImageIcon className="w-12 h-12 mb-4 opacity-40 dark:opacity-20 text-slate-400 dark:text-white" />
                    <p className="text-sm">Silakan pilih foto dan klik "Mulai Pemindaian" untuk melihat hasil prediksi AI.</p>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="result"
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center text-center"
                  >
                    {result.label.includes("Benign") ? (
                      <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                      </div>
                    ) : (
                      <div className="w-20 h-20 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                        <ShieldAlert className="w-10 h-10 text-red-600 dark:text-red-400" />
                      </div>
                    )}
                    <h4 className={clsx(
                      "text-2xl font-black mb-2",
                      result.label.includes("Benign") ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                    )}>
                      {result.label}
                    </h4>
                    
                    <div className="w-full mt-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-700">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Confidence Score</span>
                        <span className="text-lg font-bold text-slate-800 dark:text-white">{result.confidence}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-900 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }} animate={{ width: `${result.confidence}%` }} transition={{ duration: 1, ease: "easeOut" }}
                          className={clsx(
                            "h-full rounded-full",
                            result.label.includes("Benign") ? "bg-emerald-500" : "bg-red-500"
                          )} 
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Action Button */}
          <button 
            onClick={runModel}
            disabled={!selectedImage || isScanning || isCameraOpen}
            className="w-full bg-gradient-to-r from-emerald-500 to-emerald-400 text-white font-bold py-5 rounded-[24px] shadow-[0_10px_30px_rgba(16,185,129,0.3)] flex items-center justify-center gap-3 disabled:opacity-50 disabled:shadow-none disabled:from-slate-300 disabled:to-slate-200 dark:disabled:from-slate-700 dark:disabled:to-slate-600 disabled:text-slate-500 dark:disabled:text-slate-400 hover:scale-[1.02] active:scale-[0.98] transition-all text-lg"
          >
            {isScanning ? (
              <>
                <RefreshCw className="w-6 h-6 animate-spin" />
                Menganalisis...
              </>
            ) : (
              <>
                <Zap className="w-6 h-6" />
                Mulai Pemindaian AI
              </>
            )}
          </button>
        </div>
      </div>
      {/* Hidden canvas for capturing frames */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
