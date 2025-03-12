
/**
 * Utilities for analyzing text similarity and AI patterns
 */

// Función para calcular la similitud de texto
export function calculateSimilarity(text1: string, text2: string): number {
  // Normalizar textos
  const normalize = (text: string): string => 
    text.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
  
  const normalizedText1 = normalize(text1);
  const normalizedText2 = normalize(text2);
  
  // Optimización: si los textos son muy diferentes en longitud, es poco probable que sean similares
  if (Math.abs(normalizedText1.length - normalizedText2.length) > normalizedText1.length * 0.7) {
    return 0;
  }
  
  // Dividir en tokens (palabras)
  const tokens1 = normalizedText1.split(' ');
  const tokens2 = normalizedText2.split(' ');
  
  // Encontrar n-gramas comunes (frases de 3 palabras)
  const getNGrams = (tokens: string[], n = 3) => {
    const ngrams = [];
    for (let i = 0; i <= tokens.length - n; i++) {
      ngrams.push(tokens.slice(i, i + n).join(' '));
    }
    return ngrams;
  };
  
  const ngrams1 = getNGrams(tokens1);
  const ngrams2 = getNGrams(tokens2);
  
  // Optimización: usar Set para búsqueda más rápida
  const ngramsSet2 = new Set(ngrams2);
  
  // Contar coincidencias
  let matches = 0;
  for (const ngram of ngrams1) {
    if (ngramsSet2.has(ngram)) {
      matches++;
    }
  }
  
  // Calcular similitud
  if (ngrams1.length === 0) return 0;
  return Math.round((matches / ngrams1.length) * 100);
}

// Función para detectar patrones de IA
export function detectAIPatterns(text: string) {
  // Características típicas de texto generado por IA
  const aiPatterns = {
    averageSentenceLength: 0,
    repeatedPhrases: 0,
    formalLanguage: 0,
  };
  
  // Analizar longitud de oraciones
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const totalLength = sentences.reduce((sum, s) => sum + s.trim().length, 0);
  aiPatterns.averageSentenceLength = totalLength / (sentences.length || 1);
  
  // Analizar repetición de frases - optimizado usando Map
  const tokens = text.toLowerCase().split(/\s+/);
  const phrases = new Map();
  for (let i = 0; i < tokens.length - 2; i++) {
    const phrase = `${tokens[i]} ${tokens[i+1]} ${tokens[i+2]}`;
    phrases.set(phrase, (phrases.get(phrase) || 0) + 1);
  }
  
  const repeatedPhrases = Array.from(phrases.values()).filter(count => count > 1).length;
  aiPatterns.repeatedPhrases = repeatedPhrases;
  
  // Palabras formales comunes en IA
  const formalWords = [
    'furthermore', 'moreover', 'additionally', 'consequently', 'therefore', 
    'thus', 'hence', 'subsequently', 'nevertheless', 'accordingly'
  ];
  
  const normalizedText = text.toLowerCase();
  const formalWordCount = formalWords.reduce((count, word) => {
    const regex = new RegExp(`\\b${word}\\b`, 'g');
    const matches = normalizedText.match(regex);
    return count + (matches ? matches.length : 0);
  }, 0);
  
  aiPatterns.formalLanguage = formalWordCount;
  
  // Calcular puntuación de IA (0-100)
  const aiScore = Math.min(100, Math.max(0, Math.round(
    (aiPatterns.averageSentenceLength / 20) * 40 +
    (aiPatterns.repeatedPhrases / 10) * 30 +
    (aiPatterns.formalLanguage / 5) * 30
  )));
  
  return {
    score: aiScore,
    patterns: aiPatterns,
  };
}
