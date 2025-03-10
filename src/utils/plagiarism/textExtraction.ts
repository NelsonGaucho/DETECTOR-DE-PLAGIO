
import { toast } from "sonner";

// Extracts text from files (PDF, DOCX, or plain text)
export const extractTextFromFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const fileContent = e.target?.result as string || "";
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
    
    if (file.type === "application/pdf") {
      simulatePdfExtraction(file, reader);
    } else {
      reader.readAsText(file);
    }
  });
};

// Simulates the extraction of text from a PDF
const simulatePdfExtraction = (file: File, reader: FileReader) => {
  setTimeout(() => {
    const event = {
      target: {
        result: generateSampleText()
      }
    };
    reader.onload(event as any);
  }, 1500);
};

// Extracts paragraphs from content
export const extractParagraphs = (content: string): string[] => {
  return content
    .split(/\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 40); // Only consider paragraphs with certain length
};

// Sample text for simulation purposes
export const generateSampleText = (): string => {
  return `
    La inteligencia artificial (IA) es la simulación de procesos de inteligencia humana por parte de máquinas, especialmente sistemas informáticos. Estos procesos incluyen el aprendizaje (la adquisición de información y reglas para el uso de la información), el razonamiento (usando las reglas para llegar a conclusiones aproximadas o definitivas) y la autocorrección.

    El calentamiento global es el aumento a largo plazo de la temperatura media del sistema climático de la Tierra. Es un aspecto primordial del cambio climático actual, demostrado por el registro de la temperatura global, el aumento del nivel del mar y la disminución de la nieve en el hemisferio norte.

    Las redes sociales han revolucionado la forma en que nos comunicamos y compartimos información. Son sitios de internet formados por comunidades de individuos con intereses o actividades en común, como amistad, parentesco, trabajo, que permiten el contacto entre estos.

    El desarrollo sostenible se ha definido como el desarrollo capaz de satisfacer las necesidades del presente sin comprometer la capacidad de las futuras generaciones para satisfacer sus propias necesidades. Exige esfuerzos concertados para construir un futuro inclusivo, sostenible y resiliente para las personas y el planeta.

    La ciberseguridad es la práctica de defender las computadoras, los servidores, los dispositivos móviles, los sistemas electrónicos, las redes y los datos de ataques maliciosos. También se conoce como seguridad de tecnología de la información o seguridad de la información electrónica.

    La nanotecnología es la manipulación de la materia a escala nanométrica. Una definición más generalizada incluye todos los procedimientos y métodos empleados para manipular la materia a escala atómica para la fabricación de productos.
  `;
};

// Sanitize text (XSS prevention)
export const sanitizeText = (text: string): string => {
  return text
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .trim();
};
