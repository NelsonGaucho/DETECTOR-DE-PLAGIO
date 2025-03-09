
import { useState } from "react";
import { ArrowRight, FileCheck, ShieldCheck, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import FileUploader from "@/components/FileUploader";
import { checkPlagiarism } from "@/utils/plagiarismCheck";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

// Guarda los resultados en sesión para poder mostrarlos en la página de resultados
export const savePlagiarismResult = (result: any) => {
  sessionStorage.setItem("plagiarismResult", JSON.stringify(result));
};

export const getPlagiarismResult = () => {
  const result = sessionStorage.getItem("plagiarismResult");
  return result ? JSON.parse(result) : null;
};

const Index = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  const handleFileSelected = async (file: File) => {
    try {
      setIsProcessing(true);
      
      // Mostrar toast de progreso
      toast.loading("Analizando documento...", {
        id: "processingFile",
        duration: 3000,
      });
      
      // Procesar el archivo
      const result = await checkPlagiarism(file);
      
      // Guardar el resultado
      savePlagiarismResult(result);
      
      // Redirigir a la página de resultados
      toast.success("Análisis completado", {
        id: "processingFile",
      });
      
      // Esperar un momento para que el usuario vea el toast de éxito
      setTimeout(() => {
        navigate("/resultado");
      }, 500);
    } catch (error) {
      console.error("Error al procesar el archivo:", error);
      toast.error("Error al procesar el archivo", {
        id: "processingFile",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16 animate-fade-in">
            <h1 className="heading-xl mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Detector de Plagio para tu Proyecto
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
              La herramienta perfecta para revisar el plagio de tu TFG, TFM o cualquiera de tus proyectos académicos.
            </p>
            <Button 
              size="lg" 
              className="rounded-full group transition-all duration-300 hover:pr-7"
              onClick={() => {
                const fileUploaderSection = document.getElementById("file-uploader");
                fileUploaderSection?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Comprobar mi documento
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
          
          {/* Características */}
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="bg-white/50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-100 dark:border-slate-700 transition-all duration-300 hover:shadow-md">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <FileCheck className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Análisis Preciso</h3>
              <p className="text-muted-foreground">
                Escaneamos tu documento palabra por palabra y lo comparamos con miles de fuentes en la web.
              </p>
            </div>
            <div className="bg-white/50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-100 dark:border-slate-700 transition-all duration-300 hover:shadow-md">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">100% Seguro</h3>
              <p className="text-muted-foreground">
                Tu documento es eliminado después del análisis. No almacenamos ni compartimos tus datos.
              </p>
            </div>
            <div className="bg-white/50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-100 dark:border-slate-700 transition-all duration-300 hover:shadow-md">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Informe Detallado</h3>
              <p className="text-muted-foreground">
                Recibe un informe completo con fuentes detectadas y recomendaciones para mejorar.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* File Upload Section */}
      <section id="file-uploader" className="py-20 px-4 bg-slate-50 dark:bg-slate-800/50">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="heading-lg mb-4">
              Comprueba tu documento
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Sube tu documento en formato PDF o Word y recibe un análisis detallado del nivel de originalidad.
            </p>
          </div>
          
          <FileUploader onFileSelected={handleFileSelected} />
        </div>
      </section>
      
      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <h2 className="heading-lg text-center mb-16">
            Cómo funciona
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center mx-auto mb-6 text-xl font-bold">1</div>
              <h3 className="text-xl font-semibold mb-3">Sube tu documento</h3>
              <p className="text-muted-foreground">
                Arrastra y suelta tu archivo PDF o Word en nuestra plataforma.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center mx-auto mb-6 text-xl font-bold">2</div>
              <h3 className="text-xl font-semibold mb-3">Análisis automático</h3>
              <p className="text-muted-foreground">
                Nuestro algoritmo escanea tu documento y lo compara con fuentes en línea.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center mx-auto mb-6 text-xl font-bold">3</div>
              <h3 className="text-xl font-semibold mb-3">Recibe tu informe</h3>
              <p className="text-muted-foreground">
                Obtén un informe detallado con porcentaje de plagio y recomendaciones.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/5 dark:to-slate-900/70">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="heading-lg mb-6">
            ¿Listo para comprobar tu documento?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Asegúrate de que tu trabajo académico es original y evita problemas de plagio.
          </p>
          <Button 
            size="lg" 
            className="rounded-full group transition-all duration-300 hover:pr-7"
            onClick={() => {
              const fileUploaderSection = document.getElementById("file-uploader");
              fileUploaderSection?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Comprobar ahora
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
