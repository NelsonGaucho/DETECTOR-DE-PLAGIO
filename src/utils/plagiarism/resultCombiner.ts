
import { performKeywordSearch } from "./fallbackSearch";

// Combina y deduplica resultados de múltiples fuentes
export const combineSearchResults = (
  googleResults: any, 
  deepseekResults: any, 
  openaiResults: any,
  wowinstonResults: any,
  detectingAiResults: any,
  originalText: string
): any => {
  // Si todas las APIs fallan o no están configuradas, usar sistema de respaldo
  if (
    (!googleResults?.matches || googleResults.matches.length === 0) &&
    (!deepseekResults?.matches || deepseekResults.matches.length === 0) &&
    (!openaiResults?.matches || openaiResults.matches.length === 0) &&
    (!wowinstonResults?.matches || wowinstonResults.matches.length === 0) &&
    (!detectingAiResults?.matches || detectingAiResults.matches.length === 0)
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
  
  // Añadir resultados de Wowinston.AI (si existen)
  if (wowinstonResults?.matches && wowinstonResults.matches.length > 0) {
    wowinstonResults.matches.forEach((match: any) => {
      // Verificar si ya existe la URL para evitar duplicados
      const existingMatch = combinedMatches.find(m => m.url === match.url);
      if (existingMatch) {
        // Si existe, actualizar la similitud si la nueva es mayor
        if (match.matchPercentage > existingMatch.matchPercentage) {
          existingMatch.matchPercentage = match.matchPercentage;
          existingMatch.source = "Wowinston.AI, " + existingMatch.source;
        }
      } else {
        match.source = "Wowinston.AI";
        combinedMatches.push(match);
      }
    });
  }
  
  // Añadir resultados de Detecting-AI (si existen)
  if (detectingAiResults?.matches && detectingAiResults.matches.length > 0) {
    detectingAiResults.matches.forEach((match: any) => {
      // Verificar si ya existe la URL para evitar duplicados
      const existingMatch = combinedMatches.find(m => m.url === match.url);
      if (existingMatch) {
        // Si existe, actualizar la similitud si la nueva es mayor
        if (match.matchPercentage > existingMatch.matchPercentage) {
          existingMatch.matchPercentage = match.matchPercentage;
          existingMatch.source = "Detecting-AI, " + existingMatch.source;
        }
      } else {
        match.source = "Detecting-AI";
        combinedMatches.push(match);
      }
    });
  }
  
  // Ordenar por similitud (descendente)
  combinedMatches.sort((a, b) => b.matchPercentage - a.matchPercentage);
  
  // Limitar a las 10 coincidencias más relevantes (aumentado de 8 a 10)
  combinedMatches = combinedMatches.slice(0, 10);
  
  return {
    text: originalText.substring(0, 150) + "...",
    matches: combinedMatches
  };
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
