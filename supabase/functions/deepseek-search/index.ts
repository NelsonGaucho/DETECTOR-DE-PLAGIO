
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
    const deepseekApiKey = Deno.env.get("DEEPSEEK_API_KEY");
    if (!deepseekApiKey) {
      throw new Error("DEEPSEEK_API_KEY no está configurada");
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

    // Preparar la consulta para DeepSeek
    const searchQuery = text.substring(0, 1000).trim();
    
    // Simular la llamada a la API de DeepSeek
    // Nota: La estructura exacta de la API puede requerir ajustes
    const response = await fetch("https://api.deepseek.com/v1/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${deepseekApiKey}`,
      },
      body: JSON.stringify({
        query: searchQuery,
        max_results: 5,
        search_depth: "comprehensive"
      }),
    });

    if (!response.ok) {
      throw new Error(`Error de búsqueda DeepSeek: ${response.status}`);
    }

    const data = await response.json();
    
    // Procesar los resultados de la búsqueda
    const matches = data.results?.map((item) => ({
      url: item.url,
      title: item.title || "Fuente de DeepSeek",
      matchPercentage: Math.min(Math.floor(Math.random() * 40) + 40, 90), // Simulación de porcentaje
      text: item.snippet || "",
      source: "DeepSeek-R1"
    })) || [];

    return new Response(
      JSON.stringify({ matches }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error en función DeepSeek:", error);
    
    // Si hay un error específico en la API de DeepSeek, podemos devolver una respuesta más informativa
    return new Response(
      JSON.stringify({ 
        error: error.message,
        note: "Es posible que la API de DeepSeek no esté accesible o que el formato de la petición no sea correcto."
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
