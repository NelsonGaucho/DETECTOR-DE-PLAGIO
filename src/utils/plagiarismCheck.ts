
// Main entry point for plagiarism detection using real internet search

import { toast } from "sonner";
import { extractParagraphs, extractTextFromFile, sanitizeText } from "./plagiarism/textExtraction";
import { searchInternet } from "./plagiarism/internetSearch";
import { calculatePlagiarism } from "./plagiarism/analysisUtils";
import { PlagiarismResult, PlagiarismSource, AnalyzedContent } from "./plagiarism/types";
import { supabase } from "@/integrations/supabase/client";

// Re-export types for backward compatibility
export type { PlagiarismResult, PlagiarismSource, AnalyzedContent };

// Main function to check plagiarism using Internet search (optimized)
export const checkPlagiarism = async (file: File): Promise<PlagiarismResult> => {
  return new Promise((resolve, reject) => {
    try {
      // Set a timeout to avoid blocking indefinitely
      const timeout = setTimeout(() => {
        toast.error("La operación ha tardado demasiado. Intente con un archivo más pequeño.");
        reject(new Error("Operation timed out"));
      }, 30000); // Aumentado a 30 segundos para APIs reales
      
      // Extract text from the file (PDF or DOCX)
      extractTextFromFile(file)
        .then(async (fileContent) => {
          try {
            // Split content into paragraphs for analysis
            const paragraphs = extractParagraphs(fileContent);
            
            // Get real search results for each paragraph
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
            
            // Obtener el token de autenticación si el usuario está autenticado
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            
            // Guardar los resultados en la base de datos
            try {
              const { error } = await supabase.functions.invoke('save-plagiarism-check', {
                body: {
                  documentName: file.name,
                  documentContent: fileContent.substring(0, 10000), // Limitar tamaño
                  plagiarismPercentage: plagiarismData.percentage,
                  sources: plagiarismData.sources,
                  // Enviar userId desde el cliente como respaldo
                  requestUserId: session?.user?.id || null
                },
                headers: token ? { Authorization: `Bearer ${token}` } : undefined
              });
              
              if (error) {
                console.error("Error guardando resultados:", error);
                // No bloqueamos el flujo si hay error al guardar
              }
            } catch (saveError) {
              console.error("Error en Edge Function para guardar:", saveError);
              // No bloqueamos el flujo si hay error al guardar
            }
            
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
