
import { toast } from "sonner";
import { PlagiarismResult } from "@/utils/plagiarism/types";
import { analyzePlagiarismWithSupabase } from "./supabaseService";

/**
 * Extrae texto de un archivo para análisis
 */
export const extractAndAnalyzeText = async (file: File): Promise<PlagiarismResult> => {
  try {
    toast.loading("Extrayendo texto del documento...", {
      id: "textExtraction",
    });

    // Extraer texto del archivo usando las utilidades existentes
    const { extractTextFromFile } = await import("@/utils/plagiarism/textExtraction");
    const fileContent = await extractTextFromFile(file);

    toast.success("Texto extraído correctamente", {
      id: "textExtraction",
    });

    // Analizar el texto extraído
    return await analyzePlagiarismWithSupabase(fileContent);
  } catch (error) {
    console.error("Error al extraer y analizar texto:", error);
    toast.error(`Error al procesar el documento: ${error.message}`, {
      id: "textExtraction",
    });
    throw error;
  }
};
