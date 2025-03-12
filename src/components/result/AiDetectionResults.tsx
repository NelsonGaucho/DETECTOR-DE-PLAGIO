
import { useState } from "react";
import { Bot, ChevronDown, ChevronUp, Info, BarChart } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { AiAnalysisDetails } from "@/utils/plagiarism/types";

interface AiDetectionResultsProps {
  probability?: number;
  details?: AiAnalysisDetails;
  getColorClass: (percent: number) => string;
}

const AiDetectionResults = ({ 
  probability = 0, 
  details,
  getColorClass 
}: AiDetectionResultsProps) => {
  const [showDetails, setShowDetails] = useState(false);

  // Determine description based on probability
  const getAiDescription = (probability: number) => {
    if (probability <= 20) return "Altamente probable que sea contenido humano";
    if (probability <= 40) return "Probablemente contenido humano";
    if (probability <= 60) return "Contenido mixto o incierto";
    if (probability <= 80) return "Probablemente generado por IA";
    return "Altamente probable que sea generado por IA";
  };

  return (
    <div className="bg-white/50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-100 dark:border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold flex items-center">
          <Bot className="mr-2 h-5 w-5 text-primary" />
          Detección de contenido generado por IA
        </h3>
      </div>

      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-muted-foreground">Probabilidad de generación por IA</span>
          <span className={`font-bold text-lg ${getColorClass(probability)}`}>
            {probability}%
          </span>
        </div>
        <Progress value={probability} className="h-2 mb-2" />
        <p className={`text-sm ${getColorClass(probability)}`}>
          {getAiDescription(probability)}
        </p>
      </div>

      <Button
        variant="outline"
        className="w-full flex items-center justify-between"
        onClick={() => setShowDetails(!showDetails)}
      >
        <span>Ver detalles del análisis</span>
        {showDetails ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </Button>

      {showDetails && details && (
        <div className="mt-4 space-y-4 animate-in fade-in-50 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {details.entropy !== undefined && (
              <MetricCard
                title="Entropía"
                value={details.entropy.toFixed(2)}
                description="Medida de la aleatoriedad del texto. Valores más altos suelen indicar texto humano."
              />
            )}
            {details.rarityScore !== undefined && (
              <MetricCard
                title="Puntuación de rareza"
                value={details.rarityScore.toFixed(2)}
                description="Evalúa el uso de palabras poco comunes. IA tiende a usar términos más comunes."
              />
            )}
            {details.patternScore !== undefined && (
              <MetricCard
                title="Patrones detectados"
                value={details.patternScore.toFixed(2)}
                description="Patrones lingüísticos típicos de contenido generado por IA."
              />
            )}
            {details.confidenceScore !== undefined && (
              <MetricCard
                title="Confianza"
                value={`${(details.confidenceScore * 100).toFixed(0)}%`}
                description="Nivel de confianza del algoritmo en su predicción."
              />
            )}
          </div>

          {details.features && Object.keys(details.features).length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium mb-3 flex items-center">
                <BarChart className="h-4 w-4 mr-2 text-primary" />
                Análisis de características lingüísticas
              </h4>
              <div className="space-y-2">
                {Object.entries(details.features).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground capitalize">
                      {key.replace(/_/g, " ")}
                    </span>
                    <Progress
                      value={value * 100}
                      className="w-1/2 h-1.5"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {details.modelDetails && (
            <div className="mt-4 p-3 bg-secondary/30 rounded-lg">
              <p className="text-sm text-muted-foreground flex items-start">
                <Info className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                <span>
                  Método de detección: {details.modelDetails}
                </span>
              </p>
            </div>
          )}
        </div>
      )}
      
      {!details && showDetails && (
        <div className="mt-4 p-4 bg-secondary/30 rounded-lg text-center">
          <p className="text-muted-foreground">
            No hay detalles disponibles para este análisis.
          </p>
        </div>
      )}
    </div>
  );
};

const MetricCard = ({ 
  title, 
  value, 
  description 
}: { 
  title: string; 
  value: string; 
  description: string; 
}) => {
  return (
    <div className="bg-secondary/30 p-4 rounded-lg">
      <div className="flex justify-between items-center mb-1">
        <h5 className="font-medium text-sm">{title}</h5>
        <span className="font-bold">{value}</span>
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
};

export default AiDetectionResults;
