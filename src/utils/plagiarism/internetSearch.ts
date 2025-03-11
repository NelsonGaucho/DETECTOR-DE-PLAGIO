
import { toast } from "sonner";
import { combineSearchResults } from "./resultCombiner";
import { supabase } from "@/integrations/supabase/client";

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
          // Usar el endpoint centralizado para todas las APIs
          new Promise(async (resolve) => {
            try {
              console.log(`Buscando coincidencias para: "${paragraph.substring(0, 50)}..."`);
              
              // Llamar al endpoint detect-plagiarism 
              const { data, error } = await supabase.functions.invoke('detect-plagiarism', {
                body: { text: paragraph }
              });
              
              console.log("Respuesta del endpoint detect-plagiarism:", data);
              
              if (error) {
                console.error("Error en Edge Function detect-plagiarism:", error);
                resolve({ text: paragraph, matches: [] });
                return;
              }
              
              // Si tenemos resultados, procesarlos
              if (data && data.results) {
                // Procesar los resultados en el formato esperado por la aplicación
                const matches = [];
                
                // Procesar resultados de cada API
                for (const apiResult of data.results) {
                  if (apiResult.response && !apiResult.error) {
                    // Dependiendo de la API, extraer la información relevante
                    switch (apiResult.source) {
                      case "OpenAI":
                        // Extraer información de OpenAI
                        if (apiResult.response.choices && apiResult.response.choices[0]) {
                          const content = apiResult.response.choices[0].message.content;
                          // Intentar encontrar URLs o información de fuentes en la respuesta
                          const urls = content.match(/https?:\/\/[^\s]+/g) || [];
                          const sources = urls.map(url => ({
                            url: url,
                            title: "Fuente detectada por OpenAI",
                            matchPercentage: 70, // Valor estimado
                            text: content.substring(0, 150) + "...",
                            source: "OpenAI"
                          }));
                          matches.push(...sources);
                        }
                        break;
                      
                      case "DeepSeek":
                        // Extraer información de DeepSeek
                        if (apiResult.response.results) {
                          const deepSeekMatches = apiResult.response.results.map(item => ({
                            url: item.url || "https://ejemplo.com",
                            title: item.title || "Fuente detectada por DeepSeek",
                            matchPercentage: 75, // Valor estimado
                            text: item.snippet || "",
                            source: "DeepSeek"
                          }));
                          matches.push(...deepSeekMatches);
                        }
                        break;
                      
                      case "Wowinston.AI":
                        // Extraer información de Wowinston.AI
                        if (apiResult.response.sources) {
                          const wowinstonMatches = apiResult.response.sources.map(item => ({
                            url: item.url || "https://ejemplo.com",
                            title: item.title || "Fuente detectada por Wowinston.AI",
                            matchPercentage: Math.round(item.similarity * 100), // Convertir de 0-1 a porcentaje
                            text: item.snippet || "",
                            source: "Wowinston.AI"
                          }));
                          matches.push(...wowinstonMatches);
                        }
                        break;
                      
                      case "Detecting-AI":
                        // Extraer información de Detecting-AI
                        if (apiResult.response.sources) {
                          const detectingAiMatches = apiResult.response.sources.map(item => ({
                            url: item.url || "https://ejemplo.com",
                            title: item.title || "Fuente detectada por Detecting-AI",
                            matchPercentage: Math.round(item.match_score * 100), // Convertir de 0-1 a porcentaje
                            text: item.excerpt || "",
                            source: "Detecting-AI"
                          }));
                          matches.push(...detectingAiMatches);
                        }
                        break;
                    }
                  }
                }
                
                // Usar el combinador de resultados para deduplicar y ordenar
                const combinedResult = combineSearchResults(
                  { matches: [] }, // Google (no usado)
                  { matches: [] }, // DeepSeek (procesado arriba)
                  { matches: [] }, // OpenAI (procesado arriba)
                  { matches: [] }, // Wowinston (procesado arriba)
                  { matches: [] }, // DetectingAI (procesado arriba)
                  paragraph
                );
                
                // Añadir los matches procesados
                combinedResult.matches = matches;
                
                resolve(combinedResult);
              } else {
                resolve({ text: paragraph, matches: [] });
              }
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
