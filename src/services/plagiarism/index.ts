
import { PlagiarismResult } from "@/utils/plagiarism/types";
import { extractAndAnalyzeText } from "./textExtractionService";
import { analyzePlagiarismWithSupabase } from "./supabaseService";

/**
 * Envía un archivo para análisis de plagio utilizando exclusivamente Google y Google Scholar
 * a través de la función Edge de Supabase
 */
export const analyzePlagiarismWithPython = async (file: File): Promise<PlagiarismResult> => {
  try {
    console.log("Redirigiendo solicitud a extractAndAnalyzeText (Supabase)");
    return await extractAndAnalyzeText(file);
  } catch (error) {
    console.error("Error al analizar el plagio:", error);
    throw error;
  }
};

// Re-export de las funciones para mantener compatibilidad con código existente
export { analyzePlagiarismWithSupabase, extractAndAnalyzeText };
