
// Types for plagiarism detection system

export interface PlagiarismResult {
  percentage: number;
  sources: PlagiarismSource[];
  documentContent: string;
  analyzedContent: AnalyzedContent[];
}

export interface PlagiarismSource {
  url: string;
  title: string;
  matchPercentage: number;
  source?: string; // Engine that found this source (Google, DeepSeek-R1, OpenAI)
}

export interface AnalyzedContent {
  text: string;
  isPlagiarized: boolean;
}

// New types for API responses
export interface OpenAIEmbeddingResponse {
  data: {
    embedding: number[];
  }[];
}

export interface DeepSeekSearchResponse {
  results: {
    url: string;
    title?: string;
    snippet?: string;
  }[];
}

export interface GoogleSearchResponse {
  items?: {
    link: string;
    title: string;
    snippet?: string;
  }[];
}
