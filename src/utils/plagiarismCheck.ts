
// Main entry point for plagiarism detection using real internet search

import { toast } from "sonner";
import { extractParagraphs, extractTextFromFile, sanitizeText } from "./plagiarism/textExtraction";
import { searchInternet } from "./plagiarism/searchSimulation";
import { calculatePlagiarism } from "./plagiarism/analysisUtils";
import { PlagiarismResult, PlagiarismSource, AnalyzedContent } from "./plagiarism/types";

// Re-export types for backward compatibility
export type { PlagiarismResult, PlagiarismSource, AnalyzedContent };

// Main function to check plagiarism using Internet search
export const checkPlagiarism = async (file: File): Promise<PlagiarismResult> => {
  return new Promise((resolve, reject) => {
    try {
      // Extract text from the file (PDF or DOCX)
      extractTextFromFile(file)
        .then(async (fileContent) => {
          try {
            // Split content into paragraphs for analysis
            const paragraphs = extractParagraphs(fileContent);
            
            // Get real search results for each paragraph
            const results = await searchInternet(paragraphs);
            
            // Calculate plagiarism percentage based on results
            const plagiarismData = calculatePlagiarism(results, fileContent);
            
            // Return complete result
            resolve(plagiarismData);
          } catch (error) {
            console.error("Error processing content:", error);
            toast.error("Error al analizar el documento");
            reject(error);
          }
        })
        .catch(error => {
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
