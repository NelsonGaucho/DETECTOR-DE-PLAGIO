
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
    // Obtener las claves API de las variables de entorno
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    const deepseekApiKey = Deno.env.get("DEEPSEEK_API_KEY");
    const wowinstonApiKey = Deno.env.get("WOWINSTON_API_KEY");
    const detectingAiApiKey = Deno.env.get("DETECTINGAI_API_KEY");

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

    console.log("Texto recibido para análisis:", text.substring(0, 100) + "...");

    // Crear un array de promesas para las llamadas a las APIs
    const apiRequests = [];

    // 1. Llamada a OpenAI si la clave está configurada
    if (openaiApiKey) {
      apiRequests.push(
        fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${openaiApiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content: "Eres un asistente experto en detectar plagio. Analiza este texto y proporciona 3 posibles fuentes académicas o web de donde podría provenir (título, URL y un fragmento). Si no encuentras coincidencias, indica que parece original."
              },
              {
                role: "user",
                content: text.substring(0, 1000),
              },
            ],
            temperature: 0.3,
          }),
        })
        .then(async (res) => {
          const responseText = await res.text();
          try {
            return {
              source: "OpenAI",
              response: JSON.parse(responseText)
            };
          } catch (error) {
            console.error("Error al parsear respuesta de OpenAI:", error);
            return {
              source: "OpenAI",
              error: "Error al parsear JSON",
              rawResponse: responseText.substring(0, 500)
            };
          }
        })
        .catch(err => ({
          source: "OpenAI",
          error: err.message
        }))
      );
    }

    // 2. Llamada a DeepSeek si la clave está configurada
    if (deepseekApiKey) {
      apiRequests.push(
        fetch("https://api.deepseek.com/v1/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${deepseekApiKey}`,
          },
          body: JSON.stringify({
            query: text.substring(0, 1000),
            max_results: 5,
            search_depth: "comprehensive"
          }),
        })
        .then(async (res) => {
          const responseText = await res.text();
          try {
            return {
              source: "DeepSeek",
              response: JSON.parse(responseText)
            };
          } catch (error) {
            console.error("Error al parsear respuesta de DeepSeek:", error);
            return {
              source: "DeepSeek",
              error: "Error al parsear JSON",
              rawResponse: responseText.substring(0, 500)
            };
          }
        })
        .catch(err => ({
          source: "DeepSeek",
          error: err.message
        }))
      );
    }

    // 3. Llamada a Wowinston.AI si la clave está configurada
    if (wowinstonApiKey) {
      apiRequests.push(
        fetch("https://api.wowinston.ai/v1/plagiarism/check", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${wowinstonApiKey}`,
          },
          body: JSON.stringify({
            text: text.substring(0, 1000),
            language: "es",
            detail_level: "high"
          }),
        })
        .then(async (res) => {
          const responseText = await res.text();
          try {
            return {
              source: "Wowinston.AI",
              response: JSON.parse(responseText)
            };
          } catch (error) {
            console.error("Error al parsear respuesta de Wowinston:", error);
            return {
              source: "Wowinston.AI",
              error: "Error al parsear JSON",
              rawResponse: responseText.substring(0, 500)
            };
          }
        })
        .catch(err => ({
          source: "Wowinston.AI",
          error: err.message
        }))
      );
    }

    // 4. Llamada a Detecting-AI si la clave está configurada
    if (detectingAiApiKey) {
      apiRequests.push(
        fetch("https://api.detecting-ai.com/v1/plagiarism", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": detectingAiApiKey,
          },
          body: JSON.stringify({
            content: text.substring(0, 1000),
            search_depth: "full",
            include_sources: true
          }),
        })
        .then(async (res) => {
          const responseText = await res.text();
          try {
            // Intentar parsear como JSON
            return {
              source: "Detecting-AI",
              response: JSON.parse(responseText)
            };
          } catch (error) {
            // Si no es JSON, devolver la respuesta en crudo para diagnóstico
            console.error("Error al parsear respuesta de Detecting-AI:", error);
            console.error("Respuesta cruda:", responseText.substring(0, 300));
            
            // Verificar si parece ser HTML
            const isHtml = responseText.trim().startsWith("<!DOCTYPE") || 
                        responseText.trim().startsWith("<html") || 
                        responseText.trim().startsWith("<!doctype");
            
            return {
              source: "Detecting-AI",
              error: isHtml ? "La API devolvió HTML en lugar de JSON" : "Error al parsear JSON",
              rawResponse: responseText.substring(0, 500),
              isHtmlResponse: isHtml
            };
          }
        })
        .catch(err => ({
          source: "Detecting-AI",
          error: err.message
        }))
      );
    }

    // Ejecutar todas las solicitudes en paralelo con un timeout de 15 segundos
    const results = await Promise.allSettled(
      apiRequests.map(promise => 
        Promise.race([
          promise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 15000)
          )
        ])
      )
    );

    // Procesar y devolver los resultados
    const processedResults = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        const apis = ["OpenAI", "DeepSeek", "Wowinston.AI", "Detecting-AI"];
        const apiIndex = apiRequests.length > index ? index : 0;
        return {
          source: apis[apiIndex],
          error: result.reason?.message || "Error desconocido"
        };
      }
    });

    return new Response(
      JSON.stringify({ 
        timestamp: new Date().toISOString(),
        inputText: text.substring(0, 100) + "...",
        results: processedResults
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error("Error en función detect-plagiarism:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        note: "Ha ocurrido un error al procesar la solicitud."
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
