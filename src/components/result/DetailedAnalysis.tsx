
import { AlertTriangle, Diamond } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { AnalyzedContent } from "@/utils/plagiarismCheck";
import { User } from "@/context/AuthContext";

type DetailedAnalysisProps = {
  analyzedContent: AnalyzedContent[];
  detailedAnalysisUnlocked: boolean;
  setDetailedAnalysisUnlocked: (value: boolean) => void;
  user: User | null;
  useCredit: () => boolean;
  navigate: (path: string) => void;
};

const DetailedAnalysis = ({
  analyzedContent,
  detailedAnalysisUnlocked,
  setDetailedAnalysisUnlocked,
  user,
  useCredit,
  navigate
}: DetailedAnalysisProps) => {
  const [showFullContent, setShowFullContent] = useState(false);

  const unlockDetailedAnalysis = () => {
    if (user) {
      const success = useCredit();
      if (success) {
        setDetailedAnalysisUnlocked(true);
      }
    }
  };

  return (
    <div className="bg-white/50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-100 dark:border-slate-700 relative">
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
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-10 p-6 rounded-xl">
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
              <Button variant="default" className="rounded-full" onClick={() => navigate("/premium")}>
                No tienes suficientes créditos
              </Button>
            )
          ) : (
            <p className="text-center text-muted-foreground">
              <a 
                href="/login" 
                className="text-primary hover:underline"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/login");
                }}
              >
                Inicia sesión
              </a>{" "}
              para desbloquear
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default DetailedAnalysis;
