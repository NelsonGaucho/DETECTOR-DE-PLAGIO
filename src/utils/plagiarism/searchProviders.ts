
import { supabase } from "@/integrations/supabase/client";

// Realiza una búsqueda usando la Edge Function de OpenAI
export const performOpenAISearch = async (text: string): Promise<any> => {
  if (!text || text.length < 20) return { matches: [] };
  
  try {
    // Utilizar la función Edge de Supabase para OpenAI
    const { data, error } = await supabase.functions.invoke('openai-search', {
      body: { text }
    });
    
    if (error) {
      console.error("Error en Edge Function OpenAI:", error);
      return { matches: [] };
    }
    
    return data;
  } catch (error) {
    console.error("Error en búsqueda con OpenAI:", error);
    return { matches: [] };
  }
};

// Realiza una búsqueda usando la Edge Function de DeepSeek
export const performDeepseekSearch = async (text: string): Promise<any> => {
  if (!text || text.length < 20) return { matches: [] };
  
  try {
    // Utilizar la función Edge de Supabase para DeepSeek
    const { data, error } = await supabase.functions.invoke('deepseek-search', {
      body: { text }
    });
    
    if (error) {
      console.error("Error en Edge Function DeepSeek:", error);
      return { matches: [] };
    }
    
    return data;
  } catch (error) {
    console.error("Error en búsqueda con DeepSeek:", error);
    return { matches: [] };
  }
};

// Realiza una búsqueda usando la Edge Function de Wowinston.AI
export const performWowinstonSearch = async (text: string): Promise<any> => {
  if (!text || text.length < 20) return { matches: [] };
  
  try {
    // Utilizar la función Edge de Supabase para Wowinston.AI
    const { data, error } = await supabase.functions.invoke('wowinston-search', {
      body: { text }
    });
    
    if (error) {
      console.error("Error en Edge Function Wowinston:", error);
      return { matches: [] };
    }
    
    return data;
  } catch (error) {
    console.error("Error en búsqueda con Wowinston:", error);
    return { matches: [] };
  }
};

// Realiza una búsqueda usando la Edge Function de Detecting-AI
export const performDetectingAISearch = async (text: string): Promise<any> => {
  if (!text || text.length < 20) return { matches: [] };
  
  try {
    // Utilizar la función Edge de Supabase para Detecting-AI
    const { data, error } = await supabase.functions.invoke('detectingai-search', {
      body: { text }
    });
    
    if (error) {
      console.error("Error en Edge Function Detecting-AI:", error);
      return { matches: [] };
    }
    
    return data;
  } catch (error) {
    console.error("Error en búsqueda con Detecting-AI:", error);
    return { matches: [] };
  }
};
