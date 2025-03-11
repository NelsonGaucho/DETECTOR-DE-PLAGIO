
// Búsqueda por palabras clave para el sistema de respaldo
export const performKeywordSearch = (text: string): any[] => {
  const keywordMap: Record<string, any[]> = {
    "inteligencia artificial": [
      {
        url: "https://es.wikipedia.org/wiki/Inteligencia_artificial",
        title: "Inteligencia artificial - Wikipedia",
        similarity: 85,
        text: "La inteligencia artificial es la simulación de procesos de inteligencia humana por parte de máquinas"
      }
    ],
    "calentamiento global": [
      {
        url: "https://www.nationalgeographic.es/medio-ambiente/que-es-el-calentamiento-global",
        title: "¿Qué es el calentamiento global? - National Geographic",
        similarity: 91,
        text: "El calentamiento global es el aumento a largo plazo de la temperatura media del sistema climático de la Tierra"
      }
    ],
    "energía renovable": [
      {
        url: "https://www.ree.es/es/sostenibilidad/energias-renovables",
        title: "Energías renovables - Red Eléctrica de España",
        similarity: 88,
        text: "Las energías renovables son aquellas que se obtienen de fuentes naturales inagotables a escala humana"
      }
    ],
    "algoritmo": [
      {
        url: "https://concepto.de/algoritmo-en-informatica/",
        title: "Concepto de Algoritmo en Informática",
        similarity: 82,
        text: "Un algoritmo es un conjunto de instrucciones o reglas definidas y no-ambiguas, ordenadas y finitas"
      }
    ]
  };
  
  let matches: any[] = [];
  
  Object.keys(keywordMap).forEach(keyword => {
    if (text.toLowerCase().includes(keyword)) {
      matches = [...matches, ...keywordMap[keyword]];
    }
  });
  
  return matches;
};

// Calcula la similitud entre dos textos
export const calculateSimilarity = (text1: string, text2: string): number => {
  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);
  
  let matchCount = 0;
  
  // Contamos palabras coincidentes
  words1.forEach(word => {
    if (words2.includes(word) && word.length > 3) { // Solo palabras con más de 3 caracteres
      matchCount++;
    }
  });
  
  // Calculamos porcentaje de similitud
  const similarity = (matchCount / words1.length) * 100;
  return Math.min(Math.round(similarity), 100);
};
