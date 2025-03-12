
import { toast } from "sonner";
import { PlagiarismResult } from "@/utils/plagiarism/types";
import { createClient } from "@supabase/supabase-js";

// Cliente de Supabase (usando las variables de entorno disponibles en el navegador)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Envía texto al backend de Supabase Edge Function para análisis de plagio
 * usando exclusivamente Google y Google Scholar
 */
export const analyzePlagiarismWithSupabase = async (text: string): Promise<PlagiarismResult> => {
  try {
    console.log("INICIO: Analizando documento con Supabase Edge Function (Google + Google Scholar)");
    
    toast.loading("Analizando documento con fuentes reales...", {
      id: "supabaseAnalysis",
    });

    // Llamar a la función Edge de Supabase que usa Google y Google Scholar
    const { data, error } = await supabase.functions.invoke('detect-plagiarism', {
      body: { text },
    });

    if (error) {
      console.error("ERROR en el servicio detect-plagiarism:", error);
      throw new Error(`Error en el servicio de búsqueda: ${error.message}`);
    }

    console.log("ÉXITO: Respuesta de detect-plagiarism recibida:", data);
    
    toast.success("Análisis completado", {
      id: "supabaseAnalysis",
    });

    return {
      percentage: data.plagiarism_percentage || 0,
      sources: data.sources?.map((source: any) => ({
        url: source.url,
        title: source.title || "Fuente detectada",
        matchPercentage: source.matchPercentage || 0,
        source: source.source || "Google Search",
      })) || [],
      documentContent: data.document_content || text.substring(0, 1000),
      analyzedContent: data.analyzed_content?.map((content: any) => ({
        text: content.text,
        isPlagiarized: content.is_plagiarized,
      })) || [],
      rawResponses: [{ text: "Análisis con Google y Google Scholar", rawResponse: data }],
      aiGeneratedProbability: data.ai_generated_probability || 0,
      aiAnalysisDetails: data.ai_analysis_details || null,
    };
  } catch (error: any) {
    console.error("Error al analizar el plagio con Supabase:", error);
    toast.error(`Error en el análisis: ${error.message}`, {
      id: "supabaseAnalysis",
    });
    throw error;
  }
};
