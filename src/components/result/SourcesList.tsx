
import { ExternalLink, LinkIcon, Search, AlertTriangle, Info } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { PlagiarismSource } from "@/utils/plagiarismCheck";
import { Button } from "@/components/ui/button";

type SourcesListProps = {
  sources: PlagiarismSource[];
  getColorClass: (percent: number) => string;
};

const SourcesList = ({ sources, getColorClass }: SourcesListProps) => {
  return (
    <div className="bg-white/50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-100 dark:border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold flex items-center">
          <LinkIcon className="mr-2 h-5 w-5 text-primary" />
          Fuentes detectadas (simuladas)
        </h3>
      </div>
      
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
        <div className="flex items-start">
          <Info className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2 mt-0.5" />
          <div>
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Las APIs externas han sido desactivadas. Las fuentes que se muestran a continuación son simuladas
              y no representan resultados reales de búsqueda en Internet.
            </p>
          </div>
        </div>
      </div>
      
      {sources.length > 0 ? (
        <div className="space-y-3">
          {sources.map((source, index) => (
            <SourceCard key={index} source={source} getColorClass={getColorClass} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8">
          <Search className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            No se han simulado fuentes para este documento.
          </p>
        </div>
      )}
    </div>
  );
};

// Component for individual source cards
const SourceCard = ({ source, getColorClass }: { source: PlagiarismSource, getColorClass: (percent: number) => string }) => {
  return (
    <div className="bg-secondary/30 p-4 rounded-lg">
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-medium">{source.title} <span className="text-xs text-muted-foreground">(simulado)</span></h4>
        <span className={`text-sm font-bold ${getColorClass(source.matchPercentage)}`}>
          {source.matchPercentage}%
        </span>
      </div>
      <div className="mb-2">
        <Progress value={source.matchPercentage} className="h-1" />
      </div>
      <div className="flex flex-col space-y-2">
        <span className="text-primary text-sm flex items-center">
          {source.url.length > 50
            ? `${source.url.substring(0, 50)}...`
            : source.url}
          <ExternalLink className="ml-1 h-3 w-3 text-muted-foreground" />
        </span>
        <span className="text-xs text-muted-foreground flex items-center">
          <span className="bg-secondary/70 px-2 py-0.5 rounded-full">Fuente simulada</span>
        </span>
      </div>
    </div>
  );
};

export default SourcesList;
