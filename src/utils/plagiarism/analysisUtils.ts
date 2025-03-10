
import { AnalyzedContent, PlagiarismResult, PlagiarismSource } from "./types";

// Calculate plagiarism percentage and sources
export const calculatePlagiarism = (searchResults: any[], originalContent: string): PlagiarismResult => {
  // Consolidate search results
  const allSources: PlagiarismSource[] = [];
  const allMatches: { text: string; source: string }[] = [];
  
  // Process all search results
  searchResults.forEach(result => {
    if (result.matches && result.matches.length > 0) {
      // Add found sources to the list
      result.matches.forEach((match: any) => {
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
    .slice(0, 10); // Limit to top 10 sources
  
  // Calculate overall plagiarism percentage
  const totalMatches = allMatches.length;
  const totalParagraphs = searchResults.length;
  const overallPercentage = Math.round((totalMatches / totalParagraphs) * 70);
  
  // Generate detailed content analysis
  const analyzedContent = generateAnalyzedContent(originalContent, allMatches);
  
  return {
    percentage: overallPercentage,
    sources: sortedSources,
    documentContent: originalContent,
    analyzedContent
  };
};

// Generate detailed analysis marking plagiarized parts
export const generateAnalyzedContent = (content: string, matches: { text: string; source: string }[]): AnalyzedContent[] => {
  const words = content.split(/\s+/);
  const analyzedContent: AnalyzedContent[] = [];
  let currentPart: AnalyzedContent = { text: "", isPlagiarized: false };
  
  // Mark words that match texts from external sources
  words.forEach((word, index) => {
    // Determine if the current word is part of a plagiarized fragment
    const isPlagiarized = matches.some(match => {
      const matchWords = match.text.split(/\s+/);
      const windowSize = matchWords.length;
      
      // Check if there's a match with sliding window
      if (index + windowSize <= words.length) {
        const textWindow = words.slice(index, index + windowSize).join(" ");
        return textWindow.toLowerCase().includes(match.text.toLowerCase());
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
  });
  
  // Add the last part
  if (currentPart.text) {
    analyzedContent.push(currentPart);
  }
  
  return analyzedContent;
};
