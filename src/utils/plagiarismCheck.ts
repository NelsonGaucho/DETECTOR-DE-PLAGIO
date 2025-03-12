
// Main entry point for plagiarism detection

import { toast } from "sonner";
import { extractParagraphs, extractTextFromFile, sanitizeText } from "./plagiarism/textExtraction";
import { analyzePlagiarismWithSupabase } from "@/services/plagiarism/supabaseService";
import { calculatePlagiarism } from "./plagiarism/analysisUtils";
import { PlagiarismResult, PlagiarismSource, AnalyzedContent, AiAnalysisDetails } from "./plagiarism/types";

// Re-export types for backward compatibility
export type { PlagiarismResult, PlagiarismSource, AnalyzedContent, AiAnalysisDetails };

// Main function to check plagiarism
export const checkPlagiarism = async (file: File): Promise<PlagiarismResult> => {
  return new Promise((resolve, reject) => {
    try {
      // Set a timeout to avoid blocking indefinitely
      const timeout = setTimeout(() => {
        toast.error("La operación ha tardado demasiado. Intente con un archivo más pequeño.");
        reject(new Error("Operation timed out"));
      }, 30000); // 30 segundos para el análisis completo
      
      // Extract text from file first
      extractTextFromFile(file)
        .then(async (fileContent) => {
          try {
            // Use Supabase Edge Function for analysis with Google and Google Scholar
            console.log("Iniciando análisis de plagio con Supabase");
            const result = await analyzePlagiarismWithSupabase(fileContent);
            
            // Clear timeout as operation completed
            clearTimeout(timeout);
            resolve(result);
          } catch (error) {
            // If the service fails, try the fallback local method
            console.error("Servicio Supabase falló, usando método local simplificado:", error);
            toast.warning("Servicio de análisis avanzado no disponible. Usando método local simplificado.", {
              duration: 5000,
            });
            
            try {
              // Split content into paragraphs for analysis
              const paragraphs = extractParagraphs(fileContent);
              
              // Simulated analysis
              console.log("Usando análisis local simplificado (fallback)");
              
              // Calculate plagiarism percentage based on local analysis
              const plagiarismData = calculatePlagiarism(
                paragraphs.map(p => ({ text: p })), 
                fileContent
              );
              
              // Add AI detection probability (simulated in local mode)
              plagiarismData.aiGeneratedProbability = Math.floor(Math.random() * 70);
              
              // Clear timeout as operation completed successfully
              clearTimeout(timeout);
              
              // Return complete result
              resolve(plagiarismData);
            } catch (fallbackError) {
              clearTimeout(timeout);
              console.error("Error in fallback processing:", fallbackError);
              toast.error("Error al analizar el documento en modo local");
              reject(fallbackError);
            }
          }
        })
        .catch(extractError => {
          clearTimeout(timeout);
          console.error("Error extracting text:", extractError);
          toast.error("Error al extraer texto del documento");
          reject(extractError);
        });
    } catch (error) {
      console.error("Error in analysis process:", error);
      toast.error("Error en el análisis de plagio");
      reject(error);
    }
  });
};

// Re-export sanitizeText for backward compatibility
export { sanitizeText };
