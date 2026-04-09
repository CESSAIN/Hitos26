
import { GoogleGenAI } from "@google/genai";
import { Flight } from "../../types";
import { MILESTONES } from "../../constants";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function analyzeFlightOperation(flight: Flight): Promise<{ analysis: string; isPositive: boolean }> {
  const model = "gemini-3.1-pro-preview";
  
  // Prepare data for the prompt
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
    7. Determina si el análisis general es POSITIVO (operación eficiente o recuperada) o NEGATIVO (demora impactante o ineficiencia grave).
    8. El tono debe ser profesional, directo y constructivo.
    9. La respuesta debe ser en formato JSON con dos campos: "analysis" (string en markdown) y "isPositive" (boolean).

    No incluyas explicaciones fuera del JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const result = JSON.parse(response.text || '{"analysis": "Error al generar análisis", "isPositive": false}');
    return result;
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return {
      analysis: "No se pudo realizar el análisis de IA en este momento debido a un error de conexión.",
      isPositive: false
    };
  }
}
