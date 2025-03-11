
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
    // Limitamos el número de párrafos a procesar para evitar sobrecargar las APIs
    // pero mantenemos un número razonable para una buena cobertura
    const maxParagraphs = Math.min(paragraphs.length, 10);
    const limitedParagraphs = paragraphs.slice(0, maxParagraphs);
    
    console.log(`Analizando ${limitedParagraphs.length} párrafos con APIs reales`);
    
    // Usamos Promise.all con timeouts para evitar bloqueos
    const results = await Promise.all(
      limitedParagraphs.map(async (paragraph) => {
        return Promise.race([
          // La búsqueda multimodal usando múltiples APIs
          new Promise(async (resolve) => {
            try {
              console.log(`Buscando coincidencias para: "${paragraph.substring(0, 50)}..."`);
              
              // 1. Realizar búsqueda con OpenAI
              const openaiResults = await performOpenAISearch(paragraph);
              console.log("OpenAI devolvió:", openaiResults.matches?.length || 0, "resultados");
              
              // 2. Realizar búsqueda con DeepSeek
              const deepseekResults = await performDeepseekSearch(paragraph);
              console.log("DeepSeek devolvió:", deepseekResults.matches?.length || 0, "resultados");
              
              // 3. Realizar búsqueda con Wowinston.AI
              const wowinstonResults = await performWowinstonSearch(paragraph);
              console.log("Wowinston.AI devolvió:", wowinstonResults.matches?.length || 0, "resultados");
              
              // 4. Realizar búsqueda con Detecting-AI
              const detectingAiResults = await performDetectingAISearch(paragraph);
              console.log("Detecting-AI devolvió:", detectingAiResults.matches?.length || 0, "resultados");
              
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
              resolve({ text: paragraph, matches: [] });
            }
          }),
          // Timeout después de 20 segundos para evitar bloqueos
          new Promise((resolve) => {
            setTimeout(() => {
              console.warn("Timeout alcanzado para un párrafo, pasando al siguiente");
              resolve({ text: paragraph, matches: [] });
            }, 20000);
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
