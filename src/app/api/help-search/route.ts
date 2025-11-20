// src/app/api/help-search/route.ts

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface SearchResult {
  sectionTitle: string;
  content: string;
}

// Clave de API para servidor (la que creaste sin restricciones)
const API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDI1IzmXIwZr8Byu8uiTgbu6nLzSGsr_OQ';

// ÚLTIMO INTENTO: Probando con el modelo base gemini-1.0-pro
const MODEL_NAME = 'gemini-1.0-pro';

const genAI = new GoogleGenerativeAI(API_KEY);

export async function POST(request: Request) {
  try {
    const { query } = await request.json();
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ message: 'Consulta inválida' }, { status: 400 });
    }

    const manualPath = path.join(process.cwd(), 'docs', 'MANUAL.md');
    const manualContent = fs.readFileSync(manualPath, 'utf-8');

    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const prompt = `
      Eres el "Asistente de Ayuda" de Contacloud, una plataforma de contabilidad y remuneraciones. Tu única fuente de conocimiento es el manual de usuario que te proporciono a continuación. 
      
      **Instrucciones estrictas:**
      1. Responde a la pregunta del usuario basándote EXCLUSIVAMENTE en el contenido del siguiente manual.
      2. Si la respuesta no se encuentra en el manual, responde: "Lo siento, no he encontrado información sobre eso en el manual. Intenta reformular tu pregunta".
      3. No inventes información ni respondas usando conocimiento externo.
      4. Sé breve, amigable y directo al grano.
      5. Formatea tu respuesta en parrafos para que sea fácil de leer.

      --- MANUAL DE USUARIO ---
      ${manualContent}
      --- FIN DEL MANUAL ---

      **Pregunta del usuario:** "${query}"

      **Tu respuesta:**
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiText = response.text();

    const searchResult: SearchResult[] = [{
      sectionTitle: "Respuesta del Asistente",
      content: aiText,
    }];

    return NextResponse.json(searchResult);

  } catch (error) {
    console.error('[API HELP-SEARCH ERROR]', error);
    const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido';
    return NextResponse.json({ message: `Error al contactar la IA: ${errorMessage}` }, { status: 500 });
  }
}
