
import { CheckCircle } from "lucide-react";

const Recommendations = () => {
  return (
    <div className="bg-white/50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-100 dark:border-slate-700">
      <h3 className="text-xl font-semibold mb-4 flex items-center">
        <CheckCircle className="mr-2 h-5 w-5 text-primary" />
        Recomendaciones
      </h3>
      
      <ul className="space-y-3 list-disc list-inside text-muted-foreground">
        <li>Reformula las partes marcadas en rojo usando tus propias palabras</li>
        <li>Añade citas adecuadas para las ideas que no son tuyas</li>
        <li>Incluye todas las fuentes en tu bibliografía</li>
        <li>Usa herramientas de parafraseo para mejorar la originalidad</li>
        <li>Revisa la estructura y organización de tu documento</li>
      </ul>
    </div>
  );
};

export default Recommendations;
