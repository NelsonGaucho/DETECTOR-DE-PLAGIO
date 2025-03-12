
import { toast } from "sonner";
import { PlagiarismResult } from "@/utils/plagiarism/types";
import { createClient } from "@supabase/supabase-js";

// Cliente de Supabase (usando las variables de entorno disponibles en el navegador)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://your-supabase-url.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Envía texto al backend de Supabase Edge Function para análisis de plagio
 */
export const analyzePlagiarismWithSuapbase = async (text: string): Promise<PlagiarismResult> => {
  try {
    toast.loading("Analizando documento con fuentes reales...", {
      id: "supabaseAnalysis",
    });

    // Llamar a la función Edge de Supabase
    const { data, error } = await supabase.functions.invoke('detect-plagiarism', {
      body: { text },
    });

    if (error) {
      throw new Error(`Error en el servicio de análisis: ${error.message}`);
    }

    toast.success("Análisis completado", {
      id: "supabaseAnalysis",
    });

    return {
      percentage: data.plagiarism_percentage || 0,
      sources: data.sources?.map((source: any) => ({
        url: source.url,
        title: source.title || "Fuente detectada",
        matchPercentage: source.match_percentage || 0,
      })) || [],
      documentContent: data.document_content || "",
      analyzedContent: data.analyzed_content?.map((content: any) => ({
        text: content.text,
        isPlagiarized: content.is_plagiarized,
      })) || [],
      rawResponses: [{ text: "Análisis completo", rawResponse: data }],
      aiGeneratedProbability: data.ai_generated_probability || 0,
      aiAnalysisDetails: data.ai_analysis_details || null,
    };
  } catch (error) {
    console.error("Error al analizar el plagio con Supabase:", error);
    toast.error(`Error en el análisis: ${error.message}`, {
      id: "supabaseAnalysis",
    });
    throw error;
  }
};

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
    return await analyzePlagiarismWithSuapbase(fileContent);
  } catch (error) {
    console.error("Error al extraer y analizar texto:", error);
    toast.error(`Error al procesar el documento: ${error.message}`, {
      id: "textExtraction",
    });
    throw error;
  }
};

/**
 * Envía un archivo al backend de Python para análisis de plagio y detección de IA
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
