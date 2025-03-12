
/**
 * Utilities for analyzing text similarity and AI patterns
 * with enhanced algorithms for better accuracy
 */

// Función mejorada para calcular la similitud de texto
export function calculateSimilarity(text1: string, text2: string): number {
  // Si alguno de los textos está vacío, no hay similitud
  if (!text1 || !text2) return 0;
  
  // Normalizar textos
  const normalize = (text: string): string => 
    text.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
  
  const normalizedText1 = normalize(text1);
  const normalizedText2 = normalize(text2);
  
  // Si alguno de los textos normalizados está vacío, no hay similitud
  if (!normalizedText1 || !normalizedText2) return 0;
  
  // Optimización: si los textos son muy diferentes en longitud, es poco probable que sean similares
  const lengthRatio = Math.min(normalizedText1.length, normalizedText2.length) / 
                      Math.max(normalizedText1.length, normalizedText2.length);
  
  if (lengthRatio < 0.3) {
    return 0; // Demasiada diferencia en longitud
  }
  
  // Dividir en tokens (palabras)
  const tokens1 = normalizedText1.split(' ').filter(t => t.length > 1);
  const tokens2 = normalizedText2.split(' ').filter(t => t.length > 1);
  
  // Si no hay suficientes tokens, usar comparación directa
  if (tokens1.length < 3 || tokens2.length < 3) {
    // Calcular coincidencia exacta de palabras
    const commonWords = tokens1.filter(word => tokens2.includes(word));
    return Math.round((commonWords.length / Math.max(tokens1.length, tokens2.length)) * 100);
  }
  
  // Encontrar n-gramas comunes (frases de 2-4 palabras)
  const getNGrams = (tokens: string[], n: number) => {
    const ngrams = [];
    for (let i = 0; i <= tokens.length - n; i++) {
      ngrams.push(tokens.slice(i, i + n).join(' '));
    }
    return ngrams;
  };
  
  // Calcular similitud para diferentes longitudes de n-gramas
  let totalSimilarity = 0;
  const weights = [0.2, 0.5, 0.3]; // Pesos para n-gramas de 2, 3 y 4 palabras
  const ngramSizes = [2, 3, 4];
  
  for (let i = 0; i < ngramSizes.length; i++) {
    const n = ngramSizes[i];
    const ngrams1 = getNGrams(tokens1, n);
    const ngrams2 = getNGrams(tokens2, n);
    
    // Usar Set para búsqueda más eficiente
    const ngramsSet2 = new Set(ngrams2);
    
    // Contar coincidencias
    let matches = 0;
    for (const ngram of ngrams1) {
      if (ngramsSet2.has(ngram)) {
        matches++;
      }
    }
    
    // Calcular similitud para este tamaño de n-grama
    const ngramSimilarity = ngrams1.length > 0 ? (matches / ngrams1.length) : 0;
    totalSimilarity += ngramSimilarity * weights[i];
  }
  
  // Escalar la similitud total (convertir a porcentaje)
  return Math.round(totalSimilarity * 100);
}

// Función mejorada para detectar patrones de IA utilizando estadísticas lingüísticas
export function detectAIPatterns(text: string) {
  // Si el texto está vacío o es muy corto, no podemos analizarlo adecuadamente
  if (!text || text.length < 100) {
    return { score: 0, patterns: { repetitivePhrases: 0, sentenceComplexity: 0, vocabularyDiversity: 0 } };
  }
  
  // Normalizar texto para análisis
  const normalizedText = text.toLowerCase().replace(/\s+/g, ' ').trim();
  
  // 1. Analizar longitud y variación de oraciones
  const sentences = normalizedText.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const sentenceLengths = sentences.map(s => s.trim().split(/\s+/).length);
  
  // Calcular estadísticas de longitud de oraciones
  const avgSentenceLength = sentenceLengths.reduce((sum, len) => sum + len, 0) / sentences.length;
  
  // Calcular desviación estándar de longitudes de oraciones
  const sentenceLengthVariation = Math.sqrt(
    sentenceLengths.reduce((sum, len) => sum + Math.pow(len - avgSentenceLength, 2), 0) / sentences.length
  );
  
  // 2. Analizar diversidad de vocabulario
  const words = normalizedText.split(/\s+/).filter(w => w.length > 1);
  const uniqueWords = new Set(words);
  const vocabularyDiversity = uniqueWords.size / words.length;
  
  // 3. Detectar repetición de frases y patrones
  const phraseCounts = new Map();
  for (let i = 0; i < words.length - 2; i++) {
    const phrase = `${words[i]} ${words[i+1]} ${words[i+2]}`;
    phraseCounts.set(phrase, (phraseCounts.get(phrase) || 0) + 1);
  }
  
  // Contar frases que se repiten más de lo normal
  const repeatedPhrases = Array.from(phraseCounts.values()).filter(count => count > 1).length;
  const repeatedPhraseRatio = repeatedPhrases / (words.length / 3);
  
  // 4. Detectar estructuras comunes en textos de IA
  const formalTransitions = [
    'furthermore', 'moreover', 'additionally', 'consequently', 'therefore', 
    'thus', 'hence', 'subsequently', 'nevertheless', 'accordingly',
    'sin embargo', 'por lo tanto', 'en consecuencia', 'además', 'adicionalmente'
  ];
  
  let transitionCount = 0;
  for (const transition of formalTransitions) {
    const regex = new RegExp(`\\b${transition}\\b`, 'gi');
    const matches = normalizedText.match(regex);
    transitionCount += matches ? matches.length : 0;
  }
  
  const transitionRatio = transitionCount / sentences.length;
  
  // 5. Analizar coherencia entre párrafos adyacentes
  // Dividir en párrafos
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  
  // Indicadores finales
  const indicators = {
    repetitivePhrases: Math.min(1, repeatedPhraseRatio * 2), // Normalizado entre 0 y 1
    sentenceComplexity: Math.min(1, Math.max(0, 1 - sentenceLengthVariation / 8)), // Menor variación = más probable que sea IA
    vocabularyDiversity: Math.min(1, Math.max(0, 1 - vocabularyDiversity)), // Menor diversidad = más probable que sea IA
    transitionUsage: Math.min(1, transitionRatio * 2), // Uso excesivo de transiciones formales
    sentenceLengthUniformity: Math.min(1, Math.max(0, 1 - (sentenceLengthVariation / avgSentenceLength))), // Uniformidad en longitud de oraciones
  };
  
  // Pesos para cada indicador
  const weights = {
    repetitivePhrases: 0.2,
    sentenceComplexity: 0.25,
    vocabularyDiversity: 0.25, 
    transitionUsage: 0.15,
    sentenceLengthUniformity: 0.15
  };
  
  // Calcular puntuación ponderada
  let score = 0;
  for (const [key, value] of Object.entries(indicators)) {
    score += value * weights[key as keyof typeof weights];
  }
  
  // Convertir a porcentaje y redondear
  const percentageScore = Math.round(score * 100);
  
  return {
    score: percentageScore,
    patterns: indicators
  };
}
