
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Busca coincidencias reales en internet utilizando múltiples APIs a través de Edge Functions
// y devuelve la respuesta sin procesar
export const searchInternet = async (paragraphs: string[]): Promise<any[]> => {
  toast.loading("Obteniendo respuesta sin procesar de Supabase...", { id: "internetSearch" });
  
  try {
    // Limitamos el número de párrafos a procesar para evitar sobrecargar las APIs
    const maxParagraphs = Math.min(paragraphs.length, 10);
    const limitedParagraphs = paragraphs.slice(0, maxParagraphs);
    
    console.log(`Enviando ${limitedParagraphs.length} párrafos a Supabase`);
    
    // Usamos Promise.all con timeouts para evitar bloqueos
    const results = await Promise.all(
      limitedParagraphs.map(async (paragraph) => {
        return Promise.race([
          // Obtener respuesta sin procesar
          new Promise(async (resolve) => {
            try {
              console.log(`Enviando a Supabase: "${paragraph.substring(0, 50)}..."`);
              
              // Llamar al endpoint detect-plagiarism 
              const { data, error } = await supabase.functions.invoke('detect-plagiarism', {
                body: { text: paragraph }
              });
              
              console.log("Respuesta sin procesar de Supabase:", data);
              
              if (error) {
                console.error("Error en Edge Function detect-plagiarism:", error);
                resolve({ text: paragraph, rawResponse: null, error: error });
                return;
              }
              
              // Verificar si hay errores específicos de Detecting-AI
              const detectingAiResult = data?.results?.find((r: any) => r.source === "Detecting-AI");
              
              if (detectingAiResult?.error) {
                console.error("Error específico de Detecting-AI:", detectingAiResult.error);
                console.log("Respuesta cruda de Detecting-AI:", detectingAiResult.rawResponse);
                
                // Si es un error HTML, mostramos una alerta más específica
                if (detectingAiResult.isHtmlResponse) {
                  toast.error("La API de Detecting-AI devolvió HTML en lugar de JSON. Posible error de configuración.", { 
                    duration: 5000 
                  });
                }
              }
              
              // Devolver la respuesta sin procesar
              resolve({ 
                text: paragraph, 
                rawResponse: data 
              });
            } catch (error) {
              console.error("Error en búsqueda:", error);
              resolve({ text: paragraph, rawResponse: null, error: error });
            }
          }),
          // Timeout después de 20 segundos para evitar bloqueos
          new Promise((resolve) => {
            setTimeout(() => {
              console.warn("Timeout alcanzado para un párrafo, pasando al siguiente");
              resolve({ text: paragraph, rawResponse: null, error: "Timeout" });
            }, 20000);
          })
        ]);
      })
    );
    
    toast.success("Respuesta obtenida de Supabase", { id: "internetSearch" });
    return results;
  } catch (error) {
    toast.error("Error al obtener respuesta de Supabase", { id: "internetSearch" });
    console.error("Error in Supabase response:", error);
    return [];
  }
};
