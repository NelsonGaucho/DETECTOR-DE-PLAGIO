
import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { Upload, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface FileUploaderProps {
  onFileSelected: (file: File) => Promise<void>;
}

const FileUploader = ({ onFileSelected }: FileUploaderProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    // Validación del tipo de archivo (PDF y DOCX)
    const allowedTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Solo se permiten archivos PDF o DOCX");
      return;
    }
    
    // Validación del tamaño (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error("El archivo no puede superar los 10MB");
      return;
    }
    
    setSelectedFile(file);
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;
    
    try {
      setIsUploading(true);
      await onFileSelected(selectedFile);
      // No need to navigate here as it's handled in the Index component
    } catch (error) {
      console.error("Error processing file:", error);
      toast.error("Error al procesar el archivo");
    } finally {
      setIsUploading(false);
    }
  };

  const openFileBrowser = () => {
    inputRef.current?.click();
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className={`${
          dragActive ? "drop-area-active" : "drop-area"
        } flex flex-col items-center justify-center transition-all duration-300`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".pdf,.docx"
          onChange={handleChange}
        />
        
        <div className="mb-6 p-4 rounded-full bg-primary/10 text-primary">
          <Upload
            size={36}
            strokeWidth={1.5}
            className={dragActive ? "animate-pulse" : ""}
          />
        </div>
        
        <h3 className="text-xl font-semibold mb-2">
          Arrastra y suelta tu documento aquí
        </h3>
        
        <p className="text-muted-foreground mb-6 text-center max-w-md">
          Formatos aceptados: PDF, DOCX (Máx. 10MB)
        </p>
        
        <Button
          variant="default"
          onClick={openFileBrowser}
          className="rounded-full"
        >
          <FileText className="mr-2 h-5 w-5" />
          Seleccionar archivo
        </Button>
        
        <div className="mt-6 p-4 bg-secondary/50 rounded-lg">
          <p className="flex items-center text-xs text-muted-foreground">
            <AlertCircle className="h-4 w-4 mr-2" />
            No almacenamos los datos subidos ni los vendemos a ninguna plataforma externa. Los datos se eliminan una vez terminada la consulta.
          </p>
        </div>
      </div>

      {selectedFile && (
        <div className="mt-6 p-4 bg-secondary rounded-lg animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FileText className="mr-2 h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>
            <Button
              variant="default"
              onClick={handleSubmit}
              disabled={isUploading}
              className="rounded-full"
            >
              {isUploading ? "Procesando..." : "Analizar"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
