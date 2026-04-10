import { GoogleGenerativeAI } from "@google/genai";
import { Flight } from "../../types";
import { MILESTONES } from "../../constants";

// Conexión con la llave secreta de GitHub
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export async function analyzeFlightOperation(flight: Flight): Promise<{ analysis: string; isPositive: boolean }> {
  // Inicializamos el modelo estable
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
  const dataForAI = {
    flightNumber: flight.number,
    registration: flight.registration,
    type: flight.type,
    origin: flight.origin,
    destination: flight.destination,
    tatTeorico: flight.tatTeorico,
    etdReal: flight.etdReal,
    inBlock: flight.inBlock || flight.milestones['IN'],
    pushBack: flight.milestones['PUSH BACK'],
    milestones: Object.entries(flight.milestones).map(([key, value]) => {
      const mDef = MILESTONES.find(m => m.key === key);
      return {
        key,
        label: mDef?.label || key,
        value,
        isTheoretical: mDef?.isTheoretical || false
      };
    })
  };

  const prompt = `
    Eres un experto en operaciones aeroportuarias. Analiza el vuelo ${flight.number}.
    Datos: ${JSON.stringify(dataForAI)}
    
    Instrucciones:
    1. Compara teóricos vs reales.
    2. Determina si el análisis es POSITIVO o NEGATIVO.
    3. Responde ÚNICAMENTE con un JSON: {"analysis": "markdown string", "isPositive": boolean}.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Limpieza de formato JSON
    const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return {
      analysis: "El análisis de IA no está disponible. Revisa la consola para más detalles.",
      isPositive: false
    };
  }
}
