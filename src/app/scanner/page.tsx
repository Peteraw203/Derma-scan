"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Image as ImageIcon, Camera, Upload, RefreshCw } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function ScannerScreen() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State untuk live camera
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isCameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isCameraActive]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      streamRef.current = stream;
      setIsCameraActive(true);
      setSelectedImage(null);
      setSelectedFile(null);
      setResult(null);
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Tidak dapat mengakses kamera. Pastikan memberikan izin kamera di browser.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "camera_capture.jpg", { type: "image/jpeg" });
            const imageUrl = URL.createObjectURL(blob);
            setSelectedImage(imageUrl);
            setSelectedFile(file);
            setResult(null);
            stopCamera();
          }
        }, "image/jpeg", 0.9);
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(imageUrl);
      setSelectedFile(file);
      setResult(null);
      stopCamera();
    }
  };

  const runModel = async () => {
    if (!selectedFile) return;

    setIsScanning(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const apiUrl = process.env.NEXT_PUBLIC_YOLO_API_URL || "https://yolo-scanner-api-693893513592.asia-southeast2.run.app/predict";

      const response = await fetch(apiUrl, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Gagal menghubungi server (Status: ${response.status})`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Jika backend mengirimkan gambar dengan bounding box, tampilkan!
      if (data.image_base64) {
        setSelectedImage(data.image_base64);
      }

      const confidenceScore = data.confidence ? Math.round(data.confidence * 100) : 0;

      let className = data.class;
      // Memetakan angka ke nama kelas yang sebenarnya (sesuai Roboflow)
      if (String(className) === "0") {
        className = "Basal Cell Carcinoma";
      } else if (String(className) === "1") {
        className = "Melanoma";
      } else if (String(className) === "2") {
        className = "Squamous Cell Carcinoma";
      } else if (typeof className === 'string') {
        // Jika API mengembalikan string langsung (misal: "Basal_cell_carcinoma")
        className = className.replace(/_/g, ' ');
      }

      setResult(`${className} (${confidenceScore}%)`);

    } catch (error: any) {
      console.error("Scan error:", error);
      setResult(`ERROR: ${error.message}`);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto px-6 py-6 md:py-10">
      {/* Header */}
      <div className="flex items-center mb-8">
        <Link href="/" className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-3 hover:bg-gray-200 transition-colors">
          <ArrowLeft className="w-5 h-5 text-health-dark-blue" />
        </Link>
        <h1 className="text-lg font-bold text-health-dark-blue">Oral Cancer Scanner</h1>
      </div>

      <div className="flex-1 px-5 py-8 flex flex-col items-center w-full max-w-2xl mx-auto">
        {/* Image Preview Area */}
        <div className="w-full aspect-square md:aspect-video bg-card-white border-2 border-dashed border-gray-300 rounded-[24px] flex flex-col items-center justify-center overflow-hidden relative shadow-sm">
          {isCameraActive ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-6 left-0 w-full flex justify-center items-center gap-4">
                <button
                  onClick={stopCamera}
                  className="bg-red-500 text-white font-bold py-2 px-6 rounded-full shadow-lg"
                >
                  Batal
                </button>
                <button
                  onClick={capturePhoto}
                  className="bg-white text-health-dark-blue p-4 rounded-full shadow-lg border-4 border-gray-200 flex items-center justify-center"
                >
                  <Camera className="w-6 h-6" />
                </button>
              </div>
            </>
          ) : selectedImage ? (
            <>
              <Image src={selectedImage} alt="Selected" fill className="object-cover" />
              {isScanning && (
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center backdrop-blur-sm z-10">
                  <RefreshCw className="w-10 h-10 text-health-green animate-spin mb-3" />
                  <p className="text-white font-semibold animate-pulse">Running YOLO Inference...</p>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center text-gray-400">
              <ImageIcon className="w-16 h-16 mb-4 opacity-50" />
              <p className="font-medium">Upload or capture an image</p>
              <p className="text-xs mt-1 opacity-70">Focus on the oral cavity area</p>
            </div>
          )}
        </div>

        {/* Results Area */}
        {result && !isScanning && (
          <div className={`w-full mt-6 rounded-2xl p-5 border animate-in fade-in slide-in-from-bottom-4 ${result.includes('Tidak Ada') ? 'bg-health-green-light border-health-green/20' : 'bg-red-50 border-red-200'}`}>
            <h3 className="text-sm text-text-gray font-semibold mb-1">Detection Result:</h3>
            <p className={`text-2xl font-bold ${result.includes('Tidak Ada') ? 'text-health-green' : 'text-red-600'}`}>
              {result}
            </p>
            <p className="text-xs text-text-gray mt-2 leading-relaxed">
              * Note: This is an AI-assisted analysis and not a substitute for professional medical diagnosis.
            </p>
          </div>
        )}

        <div className="flex-1" />

        {/* Controls */}
        <div className="w-full flex flex-col gap-3 mt-8">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageUpload}
          />

          <div className="flex gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 bg-card-white text-health-dark-blue font-bold py-3.5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
            >
              <Upload className="w-5 h-5" />
              Upload Image
            </button>
            <button
              onClick={startCamera}
              className="flex-1 bg-card-white text-health-dark-blue font-bold py-3.5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
            >
              <Camera className="w-5 h-5" />
              Camera
            </button>
          </div>

          <button
            onClick={runModel}
            disabled={!selectedImage || isScanning}
            className="w-full bg-health-green text-white font-bold py-4 rounded-2xl shadow-lg shadow-health-green/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none hover:bg-health-green/90 transition-all"
          >
            {isScanning ? 'Analyzing...' : 'Scan Now'}
          </button>
        </div>
      </div>
    </div>
  );
}
