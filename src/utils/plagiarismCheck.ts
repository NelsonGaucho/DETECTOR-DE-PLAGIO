
// Main entry point for plagiarism detection

import { toast } from "sonner";
import { extractTextFromFile } from "./plagiarism/textExtraction";
import { analyzePlagiarismWithSupabase } from "@/services/plagiarism/supabaseService";
import { PlagiarismResult, PlagiarismSource, AnalyzedContent, AiAnalysisDetails } from "./plagiarism/types";

// Re-export types for backward compatibility
export type { PlagiarismResult, PlagiarismSource, AnalyzedContent, AiAnalysisDetails };

// Main function to check plagiarism
export const checkPlagiarism = async (file: File): Promise<PlagiarismResult> => {
  console.log("INICIO: Proceso de verificación de plagio con archivo:", file.name);
  
  return new Promise((resolve, reject) => {
    try {
      // Set a timeout to avoid blocking indefinitely
      const timeout = setTimeout(() => {
        toast.error("La operación ha tardado demasiado. Intente con un archivo más pequeño.");
        reject(new Error("Operation timed out"));
      }, 60000); // 60 segundos para el análisis completo (aumentado para dar más tiempo)
      
      // Extract text from file first
      extractTextFromFile(file)
        .then(async (fileContent) => {
          console.log("ÉXITO: Texto extraído del archivo, longitud:", fileContent.length);
          
          try {
            // Use Supabase Edge Function for analysis with Google and Google Scholar only
            console.log("INICIO: Análisis de plagio con Supabase Edge Function (Google + Google Scholar)");
            const result = await analyzePlagiarismWithSupabase(fileContent);
            
            // Clear timeout as operation completed
            clearTimeout(timeout);
            console.log("ÉXITO: Análisis de plagio completado:", result);
            resolve(result);
          } catch (error) {
            console.error("ERROR: Servicio Supabase falló:", error);
            clearTimeout(timeout);
            
            toast.error("Error en el servicio de análisis. Por favor, inténtelo de nuevo más tarde.", {
              duration: 5000,
            });
            
            // No usamos resultados simulados, devolvemos un resultado vacío
            const emptyResult: PlagiarismResult = {
              percentage: 0,
              sources: [],
              documentContent: fileContent,
              analyzedContent: [],
              rawResponses: [{ text: "Error en el análisis", rawResponse: { error } }],
              aiGeneratedProbability: 0
            };
            
            resolve(emptyResult);
          }
        })
        .catch(extractError => {
          clearTimeout(timeout);
          console.error("ERROR: Extracción de texto:", extractError);
          toast.error("Error al extraer texto del documento");
          reject(extractError);
        });
    } catch (error) {
      console.error("ERROR: Proceso de análisis:", error);
      toast.error("Error en el análisis de plagio");
      reject(error);
    }
  });
};

// Re-export sanitizeText for backward compatibility
export { sanitizeText } from "./plagiarism/textExtraction";
