
import { Clock } from "lucide-react";

const Methodology = () => {
  return (
    <div className="bg-white/50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-100 dark:border-slate-700">
      <h3 className="text-xl font-semibold mb-4 flex items-center">
        <Clock className="mr-2 h-5 w-5 text-primary" />
        Metodología de análisis
      </h3>
      
      <p className="text-muted-foreground mb-4">
        Nuestro algoritmo avanzado analiza tu documento en tiempo real comparándolo con múltiples fuentes usando diversas APIs:
      </p>
      
      <ol className="space-y-3 list-decimal list-inside text-muted-foreground">
        <li>Extracción de texto del documento subido</li>
        <li>División del contenido en segmentos analizables</li>
        <li>Búsqueda en tiempo real con Google Scholar mediante SerpAPI</li>
        <li>Análisis semántico con DeepSeek API</li>
        <li>Verificación cruzada con OpenAI API (embeddings y chat completions)</li>
        <li>Combinación de resultados de múltiples motores</li>
        <li>Cálculo de porcentaje de originalidad utilizando datos consolidados</li>
      </ol>
      
      <div className="mt-4 p-3 bg-primary/10 rounded-lg">
        <p className="text-sm text-muted-foreground">
          Este enfoque multi-API garantiza una mayor precisión al contrastar el contenido con diversas fuentes de 
          búsqueda académicas, bases de conocimiento y modelos de lenguaje especializados, reduciendo falsos positivos y negativos.
        </p>
      </div>
    </div>
  );
};

export default Methodology;
