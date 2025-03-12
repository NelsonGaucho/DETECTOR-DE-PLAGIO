
import { Server, Info, Database, Search, Code } from "lucide-react";

const Methodology = () => {
  return (
    <div className="bg-white/50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-100 dark:border-slate-700">
      <h3 className="text-xl font-semibold mb-4 flex items-center">
        <Server className="mr-2 h-5 w-5 text-primary" />
        Metodología de análisis
      </h3>
      
      <p className="text-muted-foreground mb-4">
        El sistema utiliza técnicas de búsqueda en Internet para un análisis completo:
      </p>
      
      <div className="space-y-6">
        <div>
          <h4 className="font-medium flex items-center mb-2">
            <Search className="mr-2 h-4 w-4 text-primary" />
            Detección de plagio
          </h4>
          <ol className="space-y-2 list-decimal list-inside text-muted-foreground ml-2">
            <li>Extracción de texto del documento subido</li>
            <li>Búsqueda de fragmentos en Google y Google Scholar</li>
            <li>Scraping de contenido para comparación detallada</li>
            <li>Algoritmos de similitud (Jaccard, Levenshtein, Cosine)</li>
            <li>Cálculo de percentiles y generación de informe</li>
          </ol>
        </div>
        
        <div>
          <h4 className="font-medium flex items-center mb-2">
            <Code className="mr-2 h-4 w-4 text-primary" />
            Detección de IA
          </h4>
          <ol className="space-y-2 list-decimal list-inside text-muted-foreground ml-2">
            <li>Análisis estadístico de patrones lingüísticos</li>
            <li>Evaluación de entropía y distribución de palabras</li>
            <li>Detección de palabras clave y estructuras típicas de IA</li>
            <li>Heurísticas basadas en investigación académica actual</li>
            <li>Asignación de probabilidad de generación por IA</li>
          </ol>
        </div>
        
        <div>
          <h4 className="font-medium flex items-center mb-2">
            <Database className="mr-2 h-4 w-4 text-primary" />
            Fuentes consultadas
          </h4>
          <ul className="space-y-2 list-disc list-inside text-muted-foreground ml-2">
            <li>Google Search: Búsqueda general en Internet</li>
            <li>Google Scholar: Artículos científicos y académicos</li>
            <li>Algoritmos de análisis de similitud de texto</li>
            <li>Métodos de comparación de texto optimizados</li>
          </ul>
        </div>
      </div>
      
      <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200 flex items-start">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
          <span>
            Este sistema utiliza técnicas de scraping web para buscar en fuentes públicas.
            La precisión puede variar dependiendo de la disponibilidad de las fuentes y 
            las restricciones de los motores de búsqueda.
          </span>
        </p>
      </div>
    </div>
  );
};

export default Methodology;
