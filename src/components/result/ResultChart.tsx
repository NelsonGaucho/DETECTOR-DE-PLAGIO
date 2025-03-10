
import { Diamond } from "lucide-react";

type ResultChartProps = {
  percentage: number;
  getColorClass: (percent: number) => string;
  getDescription: (percent: number) => string;
};

const ResultChart = ({ percentage, getColorClass, getDescription }: ResultChartProps) => {
  return (
    <div className="bg-white/50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-100 dark:border-slate-700 md:sticky md:top-24">
      <h2 className="text-2xl font-bold mb-4">Resultado</h2>
      
      <div className="flex items-center justify-center my-6">
        <div className="relative">
          <svg viewBox="0 0 100 100" className="w-32 h-32">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              className="text-muted/20"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              strokeDasharray={`${percentage * 2.83} 283`}
              strokeLinecap="round"
              className={`${getColorClass(percentage)} transform -rotate-90 origin-center`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-3xl font-bold ${getColorClass(percentage)}`}>
              {percentage}%
            </span>
          </div>
        </div>
      </div>
      
      <p className={`text-center font-medium mb-6 ${getColorClass(percentage)}`}>
        {getDescription(percentage)}
      </p>
      
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div className="bg-success bg-opacity-10 p-2 rounded-lg">
            <p className="text-success font-bold">0-20%</p>
            <p className="text-muted-foreground">Original</p>
          </div>
          <div className="bg-warning bg-opacity-10 p-2 rounded-lg">
            <p className="text-warning font-bold">21-50%</p>
            <p className="text-muted-foreground">Revisar</p>
          </div>
          <div className="bg-danger bg-opacity-10 p-2 rounded-lg">
            <p className="text-danger font-bold">+50%</p>
            <p className="text-muted-foreground">Plagio</p>
          </div>
        </div>
        
        <div className="bg-secondary/50 p-3 rounded-lg">
          <div className="flex items-center text-sm space-x-2 mb-2">
            <Globe className="h-4 w-4 text-primary" />
            <span className="font-medium">Análisis en tiempo real</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Búsqueda realizada en fuentes actualizadas de internet
          </p>
        </div>
        
        <Button
          variant="default"
          className="w-full rounded-full"
          onClick={() => window.print()}
        >
          Descargar informe
        </Button>
      </div>
    </div>
  );
};

export default ResultChart;
