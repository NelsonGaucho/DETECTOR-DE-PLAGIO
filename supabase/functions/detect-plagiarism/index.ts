
// Main entry point for plagiarism detection service
// Enhanced version that focuses on Google and Google Scholar searches
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { corsHeaders } from "./utils/corsHeaders.ts";
import { handlePlagiarismDetection } from "./handlers/plagiarismHandler.ts";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    return await handlePlagiarismDetection(req);
  } catch (error) {
    console.error("[detect-plagiarism] Uncaught error in main handler:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Error interno del servidor", 
        details: error.message,
        note: "Ha ocurrido un error inesperado al procesar la solicitud."
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
