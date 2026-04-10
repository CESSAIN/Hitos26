import { GoogleGenerativeAI } from "@google/genai";
import { Flight } from "../../types";
import { MILESTONES } from "../../constants";

// Capturamos la llave desde las variables de entorno de Vite
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export async function analyzeFlightOperation(flight: Flight): Promise<{ analysis: string; isPositive: boolean }> {
  // Verificación de seguridad: si no hay llave, avisamos en el análisis en lugar de romper la app
  if (!apiKey) {
    return {
      analysis: "Configuración incompleta: No se detectó la VITE_GEMINI_API_KEY. Verifica los Secrets de GitHub.",
      isPositive: false
    };
  }

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
  const dataForAI = {
    flightNumber: flight.number,
    registration: flight.registration,
    origin: flight.origin,
    destination: flight.destination,
    milestones: flight.milestones
  };

  const prompt = `
    Eres un experto en operaciones aeroportuarias. 
    Analiza este vuelo: ${JSON.stringify(dataForAI, null, 2)}
    
    Responde ÚNICAMENTE en formato JSON con estos campos:
    {
      "analysis": "string con formato markdown",
      "isPositive": booleano
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Limpiamos posibles etiquetas de código markdown que devuelva la IA
    const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Error en el análisis de IA:", error);
    return {
      analysis: "No se pudo generar el análisis en este momento. Intenta de nuevo más tarde.",
      isPositive: false
    };
  }
}
