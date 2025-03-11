
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ArrowRight, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function TestAPI() {
  const [text, setText] = useState("Este es un texto de prueba para verificar la detección de plagio e IA.");
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTest = async () => {
    if (!text || text.trim().length < 10) {
      toast.error("Por favor, introduce un texto más largo para analizar");
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke("detect-plagiarism", {
        body: { text },
      });

      if (error) {
        console.error("Error al invocar detect-plagiarism:", error);
        setError(error.message || "Error al procesar la solicitud");
        toast.error("Error al procesar la solicitud");
      } else {
        setResults(data);
        console.log("Resultados:", data);
        toast.success("Análisis completado");
      }
    } catch (err: any) {
      console.error("Error inesperado:", err);
      setError(err.message || "Error inesperado");
      toast.error("Error inesperado al procesar la solicitud");
    } finally {
      setIsLoading(false);
    }
  };

  const formatResponse = (response: any) => {
    if (typeof response === 'object') {
      return <pre className="text-xs overflow-auto max-h-40 bg-slate-100 dark:bg-slate-800 p-2 rounded">
        {JSON.stringify(response, null, 2)}
      </pre>;
    }
    return <span>{String(response)}</span>;
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Test de APIs de Plagio</h1>
      
      <div className="grid gap-6 mb-6">
        <div>
          <label htmlFor="text" className="block text-sm font-medium mb-2">
            Texto a analizar
          </label>
          <Textarea
            id="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ingresa texto para analizar"
            className="min-h-32"
          />
        </div>
        
        <Button 
          onClick={handleTest} 
          disabled={isLoading}
          className="w-full sm:w-auto"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analizando...
            </>
          ) : (
            <>
              Probar APIs
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>

      {error && (
        <Card className="mb-6 border-red-300 bg-red-50 dark:bg-red-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-red-600 flex items-center">
              <AlertCircle className="mr-2 h-5 w-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      )}

      {results && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <Check className="mr-2 h-5 w-5 text-green-600" />
                Resultados
              </CardTitle>
              <CardDescription>
                Timestamp: {results.timestamp}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <strong>Texto analizado:</strong> {results.inputText}
              </div>
              
              <div className="space-y-4">
                {results.results.map((result: any, index: number) => (
                  <Card key={index} className="overflow-hidden">
                    <CardHeader className="pb-2 bg-slate-50 dark:bg-slate-800">
                      <CardTitle className="text-lg">
                        {result.source}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      {result.error ? (
                        <div className="text-red-600">
                          <AlertCircle className="inline-block mr-2 h-4 w-4" />
                          Error: {result.error}
                        </div>
                      ) : (
                        formatResponse(result.response)
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
