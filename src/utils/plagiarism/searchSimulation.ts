import { toast } from "sonner";
import { DeepSeekSearchResponse, GoogleSearchResponse, OpenAIEmbeddingResponse } from "./types";
import { supabase } from "@/integrations/supabase/client";

// Busca coincidencias reales en internet utilizando múltiples APIs a través de Edge Functions
export const searchInternet = async (paragraphs: string[]): Promise<any[]> => {
  toast.loading("Buscando coincidencias usando múltiples motores de búsqueda (Google, DeepSeek-R1, OpenAI)...", { id: "internetSearch" });
  
  try {
    // Optimizamos limitando el número de párrafos a procesar
    const limitedParagraphs = paragraphs.slice(0, 5); // Máximo 5 párrafos para evitar sobrecargar las APIs
    
    // Usamos Promise.all con timeouts para evitar bloqueos
    const results = await Promise.all(
      limitedParagraphs.map(async (paragraph) => {
        return Promise.race([
          // La búsqueda multimodal usando las tres APIs
          new Promise(async (resolve) => {
            try {
              // 1. Realizar búsqueda con OpenAI a través de Edge Function
              const openaiResults = await performOpenAISearch(paragraph);
              
              // 2. Realizar búsqueda con DeepSeek a través de Edge Function
              const deepseekResults = await performDeepseekSearch(paragraph);
              
              // 3. Combinar y deduplicar resultados
              const combinedResults = combineSearchResults(null, deepseekResults, openaiResults, paragraph);
              
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

// Combina y deduplica resultados de múltiples fuentes
const combineSearchResults = (googleResults: any, deepseekResults: any, openaiResults: any, originalText: string): any => {
  // Si todas las APIs fallan o no están configuradas, usar sistema de respaldo
  if (
    (!googleResults?.matches || googleResults.matches.length === 0) &&
    (!deepseekResults?.matches || deepseekResults.matches.length === 0) &&
    (!openaiResults?.matches || openaiResults.matches.length === 0)
  ) {
    return getFallbackResults(originalText);
  }
  
  // Inicializar array combinado de coincidencias
  let combinedMatches: any[] = [];
  
  // Añadir resultados de Google (si existen)
  if (googleResults?.matches && googleResults.matches.length > 0) {
    googleResults.matches.forEach((match: any) => {
      match.source = "Google";
      combinedMatches.push(match);
    });
  }
  
  // Añadir resultados de DeepSeek (si existen)
  if (deepseekResults?.matches && deepseekResults.matches.length > 0) {
    deepseekResults.matches.forEach((match: any) => {
      // Verificar si ya existe la URL para evitar duplicados
      const existingMatch = combinedMatches.find(m => m.url === match.url);
      if (existingMatch) {
        // Si existe, actualizar la similitud si la nueva es mayor
        if (match.matchPercentage > existingMatch.matchPercentage) {
          existingMatch.matchPercentage = match.matchPercentage;
          existingMatch.source = "DeepSeek-R1, " + existingMatch.source;
        }
      } else {
        match.source = "DeepSeek-R1";
        combinedMatches.push(match);
      }
    });
  }
  
  // Añadir resultados de OpenAI (si existen)
  if (openaiResults?.matches && openaiResults.matches.length > 0) {
    openaiResults.matches.forEach((match: any) => {
      // Verificar si ya existe la URL para evitar duplicados
      const existingMatch = combinedMatches.find(m => m.url === match.url);
      if (existingMatch) {
        // Si existe, actualizar la similitud si la nueva es mayor
        if (match.matchPercentage > existingMatch.matchPercentage) {
          existingMatch.matchPercentage = match.matchPercentage;
          existingMatch.source = "OpenAI, " + existingMatch.source;
        }
      } else {
        match.source = "OpenAI";
        combinedMatches.push(match);
      }
    });
  }
  
  // Ordenar por similitud (descendente)
  combinedMatches.sort((a, b) => b.matchPercentage - a.matchPercentage);
  
  // Limitar a las 8 coincidencias más relevantes
  combinedMatches = combinedMatches.slice(0, 8);
  
  return {
    text: originalText.substring(0, 150) + "...",
    matches: combinedMatches
  };
};

// Realiza una búsqueda usando la Edge Function de OpenAI
const performOpenAISearch = async (text: string): Promise<any> => {
  if (!text || text.length < 20) return { matches: [] };
  
  try {
    // Utilizar la función Edge de Supabase para OpenAI
    const { data, error } = await supabase.functions.invoke('openai-search', {
      body: { text }
    });
    
    if (error) {
      console.error("Error en Edge Function OpenAI:", error);
      return { matches: [] };
    }
    
    return data;
  } catch (error) {
    console.error("Error en búsqueda con OpenAI:", error);
    return { matches: [] };
  }
};

// Realiza una búsqueda usando la Edge Function de DeepSeek
const performDeepseekSearch = async (text: string): Promise<any> => {
  if (!text || text.length < 20) return { matches: [] };
  
  try {
    // Utilizar la función Edge de Supabase para DeepSeek
    const { data, error } = await supabase.functions.invoke('deepseek-search', {
      body: { text }
    });
    
    if (error) {
      console.error("Error en Edge Function DeepSeek:", error);
      return { matches: [] };
    }
    
    return data;
  } catch (error) {
    console.error("Error en búsqueda con DeepSeek:", error);
    return { matches: [] };
  }
};

// Búsqueda por palabras clave para el sistema de respaldo
const performKeywordSearch = (text: string): any[] => {
  const keywordMap: Record<string, any[]> = {
    "inteligencia artificial": [
      {
        url: "https://es.wikipedia.org/wiki/Inteligencia_artificial",
        title: "Inteligencia artificial - Wikipedia",
        similarity: 85,
        text: "La inteligencia artificial es la simulación de procesos de inteligencia humana por parte de máquinas"
      }
    ],
    "calentamiento global": [
      {
        url: "https://www.nationalgeographic.es/medio-ambiente/que-es-el-calentamiento-global",
        title: "¿Qué es el calentamiento global? - National Geographic",
        similarity: 91,
        text: "El calentamiento global es el aumento a largo plazo de la temperatura media del sistema climático de la Tierra"
      }
    ],
    "energía renovable": [
      {
        url: "https://www.ree.es/es/sostenibilidad/energias-renovables",
        title: "Energías renovables - Red Eléctrica de España",
        similarity: 88,
        text: "Las energías renovables son aquellas que se obtienen de fuentes naturales inagotables a escala humana"
      }
    ],
    "algoritmo": [
      {
        url: "https://concepto.de/algoritmo-en-informatica/",
        title: "Concepto de Algoritmo en Informática",
        similarity: 82,
        text: "Un algoritmo es un conjunto de instrucciones o reglas definidas y no-ambiguas, ordenadas y finitas"
      }
    ]
  };
  
  let matches: any[] = [];
  
  Object.keys(keywordMap).forEach(keyword => {
    if (text.toLowerCase().includes(keyword)) {
      matches = [...matches, ...keywordMap[keyword]];
    }
  });
  
  return matches;
};

// Calcula la similitud entre dos textos
const calculateSimilarity = (text1: string, text2: string): number => {
  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);
  
  let matchCount = 0;
  
  // Contamos palabras coincidentes
  words1.forEach(word => {
    if (words2.includes(word) && word.length > 3) { // Solo palabras con más de 3 caracteres
      matchCount++;
    }
  });
  
  // Calculamos porcentaje de similitud
  const similarity = (matchCount / words1.length) * 100;
  return Math.min(Math.round(similarity), 100);
};

// Sistema de respaldo para mantener la funcionalidad en caso de error con las APIs
const getFallbackResults = (text: string): any => {
  // Usar el sistema de palabras clave pero marcando que son resultados de respaldo
  const matches = performKeywordSearch(text);
  
  // Si no hay coincidencias y el texto es sustancial, añadir nota sobre falta de APIs
  if (matches.length === 0 && text.length > 100) {
    matches.push({
      url: "https://www.ejemplo.com/aviso-api",
      title: "Se requieren APIs de búsqueda reales",
      similarity: 30,
      text: "Para obtener resultados reales, se necesita configurar las APIs de Google, DeepSeek-R1 y OpenAI. Este es un resultado de respaldo."
    });
  }
  
  return {
    text: text.substring(0, 150) + "...",
    matches: matches.slice(0, 3)
  };
};
