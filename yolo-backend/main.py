from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
from PIL import Image
import io
import cv2
import base64

app = FastAPI(title="YOLOv12 API")

# Setup CORS agar bisa dipanggil dari frontend Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model YOLO. Karena kita set di Dockerfile WORKDIR /app, best.pt ada di folder yang sama
model = YOLO('best.pt')

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
        # Baca gambar yang diupload ke dalam memori
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        
        # Jalankan inferensi YOLO
        results = model(image)
        
        # Ambil hasil dari gambar pertama (karena kita hanya memproses 1 gambar)
        result = results[0]
        
        # Jika tidak ada objek yang terdeteksi
        if len(result.boxes) == 0:
            return {
                "class": "Tidak Ada Deteksi", 
                "confidence": 0.0,
                "message": "Model tidak menemukan objek apapun pada gambar ini."
            }
            
        # Ambil indeks deteksi dengan confidence tertinggi
        best_box_idx = result.boxes.conf.argmax().item()
        best_conf = result.boxes.conf[best_box_idx].item()
        best_cls_idx = int(result.boxes.cls[best_box_idx].item())
        
        # Konversi index class menjadi nama string
        class_name = result.names[best_cls_idx]
        
        # Buat gambar dengan bounding box menggunakan fungsi plot() bawaan Ultralytics
        # plot() mengembalikan numpy array (BGR image)
        annotated_image = result.plot()
        
        # Encode gambar ke format JPEG
        is_success, buffer = cv2.imencode(".jpg", annotated_image)
        if not is_success:
            return {"error": "Gagal merender gambar dengan bounding box."}
            
        # Konversi ke Base64 agar bisa dikirim lewat JSON
        img_str = base64.b64encode(buffer).decode("utf-8")
        base64_image = f"data:image/jpeg;base64,{img_str}"
        
        return {
            "class": class_name,
            "confidence": best_conf,
            "image_base64": base64_image
        }
        
    except Exception as e:
        return {"error": str(e)}

@app.get("/")
def read_root():
    return {"status": "YOLO API is running"}
