
import { PlagiarismResult } from "@/utils/plagiarism/types";
import { extractAndAnalyzeText } from "./textExtractionService";
import { analyzePlagiarismWithSupabase } from "./supabaseService";

/**
 * Envía un archivo al backend para análisis de plagio y detección de IA
 * (Mantenido por compatibilidad con el código existente)
 */
export const analyzePlagiarismWithPython = async (file: File): Promise<PlagiarismResult> => {
  try {
    // Ahora usamos el servicio de Supabase Edge en lugar del backend Python
    return await extractAndAnalyzeText(file);
  } catch (error) {
    console.error("Error al analizar el plagio:", error);
    throw error;
  }
};

// Re-export de las funciones para mantener compatibilidad con código existente
export { analyzePlagiarismWithSupabase, extractAndAnalyzeText };
