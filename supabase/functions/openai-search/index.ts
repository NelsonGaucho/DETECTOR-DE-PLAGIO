
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
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      throw new Error("OPENAI_API_KEY no está configurada");
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

    // 1. Obtener embedding para el texto
    const embeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "text-embedding-ada-002",
        input: text.substring(0, 1000), // Limitar el tamaño para evitar tokens excesivos
      }),
    });

    if (!embeddingResponse.ok) {
      const error = await embeddingResponse.json();
      throw new Error(`Error de OpenAI Embedding: ${JSON.stringify(error)}`);
    }

    // 2. Usar Chat Completions para analizar el texto
    const completionResponse = await fetch("https://api.openai.com/v1/chat/completions", {
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
    });

    if (!completionResponse.ok) {
      const error = await completionResponse.json();
      throw new Error(`Error de OpenAI Chat: ${JSON.stringify(error)}`);
    }

    const completionData = await completionResponse.json();
    const aiSuggestion = completionData.choices[0].message.content;

    // Extraer posibles URLs del texto generado
    const urlRegex = /(?:https?:\/\/[^\s]+)|(?:www\.[^\s]+)/g;
    const urls = aiSuggestion.match(urlRegex) || [];

    // Crear fuentes basadas en la respuesta de la IA
    const sources = urls.map((url, index) => {
      // Extraer un posible título cerca de la URL
      const surroundingText = aiSuggestion.substring(
        Math.max(0, aiSuggestion.indexOf(url) - 100),
        Math.min(aiSuggestion.length, aiSuggestion.indexOf(url) + 100)
      );
      
      const titleMatch = surroundingText.match(/["'](.*?)["']/);
      const title = titleMatch ? titleMatch[1] : `Fuente OpenAI ${index + 1}`;
      
      return {
        url: url.startsWith('http') ? url : `https://${url}`,
        title: title,
        matchPercentage: 70 - (index * 10), // Reducir por orden de aparición
        text: surroundingText.replace(/["'](.*?)["']/, '').trim(),
        source: "OpenAI"
      };
    });

    // Guardar también el análisis completo para referencia
    return new Response(
      JSON.stringify({ 
        matches: sources,
        aiAnalysis: aiSuggestion 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error en función OpenAI:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
