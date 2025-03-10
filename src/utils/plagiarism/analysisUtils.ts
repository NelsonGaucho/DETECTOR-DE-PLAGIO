
import { AnalyzedContent, PlagiarismResult, PlagiarismSource } from "./types";

// Calculate plagiarism percentage and sources with optimized performance
export const calculatePlagiarism = (searchResults: any[], originalContent: string): PlagiarismResult => {
  // Consolidate search results
  const allSources: PlagiarismSource[] = [];
  const allMatches: { text: string; source: string }[] = [];
  
  // Process all search results (optimized)
  searchResults.forEach(result => {
    if (result.matches && result.matches.length > 0) {
      // Add found sources to the list (limit processing)
      result.matches.slice(0, 5).forEach((match: any) => {
        // Check if source already exists
        const existingSource = allSources.find(s => s.url === match.url);
        
        if (existingSource) {
          // Increase match percentage if source already exists
          existingSource.matchPercentage += match.similarity;
        } else {
          // Add new source
          allSources.push({
            url: match.url,
            title: match.title,
            matchPercentage: match.similarity
          });
        }
        
        // Record matching fragment
        allMatches.push({
          text: match.text,
          source: match.url
        });
      });
    }
  });
  
  // Normalize match percentages
  allSources.forEach(source => {
    source.matchPercentage = Math.min(Math.round(source.matchPercentage), 100);
  });
  
  // Sort sources by match percentage
  const sortedSources = allSources
    .sort((a, b) => b.matchPercentage - a.matchPercentage)
    .slice(0, 8); // Limit to top 8 sources for better performance
  
  // Calculate overall plagiarism percentage (simplified calculation)
  const totalMatches = allMatches.length;
  const totalParagraphs = searchResults.length;
  const overallPercentage = Math.min(Math.round((totalMatches / (totalParagraphs || 1)) * 70), 100);
  
  // Generate detailed content analysis (optimized)
  const analyzedContent = generateAnalyzedContent(originalContent, allMatches);
  
  return {
    percentage: overallPercentage,
    sources: sortedSources,
    documentContent: originalContent,
    analyzedContent
  };
};

// Generate detailed analysis marking plagiarized parts (optimized)
export const generateAnalyzedContent = (content: string, matches: { text: string; source: string }[]): AnalyzedContent[] => {
  // Limit content size for better performance
  const limitedContent = content.length > 5000 ? content.substring(0, 5000) + "..." : content;
  const words = limitedContent.split(/\s+/);
  const analyzedContent: AnalyzedContent[] = [];
  let currentPart: AnalyzedContent = { text: "", isPlagiarized: false };
  
  // Optimize by processing in chunks
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    // Check less frequently for better performance
    const isPlagiarized = i % 3 === 0 && matches.some(match => {
      const matchWords = match.text.split(/\s+/);
      const windowSize = Math.min(matchWords.length, 5); // Limit window size
      
      // Check if there's a match with sliding window (optimized)
      if (i + windowSize <= words.length) {
        const textWindow = words.slice(i, i + windowSize).join(" ");
        return textWindow.toLowerCase().includes(match.text.toLowerCase().substring(0, 30));
      }
      return false;
    });
    
    // If plagiarism state changes, create new part
    if (isPlagiarized !== currentPart.isPlagiarized) {
      if (currentPart.text) {
        analyzedContent.push(currentPart);
      }
      currentPart = { text: word, isPlagiarized };
    } else {
      currentPart.text += " " + word;
    }
  }
  
  // Add the last part
  if (currentPart.text) {
    analyzedContent.push(currentPart);
  }
  
  return analyzedContent;
};
