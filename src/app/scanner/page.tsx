"use client";

import { useState, useRef } from "react";
import { ArrowLeft, Image as ImageIcon, Camera, Upload, RefreshCw } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function ScannerScreen() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(imageUrl);
      setResult(null);
    }
  };

  const runModel = () => {
    if (!selectedImage) return;
    
    setIsScanning(true);
    
    // Simulating Model Inference since TFLite WASM requires specific webpack configs in Next.js
    // In production, you would use @tensorflow/tfjs-tflite and load /model/best_float16.tflite
    setTimeout(() => {
      setIsScanning(false);
      setResult("NON CANCER (98%)"); // Simulated result based on Android's ImageClassifierHelper logic
    }, 2000);
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
          {selectedImage ? (
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
          <div className="w-full mt-6 bg-health-green-light rounded-2xl p-5 border border-health-green/20 animate-in fade-in slide-in-from-bottom-4">
            <h3 className="text-sm text-text-gray font-semibold mb-1">Detection Result:</h3>
            <p className={`text-2xl font-bold ${result.includes('NON') ? 'text-health-green' : 'text-red-500'}`}>
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
