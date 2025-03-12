
// Types for plagiarism detection system

export interface PlagiarismResult {
  percentage: number;
  sources: PlagiarismSource[];
  documentContent: string;
  analyzedContent: AnalyzedContent[];
  rawResponses?: any[]; // Raw responses from analysis
  aiGeneratedProbability?: number; // Probabilidad de que el texto sea generado por IA
  aiAnalysisDetails?: AiAnalysisDetails; // Detalles del análisis de IA
}

export interface PlagiarismSource {
  url: string;
  title: string;
  matchPercentage: number;
  source?: string; // Engine that found this source (Google, Local, Python)
}

export interface AnalyzedContent {
  text: string;
  isPlagiarized: boolean;
}

export interface AiAnalysisDetails {
  entropy?: number; // Entropía del texto
  rarityScore?: number; // Puntuación de rareza de palabras
  patternScore?: number; // Puntuación de patrones típicos de IA
  confidenceScore?: number; // Confianza del modelo en la detección
  modelDetails?: string; // Detalles del modelo usado para la detección
  features?: { [key: string]: number }; // Características específicas analizadas
}

// Error response type for better error handling
export interface ApiErrorResponse {
  error: string;
  rawResponse?: string;
  isHtmlResponse?: boolean;
}
