import { GoogleGenerativeAI } from "@google/generative-ai"; // Corregida la importación
import { Flight } from "../../types";
import { MILESTONES } from "../../constants";

// CONFIGURACIÓN CORRECTA PARA VITE + GITHUB ACTIONS
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export async function analyzeFlightOperation(flight: Flight): Promise<{ analysis: string; isPositive: boolean }> {
  // Usamos el modelo estable para evitar errores de preview
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
  const milestones = MILESTONES.filter(m => !m.isTheoretical);
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

    Instrucciones específicas para el análisis:
    1. Compara los tiempos teóricos vs reales de cada hito.
    2. Identifica quiebres de procesos (donde el real excedió significativamente al teórico).
    3. Calcula el tiempo total utilizado entre el IN (${dataForAI.inBlock}) y el PUSH BACK (${dataForAI.pushBack}).
    4. Compara ese tiempo total con el TAT teórico (${flight.tatTeorico}).
    5. Revisa si hubo "tiempos vacíos" (gaps) entre hitos donde no se realizó ninguna tarea.
    6. REGLA ESPECIAL: El proceso de limpieza puede empezar hasta 2 minutos tarde sin ser considerado un quiebre si logra terminar a tiempo comparado con su teórico final.
    7. Determina si el análisis general es POSITIVO o NEGATIVO.
    8. La respuesta debe ser UNICAMENTE un JSON con dos campos: "analysis" (string en markdown) y "isPositive" (boolean).
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Limpiamos el texto por si la IA devuelve markdown (```json ... ```)
    const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return {
      analysis: "Análisis no disponible: revisa la conexión o la configuración de la API Key.",
      isPositive: false
    };
  }
}
