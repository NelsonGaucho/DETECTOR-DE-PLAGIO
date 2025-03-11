
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Crear cliente de Supabase usando variables de entorno
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Faltan las variables de entorno de Supabase");
    }

    // Crear el cliente con la clave de servicio para operaciones admin
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extraer token de autorización si existe
    const authHeader = req.headers.get('Authorization');
    let userId = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // Verificar el token y obtener el userId
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      
      if (user && !userError) {
        userId = user.id;
      }
    }

    // Obtener datos del análisis
    const { 
      documentName, 
      documentContent, 
      plagiarismPercentage, 
      sources,
      requestUserId  // El userId enviado desde el cliente como respaldo
    } = await req.json();

    // Usar el userId del token si existe, de lo contrario usar el proporcionado en la petición
    const finalUserId = userId || requestUserId;

    // Validar datos esenciales
    if (!documentName || typeof plagiarismPercentage !== 'number') {
      return new Response(
        JSON.stringify({ error: "Faltan datos requeridos" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Limitar el tamaño del contenido para evitar problemas con la BD
    const limitedContent = documentContent?.substring(0, 10000) || "";

    // Insertar en la base de datos
    const { data, error } = await supabase
      .from('plagiarism_checks')
      .insert({
        document_name: documentName,
        document_content: limitedContent,
        plagiarism_percentage: plagiarismPercentage,
        sources: sources || [],
        user_id: finalUserId
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error guardando el análisis:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
