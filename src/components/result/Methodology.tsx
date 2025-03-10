
import { Clock } from "lucide-react";

const Methodology = () => {
  return (
    <div className="bg-white/50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-100 dark:border-slate-700">
      <h3 className="text-xl font-semibold mb-4 flex items-center">
        <Clock className="mr-2 h-5 w-5 text-primary" />
        Metodología de análisis
      </h3>
      
      <p className="text-muted-foreground mb-4">
        Nuestro algoritmo avanzado analiza tu documento en tiempo real comparándolo con millones de fuentes en internet:
      </p>
      
      <ol className="space-y-3 list-decimal list-inside text-muted-foreground">
        <li>Extracción de texto del documento subido</li>
        <li>División del contenido en segmentos analizables</li>
        <li>Búsqueda en tiempo real en motores de búsqueda especializados</li>
        <li>Comparación de coincidencias textuales con fuentes indexadas</li>
        <li>Verificación avanzada de similitud semántica</li>
        <li>Cálculo de porcentaje de originalidad</li>
      </ol>
    </div>
  );
};

export default Methodology;
