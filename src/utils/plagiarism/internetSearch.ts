
import { toast } from "sonner";
import { combineSearchResults } from "./resultCombiner";
import { 
  performOpenAISearch,
  performDeepseekSearch,
  performWowinstonSearch,
  performDetectingAISearch
} from "./searchProviders";

// Busca coincidencias reales en internet utilizando múltiples APIs a través de Edge Functions
export const searchInternet = async (paragraphs: string[]): Promise<any[]> => {
  toast.loading("Buscando coincidencias usando múltiples motores de búsqueda...", { id: "internetSearch" });
  
  try {
    // Optimizamos limitando el número de párrafos a procesar
    const limitedParagraphs = paragraphs.slice(0, 5); // Máximo 5 párrafos para evitar sobrecargar las APIs
    
    // Usamos Promise.all con timeouts para evitar bloqueos
    const results = await Promise.all(
      limitedParagraphs.map(async (paragraph) => {
        return Promise.race([
          // La búsqueda multimodal usando múltiples APIs
          new Promise(async (resolve) => {
            try {
              // 1. Realizar búsqueda con OpenAI
              const openaiResults = await performOpenAISearch(paragraph);
              
              // 2. Realizar búsqueda con DeepSeek
              const deepseekResults = await performDeepseekSearch(paragraph);
              
              // 3. Realizar búsqueda con Wowinston.AI
              const wowinstonResults = await performWowinstonSearch(paragraph);
              
              // 4. Realizar búsqueda con Detecting-AI
              const detectingAiResults = await performDetectingAISearch(paragraph);
              
              // 5. Combinar y deduplicar resultados
              const combinedResults = combineSearchResults(
                null, 
                deepseekResults, 
                openaiResults,
                wowinstonResults,
                detectingAiResults,
                paragraph
              );
              
              resolve(combinedResults);
            } catch (error) {
              console.error("Error en búsqueda:", error);
              resolve({ text: paragraph.substring(0, 100) + "...", matches: [] });
            }
          }),
          // Timeout después de 15 segundos para evitar bloqueos
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({ text: paragraph.substring(0, 100) + "...", matches: [] });
            }, 15000);
          })
        ]);
      })
    );
    
    toast.success("Búsqueda multi-API completada con éxito", { id: "internetSearch" });
    return results;
  } catch (error) {
    toast.error("Error en la búsqueda multi-API", { id: "internetSearch" });
    console.error("Error in multi-API search:", error);
    return [];
  }
};
