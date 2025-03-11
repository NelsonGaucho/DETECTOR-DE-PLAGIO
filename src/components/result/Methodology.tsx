
import { Server, Globe } from "lucide-react";

const Methodology = () => {
  return (
    <div className="bg-white/50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-100 dark:border-slate-700">
      <h3 className="text-xl font-semibold mb-4 flex items-center">
        <Server className="mr-2 h-5 w-5 text-primary" />
        Metodología de análisis
      </h3>
      
      <p className="text-muted-foreground mb-4">
        Nuestro sistema analiza tu documento en tiempo real utilizando una arquitectura modular con Edge Functions de Supabase para conectar con múltiples APIs:
      </p>
      
      <ol className="space-y-3 list-decimal list-inside text-muted-foreground">
        <li>Extracción de texto del documento subido</li>
        <li>División del contenido en segmentos analizables</li>
        <li>Procesamiento paralelo de búsquedas en múltiples motores</li>
        <li>Análisis avanzado con DeepSeek API</li>
        <li>Verificación semántica con OpenAI API</li>
        <li>Detección de fuentes con Wowinston.AI</li>
        <li>Análisis académico con Detecting-AI</li>
        <li>Combinación y deduplicación de resultados</li>
        <li>Almacenamiento seguro de análisis en base de datos</li>
        <li>Cálculo de porcentaje de originalidad utilizando datos consolidados</li>
      </ol>
      
      <div className="mt-4 p-3 bg-primary/10 rounded-lg">
        <p className="text-sm text-muted-foreground flex items-start">
          <Globe className="h-4 w-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
          <span>
            Este enfoque multi-API (DeepSeek, OpenAI, Wowinston.AI y Detecting-AI) garantiza una mayor precisión al contrastar el contenido con diversas 
            fuentes académicas, modelos de lenguaje especializados y bases de conocimiento, 
            utilizando una arquitectura optimizada y modular para mayor rendimiento.
          </span>
        </p>
      </div>
    </div>
  );
};

export default Methodology;
