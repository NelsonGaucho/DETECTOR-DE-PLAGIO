
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
}

export interface AnalyzedContent {
  text: string;
  isPlagiarized: boolean;
}
