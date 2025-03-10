
import { ExternalLink, LinkIcon, Search } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { PlagiarismSource } from "@/utils/plagiarismCheck";

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
          Fuentes detectadas en internet
        </h3>
        
        <div className="flex items-center text-xs text-muted-foreground">
          <Search className="h-3 w-3 mr-1" />
          <span>Buscado en tiempo real</span>
        </div>
      </div>
      
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
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8">
          <Search className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            No se detectaron fuentes con coincidencias significativas en la web.
          </p>
        </div>
      )}
    </div>
  );
};

export default SourcesList;
