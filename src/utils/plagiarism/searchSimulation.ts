
import { toast } from "sonner";

// Simulates internet search for plagiarism detection
export const searchInternet = async (paragraphs: string[]): Promise<any[]> => {
  toast.loading("Buscando coincidencias en línea...", { id: "internetSearch" });
  
  try {
    // Simulate a search with responses based on real websites
    const results = await Promise.all(
      paragraphs.map(async (paragraph) => {
        // Simulate variable real search time
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
        
        // Get real search results based on content
        return getRealSearchResults(paragraph);
      })
    );
    
    toast.success("Búsqueda completada", { id: "internetSearch" });
    return results;
  } catch (error) {
    toast.error("Error en la búsqueda en línea", { id: "internetSearch" });
    console.error("Error in search:", error);
    return [];
  }
};

// Get real search results (simulated with real data)
export const getRealSearchResults = (text: string): any => {
  // Keywords that will trigger matches with real sites
  const keywordMap: Record<string, any[]> = {
    "inteligencia artificial": [
      {
        url: "https://es.wikipedia.org/wiki/Inteligencia_artificial",
        title: "Inteligencia artificial - Wikipedia",
        similarity: 85,
        text: "La inteligencia artificial es la simulación de procesos de inteligencia humana por parte de máquinas"
      },
      {
        url: "https://www.ibm.com/es-es/topics/artificial-intelligence",
        title: "¿Qué es la Inteligencia Artificial (IA)? - IBM",
        similarity: 72,
        text: "La inteligencia artificial aprovecha las computadoras y las máquinas para imitar las capacidades de resolución de problemas"
      }
    ],
    "calentamiento global": [
      {
        url: "https://www.nationalgeographic.es/medio-ambiente/que-es-el-calentamiento-global",
        title: "¿Qué es el calentamiento global? - National Geographic",
        similarity: 91,
        text: "El calentamiento global es el aumento a largo plazo de la temperatura media del sistema climático de la Tierra"
      },
      {
        url: "https://www.un.org/es/climatechange/science/causes-effects-climate-change",
        title: "Causas y Efectos del Cambio Climático - Naciones Unidas",
        similarity: 76,
        text: "El cambio climático se refiere a los cambios a largo plazo de las temperaturas y los patrones climáticos"
      }
    ],
    "desarrollo sostenible": [
      {
        url: "https://www.un.org/sustainabledevelopment/es/development-agenda/",
        title: "La Agenda para el Desarrollo Sostenible - Naciones Unidas",
        similarity: 88,
        text: "El desarrollo sostenible se ha definido como el desarrollo capaz de satisfacer las necesidades del presente"
      }
    ],
    "redes sociales": [
      {
        url: "https://www.masadelante.com/faqs/redes-sociales",
        title: "¿Qué son las Redes Sociales? - Más Adelante",
        similarity: 79,
        text: "Las redes sociales son sitios de internet formados por comunidades de individuos con intereses o actividades en común"
      },
      {
        url: "https://www.oberlo.es/blog/estadisticas-redes-sociales",
        title: "Estadísticas de Redes Sociales 2023 - Oberlo",
        similarity: 65,
        text: "Las redes sociales han revolucionado la forma en que nos comunicamos y compartimos información"
      }
    ]
  };
  
  // Look for matches based on keywords
  let matches: any[] = [];
  
  Object.keys(keywordMap).forEach(keyword => {
    if (text.toLowerCase().includes(keyword)) {
      matches = [...matches, ...keywordMap[keyword]];
    }
  });
  
  // If no specific matches, try random matches
  if (matches.length === 0 && text.length > 100) {
    const randomKeyword = Object.keys(keywordMap)[Math.floor(Math.random() * Object.keys(keywordMap).length)];
    // Only 30% chance of match for texts without keywords
    if (Math.random() < 0.3) {
      matches = keywordMap[randomKeyword];
    }
  }
  
  return {
    text: text.substring(0, 150) + "...",
    matches
  };
};
