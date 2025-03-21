
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, Diamond, Link as LinkIcon, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { Progress } from "@/components/ui/progress";

interface PlagiarismResultProps {
  percentage: number;
  sources: Source[];
  documentContent: string;
  analyzedContent: AnalyzedPart[];
}

interface Source {
  url: string;
  title: string;
  matchPercentage: number;
}

interface AnalyzedPart {
  text: string;
  isPlagiarized: boolean;
}

const PlagiarismResult = ({ percentage, sources, documentContent, analyzedContent }: PlagiarismResultProps) => {
  const { user, useCredit } = useAuth();
  const [detailedAnalysisUnlocked, setDetailedAnalysisUnlocked] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);

  // Determinar el color basado en el porcentaje
  const getColorClass = (percent: number) => {
    if (percent <= 20) return "text-success";
    if (percent <= 50) return "text-warning";
    return "text-danger";
  };

  // Determinar la descripción basada en el porcentaje
  const getDescription = (percent: number) => {
    if (percent <= 10) return "¡Excelente! Tu trabajo es altamente original.";
    if (percent <= 20) return "Buen trabajo. Tu documento muestra originalidad.";
    if (percent <= 30) return "Aceptable. Considera revisar algunas secciones.";
    if (percent <= 50) return "Atención. Deberías revisar varias secciones de tu trabajo.";
    return "¡Alerta! Tu trabajo contiene un alto porcentaje de plagio.";
  };

  // Desbloquear análisis detallado
  const unlockDetailedAnalysis = () => {
    if (user) {
      const success = useCredit();
      if (success) {
        setDetailedAnalysisUnlocked(true);
      }
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="grid gap-8 md:grid-cols-3">
        <div className="col-span-full md:col-span-1">
          <div className="glass-panel p-6 md:sticky md:top-24">
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
              
              <Button
                variant="default"
                className="w-full rounded-full"
                onClick={() => window.print()}
              >
                Descargar informe
              </Button>
            </div>
          </div>
        </div>
        
        <div className="col-span-full md:col-span-2 space-y-8">
          <div className="glass-panel p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <LinkIcon className="mr-2 h-5 w-5 text-primary" />
              Fuentes detectadas
            </h3>
            
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
              <p className="text-muted-foreground">No se detectaron fuentes con coincidencias significativas.</p>
            )}
          </div>
          
          <div className="glass-panel p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5 text-primary" />
                Análisis detallado
              </h3>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFullContent(!showFullContent)}
                className="text-xs"
              >
                {showFullContent ? "Mostrar menos" : "Mostrar todo"}
              </Button>
            </div>
            
            <div 
              className={`relative overflow-hidden transition-all duration-500 ${
                !detailedAnalysisUnlocked ? "blur-md select-none" : ""
              }`}
              style={{ maxHeight: showFullContent ? "none" : "300px" }}
            >
              {analyzedContent.map((part, index) => (
                <span
                  key={index}
                  className={part.isPlagiarized ? "text-danger" : "text-success"}
                >
                  {part.text}{" "}
                </span>
              ))}
              
              {!showFullContent && (
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />
              )}
            </div>
            
            {!detailedAnalysisUnlocked && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-10 p-6">
                <Diamond className="h-12 w-12 text-primary mb-4" />
                <h4 className="text-xl font-bold mb-2">Análisis detallado</h4>
                <p className="text-center text-muted-foreground mb-6 max-w-md">
                  Desbloquea el análisis completo para ver exactamente qué partes de tu documento requieren atención
                </p>
                
                {user ? (
                  user.credits > 0 || user.isPremium || user.isUnlimited ? (
                    <Button onClick={unlockDetailedAnalysis} variant="default" className="rounded-full">
                      <Diamond className="mr-2 h-4 w-4" />
                      Desbloquear por 1 crédito
                    </Button>
                  ) : (
                    <Link to="/premium">
                      <Button variant="default" className="rounded-full">
                        No tienes suficientes créditos
                      </Button>
                    </Link>
                  )
                ) : (
                  <p className="text-center text-muted-foreground">
                    <Link to="/login" className="text-primary hover:underline">
                      Inicia sesión
                    </Link>{" "}
                    para desbloquear
                  </p>
                )}
              </div>
            )}
          </div>
          
          <div className="glass-panel p-6">
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
        </div>
      </div>
    </div>
  );
};

export default PlagiarismResult;
