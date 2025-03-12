
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPlagiarismResult } from "./Index";
import { PlagiarismResult } from "@/utils/plagiarismCheck";
import { useAuth } from "@/context/AuthContext";
import ResultChart from "@/components/result/ResultChart";
import SourcesList from "@/components/result/SourcesList";
import DetailedAnalysis from "@/components/result/DetailedAnalysis";
import Recommendations from "@/components/result/Recommendations";
import Methodology from "@/components/result/Methodology";
import AiDetectionResults from "@/components/result/AiDetectionResults";

const ResultPage = () => {
  const [result, setResult] = useState<PlagiarismResult | null>(null);
  const [rawResponse, setRawResponse] = useState<any>(null);
  const [detailedAnalysisUnlocked, setDetailedAnalysisUnlocked] = useState(false);
  const navigate = useNavigate();
  const { user, useCredit } = useAuth();

  useEffect(() => {
    console.log("ResultPage: Intentando cargar resultado almacenado...");
    const storedResult = getPlagiarismResult();
    if (!storedResult) {
      console.log("ResultPage: No se encontró ningún resultado almacenado");
      navigate("/");
      return;
    }
    console.log("ResultPage: Resultado cargado correctamente:", storedResult);
    setResult(storedResult);
    
    // Extraer la respuesta sin procesar si existe
    if (storedResult.rawResponses && storedResult.rawResponses.length > 0) {
      console.log("ResultPage: Respuesta sin procesar encontrada:", storedResult.rawResponses[0]);
      setRawResponse(storedResult.rawResponses[0]);
    }
  }, [navigate]);

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

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Cargando resultados...</p>
      </div>
    );
  }

  console.log("ResultPage: Renderizando resultado:", result);

  return (
    <div className="min-h-screen py-32 px-4">
      <div className="w-full max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Resultados del Análisis</h1>
        
        {/* Mostrar la respuesta sin procesar si existe */}
        {rawResponse && (
          <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-xl mb-8 overflow-auto">
            <h2 className="text-xl font-semibold mb-4">Respuesta del análisis:</h2>
            <pre className="whitespace-pre-wrap break-words text-sm">
              {JSON.stringify(rawResponse.rawResponse, null, 2)}
            </pre>
          </div>
        )}
        
        <div className="grid gap-8 md:grid-cols-3">
          <div className="col-span-full md:col-span-1">
            <ResultChart 
              percentage={result.percentage}
              getColorClass={getColorClass}
              getDescription={getDescription}
            />
          </div>
          
          <div className="col-span-full md:col-span-2 space-y-8">
            <SourcesList 
              sources={result.sources}
              getColorClass={getColorClass}
            />
            
            {/* Resultados de la detección de IA */}
            <AiDetectionResults
              probability={result.aiGeneratedProbability}
              details={result.aiAnalysisDetails}
              getColorClass={getColorClass}
            />
            
            <DetailedAnalysis
              analyzedContent={result.analyzedContent}
              detailedAnalysisUnlocked={detailedAnalysisUnlocked}
              setDetailedAnalysisUnlocked={setDetailedAnalysisUnlocked}
              user={user}
              useCredit={useCredit}
              navigate={navigate}
            />
            
            <Recommendations />
            
            <Methodology />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultPage;
