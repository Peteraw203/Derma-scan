import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "dummy_key");

const systemPrompt = `Anda adalah asisten AI spesialis kesehatan kulit (Derma-Scan). 
Tugas utama Anda adalah memberikan informasi edukatif mengenai masalah kulit seperti jerawat, kanker kulit, dan cara pencegahannya.

Panduan respons:
1. Jelaskan mengenai jerawat (penyebab, jenis, perawatan dasar).
2. Jelaskan mengenai kanker kulit (gejala awal, tanda-tanda peringatan seperti metode ABCDE pada tahi lalat).
3. Berikan saran pencegahan (penggunaan sunscreen, menjaga kebersihan kulit, pola hidup sehat).
4. Gunakan bahasa yang ramah, profesional, dan mudah dimengerti.

PENTING (DISCLAIMER):
- Anda harus selalu menyatakan bahwa informasi ini hanya bersifat referensi/edukasi dan BUKAN pengganti saran medis profesional.
- Jika pengguna mengeluhkan gejala yang mencurigakan atau mengkhawatirkan, WAJIB arahkan mereka untuk segera melakukan rujukan ke dokter spesialis kulit (Dermatologis).
- Jangan memberikan diagnosis pasti.

Tanggapi dalam Bahasa Indonesia jika pengguna bertanya dalam Bahasa Indonesia.`;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // Check if API key is set
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "your_api_key_here") {
       return NextResponse.json({ 
         response: "Silakan masukkan Google AI Studio API Key Anda di file .env.local terlebih dahulu." 
       });
    }

    // Using gemini-1.5-flash for faster response
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    // Convert previous messages to Gemini format
    const history = [
      { role: "user", parts: [{ text: systemPrompt }] },
      { role: "model", parts: [{ text: "Siap, saya mengerti. Saya akan membantu memberikan informasi edukatif mengenai kesehatan kulit dengan menyertakan disclaimer medis." }] }
    ];

    for (let i = 0; i < messages.length - 1; i++) {
        history.push({
            role: messages[i].role === 'user' ? 'user' : 'model',
            parts: [{ text: messages[i].content }]
        });
    }

    const chat = model.startChat({ history });
    const userMessage = messages[messages.length - 1].content;
    
    const result = await chat.sendMessage(userMessage);
    const responseText = result.response.text();

    return NextResponse.json({ response: responseText });
  } catch (error: any) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      { error: "Gagal berkomunikasi dengan AI.", details: error.message },
      { status: 500 }
    );
  }
}
