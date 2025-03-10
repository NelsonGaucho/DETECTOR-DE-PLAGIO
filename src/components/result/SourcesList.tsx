
import { ExternalLink, LinkIcon, Search, AlertTriangle, Globe } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { PlagiarismSource } from "@/utils/plagiarismCheck";
import { Button } from "@/components/ui/button";

type SourcesListProps = {
  sources: PlagiarismSource[];
  getColorClass: (percent: number) => string;
};

const SourcesList = ({ sources, getColorClass }: SourcesListProps) => {
  const hasRealSources = sources.length > 0 && 
    !sources[0].url.includes("ejemplo.com/aviso-api");

  return (
    <div className="bg-white/50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-100 dark:border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold flex items-center">
          <LinkIcon className="mr-2 h-5 w-5 text-primary" />
          Fuentes detectadas con múltiples APIs
        </h3>
        
        <div className="flex items-center text-xs text-muted-foreground">
          <Globe className="h-3 w-3 mr-1" />
          <span>Google + DeepSeek-R1 + OpenAI</span>
        </div>
      </div>
      
      {!hasRealSources && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mr-2 mt-0.5" />
            <div>
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Para obtener fuentes reales se necesita configurar las APIs de Google, DeepSeek-R1 y OpenAI.
                Actualmente se muestran resultados basados en patrones de coincidencia simulados.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {sources.length > 0 ? (
        <div className="space-y-4">
          {sources.map((source, index) => (
            <div key={index} className="bg-secondary/30 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium">{source.title}</h4>
                <span className={`text-sm font-bold ${getColorClass(source.matchPercentage)}`}>
                  {source.matchPercentage}%
                </span>
              </div>
              <div className="mb-2">
                <Progress value={source.matchPercentage} className="h-1" />
              </div>
              <div className="flex flex-col space-y-2">
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary text-sm flex items-center hover:underline"
                >
                  {source.url.length > 50
                    ? `${source.url.substring(0, 50)}...`
                    : source.url}
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
                {source.source && (
                  <span className="text-xs text-muted-foreground flex items-center">
                    <span className="bg-secondary/70 px-2 py-0.5 rounded-full">{source.source}</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8">
          <Search className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            No se detectaron fuentes con coincidencias significativas en ninguna de las APIs.
          </p>
        </div>
      )}
    </div>
  );
};

export default SourcesList;
