
import { toast } from "sonner";
import { PlagiarismResult } from "@/utils/plagiarism/types";

// URL base del servicio de Python (a configurar cuando esté disponible)
const PYTHON_API_URL = "http://localhost:5000"; // Cambiar a la URL real cuando esté desplegado

/**
 * Envía un archivo al backend de Python para análisis de plagio y detección de IA
 */
export const analyzePlagiarismWithPython = async (file: File): Promise<PlagiarismResult> => {
  try {
    toast.loading("Analizando documento con algoritmos open-source...", {
      id: "pythonAnalysis",
    });

    // Crear un FormData para enviar el archivo
    const formData = new FormData();
    formData.append("file", file);

    // Realizar la petición al backend de Python
    const response = await fetch(`${PYTHON_API_URL}/analyze`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Error en el servicio de análisis: ${response.status} - ${errorText}`
      );
    }

    const result = await response.json();
    
    toast.success("Análisis completado", {
      id: "pythonAnalysis",
    });

    return {
      percentage: result.plagiarism_percentage || 0,
      sources: result.sources?.map((source: any) => ({
        url: source.url,
        title: source.title || "Fuente detectada",
        matchPercentage: source.match_percentage || 0,
      })) || [],
      documentContent: result.document_content || "",
      analyzedContent: result.analyzed_content?.map((content: any) => ({
        text: content.text,
        isPlagiarized: content.is_plagiarized,
      })) || [],
      rawResponses: result.raw_data ? [{ 
        text: "Análisis completo", 
        rawResponse: result.raw_data 
      }] : [],
      aiGeneratedProbability: result.ai_generated_probability || 0,
      aiAnalysisDetails: result.ai_analysis_details || null,
    };
  } catch (error) {
    console.error("Error al analizar el plagio con Python:", error);
    toast.error(`Error en el análisis: ${error.message}`, {
      id: "pythonAnalysis",
    });
    throw error;
  }
};
