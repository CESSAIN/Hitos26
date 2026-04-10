import { GoogleGenerativeAI } from "@google/genai";
import { Flight } from "../../types";
import { MILESTONES } from "../../constants";

// CONFIGURACIÓN DE SEGURIDAD
// No ponemos la llave aquí directamente; la traemos de las variables de entorno
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export async function analyzeFlightOperation(flight: Flight): Promise<{ analysis: string; isPositive: boolean }> {
  // Inicializamos el modelo (Gemini 1.5 Flash es ideal por su velocidad)
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
    Eres un experto en operaciones aeroportuarias. Analiza el vuelo ${flight.number} (${flight.registration}).
    Datos de operación: ${JSON.stringify(dataForAI, null, 2)}

    Tareas:
    1. Compara tiempos teóricos vs reales.
    2. Identifica demoras o procesos eficientes.
    3. Responde ÚNICAMENTE con un objeto JSON que tenga:
       - "analysis": un texto en formato markdown con el resumen.
       - "isPositive": un booleano (true si la operación fue buena, false si hubo problemas graves).
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Limpiamos la respuesta por si la IA devuelve bloques de código markdown
    const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return {
      analysis: "Análisis no disponible en este momento. Revisa la configuración de la API Key.",
      isPositive: false
    };
  }
}
