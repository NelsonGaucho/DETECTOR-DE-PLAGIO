
// Este archivo simula la lógica de detección de plagio
// En una implementación real, esto se conectaría a una API o servicio

import { toast } from "sonner";

export interface PlagiarismResult {
  percentage: number;
  sources: Source[];
  documentContent: string;
  analyzedContent: AnalyzedPart[];
}

export interface Source {
  url: string;
  title: string;
  matchPercentage: number;
}

export interface AnalyzedPart {
  text: string;
  isPlagiarized: boolean;
}

// Simula la lógica de detección de plagio
export const checkPlagiarism = async (file: File): Promise<PlagiarismResult> => {
  return new Promise((resolve) => {
    // Simulamos un tiempo de procesamiento
    setTimeout(() => {
      try {
        // Generar un porcentaje aleatorio de plagio
        const percentage = Math.floor(Math.random() * 70);
        
        // Generar fuentes aleatorias basadas en el porcentaje
        const numSources = Math.ceil(percentage / 10);
        const sources = generateRandomSources(numSources);
        
        // Contenido del documento (en un caso real, se extraería del archivo)
        const documentContent = generateMockDocumentContent();
        
        // Generar análisis detallado
        const analyzedContent = generateAnalyzedContent(documentContent, percentage);
        
        resolve({
          percentage,
          sources,
          documentContent,
          analyzedContent
        });
      } catch (error) {
        console.error("Error processing document:", error);
        toast.error("Error al procesar el documento");
        
        // Devolver datos por defecto en caso de error
        resolve({
          percentage: 0,
          sources: [],
          documentContent: "",
          analyzedContent: []
        });
      }
    }, 3000); // Simula un tiempo de procesamiento de 3 segundos
  });
};

// Función para sanitizar texto (en una implementación real, sería más completa)
export const sanitizeText = (text: string): string => {
  return text
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .trim();
};

// Funciones auxiliares para generar datos de ejemplo
function generateRandomSources(count: number): Source[] {
  const sources: Source[] = [];
  const domains = [
    "wikipedia.org",
    "sciencedirect.com",
    "researchgate.net",
    "academia.edu",
    "springer.com",
    "ieee.org",
    "jstor.org"
  ];
  
  const titles = [
    "Introducción a la Inteligencia Artificial",
    "Metodologías ágiles en el desarrollo de software",
    "El impacto de las redes sociales en la sociedad moderna",
    "Cambio climático: causas y consecuencias",
    "Historia y evolución de Internet",
    "Big Data y su aplicación en la medicina",
    "Ciberseguridad en la era digital"
  ];
  
  for (let i = 0; i < count; i++) {
    const domainIndex = Math.floor(Math.random() * domains.length);
    const titleIndex = Math.floor(Math.random() * titles.length);
    const matchPercentage = Math.floor(Math.random() * 30) + 5;
    
    sources.push({
      url: `https://www.${domains[domainIndex]}/article/${Math.floor(Math.random() * 10000)}`,
      title: titles[titleIndex],
      matchPercentage
    });
  }
  
  return sources.sort((a, b) => b.matchPercentage - a.matchPercentage);
}

function generateMockDocumentContent(): string {
  return `
    La inteligencia artificial (IA) es la simulación de procesos de inteligencia humana por parte de máquinas, especialmente sistemas informáticos. Estos procesos incluyen el aprendizaje (la adquisición de información y reglas para el uso de la información), el razonamiento (usando las reglas para llegar a conclusiones aproximadas o definitivas) y la autocorrección.

    El aprendizaje automático es una aplicación de la inteligencia artificial que proporciona a los sistemas la capacidad de aprender y mejorar automáticamente a partir de la experiencia sin ser programados explícitamente. El aprendizaje automático se centra en el desarrollo de programas informáticos que pueden acceder a los datos y utilizarlos para aprender por sí mismos.

    El proceso de aprendizaje comienza con observaciones o datos, como ejemplos, experiencia directa o instrucción, para buscar patrones en los datos y tomar mejores decisiones en el futuro en base a los ejemplos que proporcionamos. El objetivo principal es permitir que las computadoras aprendan automáticamente sin intervención o asistencia humana y ajustar las acciones en consecuencia.

    Las redes neuronales artificiales (RNA) son un modelo computacional vagamente inspirado en el comportamiento observado en su homólogo biológico. Consiste en un conjunto de unidades, llamadas neuronas artificiales, conectadas entre sí para transmitirse señales. La información de entrada atraviesa la red neuronal (donde se somete a diversas operaciones) produciendo unos valores de salida.

    El deep learning o aprendizaje profundo es parte del aprendizaje automático basado en conjuntos de algoritmos que intentan modelar abstracciones de alto nivel en datos usando arquitecturas computacionales que admiten transformaciones no lineales múltiples e iterativas de datos expresados en forma matricial o tensorial.

    El procesamiento del lenguaje natural (PLN) es un campo de la inteligencia artificial que estudia las interacciones entre las computadoras y el lenguaje humano, en particular cómo programar computadoras para procesar y analizar grandes cantidades de datos del lenguaje natural.

    La visión por computador es un campo de la inteligencia artificial que entrena a las computadoras para interpretar y comprender el mundo visual. Utilizando imágenes digitales de cámaras y videos e imágenes profundas, las máquinas pueden identificar y clasificar objetos con precisión.
  `;
}

function generateAnalyzedContent(content: string, plagiarismPercentage: number): AnalyzedPart[] {
  const words = content.split(/\s+/);
  const analyzedContent: AnalyzedPart[] = [];
  let currentPart: AnalyzedPart = { text: "", isPlagiarized: false };
  
  // Calculamos aproximadamente cuántas palabras deberían estar plagadas
  const plagiarizedWordsCount = Math.floor(words.length * (plagiarismPercentage / 100));
  
  // Creamos algunos segmentos aleatorios que se marcarán como plagiados
  const segmentCount = Math.floor(plagiarismPercentage / 10) + 1;
  const segmentSize = Math.floor(plagiarizedWordsCount / segmentCount);
  
  const plagiarizedSegments: [number, number][] = [];
  for (let i = 0; i < segmentCount; i++) {
    const start = Math.floor(Math.random() * (words.length - segmentSize));
    plagiarizedSegments.push([start, start + segmentSize]);
  }
  
  // Recorremos cada palabra y determinamos si está en un segmento plagado
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const isPlagiarized = plagiarizedSegments.some(([start, end]) => i >= start && i < end);
    
    if (isPlagiarized !== currentPart.isPlagiarized) {
      if (currentPart.text) {
        analyzedContent.push(currentPart);
      }
      currentPart = { text: word, isPlagiarized };
    } else {
      currentPart.text += " " + word;
    }
  }
  
  // Añadir la última parte
  if (currentPart.text) {
    analyzedContent.push(currentPart);
  }
  
  return analyzedContent;
}
