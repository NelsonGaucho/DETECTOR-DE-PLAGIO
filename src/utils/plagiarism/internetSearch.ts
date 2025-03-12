
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Función simplificada que ahora simula una búsqueda en Internet en lugar de usar APIs reales
export const searchInternet = async (paragraphs: string[]): Promise<any[]> => {
  toast.loading("Simulando búsqueda de plagio...", { id: "internetSearch" });
  
  try {
    // Simular una respuesta después de un pequeño retraso para dar feedback visual
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Crear respuestas simuladas para cada párrafo
    const results = paragraphs.map((paragraph) => {
      return {
        text: paragraph,
        rawResponse: {
          simulatedResponse: true,
          message: "APIs externas desactivadas por solicitud del usuario.",
          timestamp: new Date().toISOString()
        }
      };
    });
    
    toast.success("Simulación de búsqueda completada", { id: "internetSearch" });
    return results;
  } catch (error) {
    toast.error("Error en la simulación de búsqueda", { id: "internetSearch" });
    console.error("Error in simulated search:", error);
    return [];
  }
};
