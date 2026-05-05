import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "dummy_key");

const systemPrompt = `You are an AI assistant specialized in oral health and oral cancer consultation. 
Your goal is to provide helpful, evidence-based information to users. 
Focus strictly on:
1. Explaining what oral cancer is and its common symptoms.
2. Discussing risk factors (like smoking, alcohol, HPV).
3. Providing advice on oral hygiene and early screening.
4. Interpreting potential signs like sores that don't heal, white or red patches.

IMPORTANT:
- If the user mentions suspicious symptoms, ALWAYS strongly recommend they consult a professional dentist or oncologist immediately.
- Do not provide a final medical diagnosis.
- Be empathetic and informative.
- Keep responses concise and easy to understand.`;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // Check if API key is set
    if (!process.env.GEMINI_API_KEY) {
       return NextResponse.json({ 
         response: "GEMINI_API_KEY is not set in the environment variables. Please add it to your .env.local file." 
       });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    // Convert previous messages to Gemini format
    const history = [
      { role: "user", parts: [{ text: systemPrompt }] },
      { role: "model", parts: [{ text: "Understood. I'm ready to assist with oral health and cancer consultation." }] }
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
      { error: "Failed to communicate with AI.", details: error.message },
      { status: 500 }
    );
  }
}
