
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
    
    console.log("Enviando solicitud a Detecting-AI con:", searchQuery.substring(0, 50) + "...");
    
    // Log completo de los headers para debugging
    const headers = {
      "Content-Type": "application/json",
      "X-API-Key": detectingAiApiKey,
    };
    console.log("Headers enviados:", JSON.stringify(headers, null, 2));
    
    // URL correcta de la API de Detecting-AI
    const apiUrl = "https://api.detecting-ai.com/v1/plagiarism";
    console.log("URL de la API:", apiUrl);
    
    // Llamar a la API de Detecting-AI con fetch
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        content: searchQuery,
        search_depth: "full",
        include_sources: true
      }),
    });

    // Verificar si la respuesta es exitosa
    if (!response.ok) {
      const statusText = response.statusText;
      const status = response.status;
      
      // Intentar obtener el texto de la respuesta para debugging
      const responseText = await response.text();
      console.error(`Error de Detecting-AI [${status}]: ${statusText}`);
      console.error("Respuesta completa:", responseText.substring(0, 500) + "...");
      
      // Verificar si la respuesta es HTML (error común)
      const isHtml = responseText.trim().startsWith("<!DOCTYPE") || 
                    responseText.trim().startsWith("<html") ||
                    responseText.trim().startsWith("<!doctype");
      
      if (isHtml) {
        return new Response(
          JSON.stringify({ 
            error: `Detecting-AI respondió con HTML en lugar de JSON (código ${status})`,
            htmlResponse: responseText.substring(0, 200) + "...",
            message: "Probablemente la API está caída o la URL es incorrecta"
          }),
          {
            status: 502,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      // Si la respuesta no es HTML, devolver el error general
      throw new Error(`Error de búsqueda Detecting-AI: ${status} ${statusText}`);
    }

    // Intentar analizar la respuesta como JSON
    let data;
    try {
      const responseText = await response.text();
      console.log("Respuesta exitosa de Detecting-AI:", responseText.substring(0, 200) + "...");
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Error al analizar JSON de Detecting-AI:", parseError);
      const responseText = await response.text();
      return new Response(
        JSON.stringify({ 
          error: "Error al analizar la respuesta de Detecting-AI como JSON",
          rawResponse: responseText.substring(0, 500) + "..."
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Procesar los resultados de la búsqueda
    const matches = data.sources?.map((item) => ({
      url: item.url || "URL no disponible",
      title: item.title || "Fuente de Detecting-AI",
      matchPercentage: Math.round((item.match_score || 0) * 100), // Convertir de 0-1 a porcentaje
      text: item.excerpt || "",
      source: "Detecting-AI"
    })) || [];

    return new Response(
      JSON.stringify({ 
        matches,
        apiStatus: "success",
        rawApiResponse: data // Incluir la respuesta completa para debugging
      }),
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
