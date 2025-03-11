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

  // Group sources by engine type
  const googleSources = sources.filter(s => s.source?.includes("Google"));
  const deepseekSources = sources.filter(s => s.source?.includes("DeepSeek"));
  const openaiSources = sources.filter(s => s.source?.includes("OpenAI"));
  const wowinstonSources = sources.filter(s => s.source?.includes("Wowinston"));
  const detectingAiSources = sources.filter(s => s.source?.includes("Detecting-AI"));
  const otherSources = sources.filter(s => !s.source);

  return (
    <div className="bg-white/50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-100 dark:border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold flex items-center">
          <LinkIcon className="mr-2 h-5 w-5 text-primary" />
          Fuentes detectadas con múltiples APIs
        </h3>
        
        <div className="flex items-center text-xs text-muted-foreground">
          <Globe className="h-3 w-3 mr-1" />
          <span>4 APIs de detección de plagio</span>
        </div>
      </div>
      
      {!hasRealSources && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-4">
          <div className="flex items-start">
            <Globe className="h-5 w-5 text-green-600 dark:text-green-500 mr-2 mt-0.5" />
            <div>
              <p className="text-sm text-green-800 dark:text-green-200">
                Utilizando APIs reales: DeepSeek, OpenAI, Wowinston.AI y Detecting-AI para búsquedas en vivo.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {sources.length > 0 ? (
        <div className="space-y-6">
          {/* Google Scholar sources */}
          {googleSources.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2 text-blue-600 dark:text-blue-400">Fuentes académicas (Google Scholar)</h4>
              <div className="space-y-3">
                {googleSources.map((source, index) => (
                  <SourceCard key={`google-${index}`} source={source} getColorClass={getColorClass} />
                ))}
              </div>
            </div>
          )}
          
          {/* DeepSeek sources */}
          {deepseekSources.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2 text-purple-600 dark:text-purple-400">Fuentes de DeepSeek</h4>
              <div className="space-y-3">
                {deepseekSources.map((source, index) => (
                  <SourceCard key={`deepseek-${index}`} source={source} getColorClass={getColorClass} />
                ))}
              </div>
            </div>
          )}
          
          {/* OpenAI sources */}
          {openaiSources.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2 text-emerald-600 dark:text-emerald-400">Fuentes detectadas por OpenAI</h4>
              <div className="space-y-3">
                {openaiSources.map((source, index) => (
                  <SourceCard key={`openai-${index}`} source={source} getColorClass={getColorClass} />
                ))}
              </div>
            </div>
          )}
          
          {/* Wowinston.AI sources */}
          {wowinstonSources.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2 text-orange-600 dark:text-orange-400">Fuentes de Wowinston.AI</h4>
              <div className="space-y-3">
                {wowinstonSources.map((source, index) => (
                  <SourceCard key={`wowinston-${index}`} source={source} getColorClass={getColorClass} />
                ))}
              </div>
            </div>
          )}
          
          {/* Detecting-AI sources */}
          {detectingAiSources.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2 text-pink-600 dark:text-pink-400">Fuentes de Detecting-AI</h4>
              <div className="space-y-3">
                {detectingAiSources.map((source, index) => (
                  <SourceCard key={`detectingai-${index}`} source={source} getColorClass={getColorClass} />
                ))}
              </div>
            </div>
          )}
          
          {/* Other sources */}
          {otherSources.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2 text-gray-600 dark:text-gray-400">Otras fuentes detectadas</h4>
              <div className="space-y-3">
                {otherSources.map((source, index) => (
                  <SourceCard key={`other-${index}`} source={source} getColorClass={getColorClass} />
                ))}
              </div>
            </div>
          )}
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

// Component for individual source cards
const SourceCard = ({ source, getColorClass }: { source: PlagiarismSource, getColorClass: (percent: number) => string }) => {
  return (
    <div className="bg-secondary/30 p-4 rounded-lg">
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
  );
};

export default SourcesList;
