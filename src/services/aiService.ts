import { GoogleGenerativeAI } from "@google/genai";
import { Flight } from "../../types";
import { MILESTONES } from "../../constants";

// CONFIGURACIÓN PARA VITE + GITHUB ACTIONS
// Esta línea conecta con la llave secreta que pusiste en GitHub
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export async function analyzeFlightOperation(flight: Flight): Promise<{ analysis: string; isPositive: boolean }> {
  // Inicializamos el modelo (Gemini 1.5 Flash es el más estable para web)
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
  // Preparamos los datos del vuelo para que la IA los entienda
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
    Eres un experto en operaciones aeroportuarias y gestión de turn-around.
    Analiza la operación del vuelo ${flight.number} (${flight.registration}) con los siguientes datos:
    ${JSON.stringify(dataForAI, null, 2)}

    Instrucciones:
    1. Compara los tiempos teóricos vs reales de cada hito.
    2. Identifica quiebres de procesos.
    3. Determina si el análisis general es POSITIVO o NEGATIVO.
    4. El tono debe ser profesional y directo.
    5. Responde ÚNICAMENTE con un objeto JSON que tenga estos dos campos:
       "analysis": (un string con formato markdown)
       "isPositive": (un booleano true o false)
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Limpieza de seguridad por si la IA devuelve bloques de código markdown
    const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return {
      analysis: "El análisis de IA no está disponible en este momento. Verifica la configuración de la API Key.",
      isPositive: false
    };
  }
}
