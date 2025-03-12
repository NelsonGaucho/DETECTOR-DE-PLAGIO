
// Main entry point for plagiarism detection using simulated search

import { toast } from "sonner";
import { extractParagraphs, extractTextFromFile, sanitizeText } from "./plagiarism/textExtraction";
import { searchInternet } from "./plagiarism/internetSearch";
import { calculatePlagiarism } from "./plagiarism/analysisUtils";
import { PlagiarismResult, PlagiarismSource, AnalyzedContent } from "./plagiarism/types";

// Re-export types for backward compatibility
export type { PlagiarismResult, PlagiarismSource, AnalyzedContent };

// Main function to check plagiarism using simulated search
export const checkPlagiarism = async (file: File): Promise<PlagiarismResult> => {
  return new Promise((resolve, reject) => {
    try {
      // Set a timeout to avoid blocking indefinitely
      const timeout = setTimeout(() => {
        toast.error("La operación ha tardado demasiado. Intente con un archivo más pequeño.");
        reject(new Error("Operation timed out"));
      }, 15000); // reducido a 15 segundos ya que ahora es simulado
      
      // Extract text from the file (PDF or DOCX)
      extractTextFromFile(file)
        .then(async (fileContent) => {
          try {
            // Split content into paragraphs for analysis
            const paragraphs = extractParagraphs(fileContent);
            
            // Get simulated search results for each paragraph
            const results = await searchInternet(paragraphs);
            
            // Store raw responses for display
            const rawResponses = results.map(result => ({ 
              text: result.text,
              rawResponse: result.rawResponse 
            }));
            
            // Calculate plagiarism percentage based on results
            const plagiarismData = calculatePlagiarism(results, fileContent);
            
            // Add raw responses to the plagiarism data
            plagiarismData.rawResponses = rawResponses;
            
            // Clear timeout as operation completed successfully
            clearTimeout(timeout);
            
            // Simulamos la operación de guardar sin realmente conectar con Supabase
            console.log("Simulación: Guardando resultados del análisis de plagio localmente");
            
            // Return complete result
            resolve(plagiarismData);
          } catch (error) {
            clearTimeout(timeout);
            console.error("Error processing content:", error);
            toast.error("Error al analizar el documento");
            reject(error);
          }
        })
        .catch(error => {
          clearTimeout(timeout);
          reject(error);
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
