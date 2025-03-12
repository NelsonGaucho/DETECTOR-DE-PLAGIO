
import { Server, Info } from "lucide-react";

const Methodology = () => {
  return (
    <div className="bg-white/50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-100 dark:border-slate-700">
      <h3 className="text-xl font-semibold mb-4 flex items-center">
        <Server className="mr-2 h-5 w-5 text-primary" />
        Metodología de análisis
      </h3>
      
      <p className="text-muted-foreground mb-4">
        El sistema actual utiliza un enfoque de simulación para el análisis de plagios:
      </p>
      
      <ol className="space-y-3 list-decimal list-inside text-muted-foreground">
        <li>Extracción de texto del documento subido</li>
        <li>División del contenido en segmentos analizables</li>
        <li>Simulación de búsquedas de coincidencias</li>
        <li>Generación de resultados basados en algoritmos locales</li>
        <li>Cálculo de porcentaje de originalidad simulado</li>
      </ol>
      
      <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <p className="text-sm text-yellow-800 dark:text-yellow-200 flex items-start">
          <Info className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mr-2 mt-0.5 flex-shrink-0" />
          <span>
            Nota: Las APIs externas han sido desactivadas por solicitud del usuario. 
            El sistema ahora utiliza simulaciones locales sin realizar consultas a servicios de terceros.
          </span>
        </p>
      </div>
    </div>
  );
};

export default Methodology;
