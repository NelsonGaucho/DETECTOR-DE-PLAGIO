
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Manejar preflight CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const detectingAiApiKey = Deno.env.get("DETECTINGAI_API_KEY");
    if (!detectingAiApiKey) {
      throw new Error("DETECTINGAI_API_KEY no está configurada");
    }

    const body = await req.json();
    const { text } = body;

    if (!text) {
      return new Response(
        JSON.stringify({ error: "El texto a analizar es requerido" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Preparar la consulta para Detecting-AI
    const searchQuery = text.substring(0, 1000).trim();
    
    // Llamar a la API de Detecting-AI
    const response = await fetch("https://api.detecting-ai.com/v1/plagiarism", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": detectingAiApiKey,
      },
      body: JSON.stringify({
        content: searchQuery,
        search_depth: "full",
        include_sources: true
      }),
    });

    if (!response.ok) {
      throw new Error(`Error de búsqueda Detecting-AI: ${response.status}`);
    }

    const data = await response.json();
    
    // Procesar los resultados de la búsqueda
    const matches = data.sources?.map((item) => ({
      url: item.url,
      title: item.title || "Fuente de Detecting-AI",
      matchPercentage: Math.round(item.match_score * 100), // Convertir de 0-1 a porcentaje
      text: item.excerpt || "",
      source: "Detecting-AI"
    })) || [];

    return new Response(
      JSON.stringify({ matches }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error en función Detecting-AI:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        note: "Es posible que la API de Detecting-AI no esté accesible o que el formato de la petición no sea correcto."
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
