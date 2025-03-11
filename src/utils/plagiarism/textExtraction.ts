
import { toast } from "sonner";
import * as pdfjs from 'pdfjs-dist';

// Inicializar PDF.js
const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.entry');
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

// Extracts text from files (PDF, DOCX, or plain text)
export const extractTextFromFile = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        let fileContent = "";
        
        // Procesar el archivo según su tipo
        if (file.type === "application/pdf") {
          fileContent = await extractTextFromPDF(e.target?.result as ArrayBuffer);
        } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
          fileContent = await extractTextFromDOCX(e.target?.result as ArrayBuffer);
        } else {
          // Para archivos de texto plano
          fileContent = e.target?.result as string || "";
        }
        
        resolve(fileContent);
      } catch (error) {
        console.error("Error processing content:", error);
        toast.error("Error al analizar el documento");
        reject(error);
      }
    };
    
    reader.onerror = (error) => {
      console.error("Error reading file:", error);
      toast.error("Error al leer el documento");
      reject(error);
    };
    
    // Leer el archivo según su tipo
    if (file.type === "application/pdf" || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  });
};

// Extrae texto de un PDF usando PDF.js
const extractTextFromPDF = async (arrayBuffer: ArrayBuffer): Promise<string> => {
  try {
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .filter((item: any) => 'str' in item)
        .map((item: any) => item.str)
        .join(" ");
      
      fullText += pageText + "\n\n";
    }
    
    return fullText;
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    toast.error("Error al extraer texto del PDF");
    throw error;
  }
};

// Extrae texto de un DOCX
const extractTextFromDOCX = async (arrayBuffer: ArrayBuffer): Promise<string> => {
  try {
    // Importar mammoth.js dinámicamente para extraer texto de DOCX
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  } catch (error) {
    console.error("Error extracting text from DOCX:", error);
    toast.error("Error al extraer texto del DOCX");
    throw error;
  }
};

// Extracts paragraphs from content more efficiently
export const extractParagraphs = (content: string): string[] => {
  // Dividir el contenido en párrafos y filtrar los que son demasiado cortos
  return content
    .split(/\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 40); // Solo considerar párrafos con cierta longitud
};

// Sanitize text (XSS prevention)
export const sanitizeText = (text: string): string => {
  return text
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .trim();
};
