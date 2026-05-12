# Gunakan base image resmi dari Ultralytics (versi CPU agar ringan dan cepat)
# Base image ini SUDAH berisi PyTorch, OpenCV, dan Ultralytics (YOLO) yang terinstall sempurna
FROM ultralytics/ultralytics:latest-cpu

WORKDIR /app

# Install FastAPI dan Uvicorn untuk backend API-nya
RUN pip install --no-cache-dir fastapi uvicorn python-multipart

# Copy semua file ke dalam container (termasuk main.py dan best.pt)
COPY . .

EXPOSE 8080

# Jalankan Uvicorn server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
