
/**
 * Utility for fragmenting text for plagiarism analysis
 */

/**
 * Divides text into meaningful fragments for search and analysis
 */
export function extractTextFragments(text: string) {
  // Split the text into meaningful fragments for search
  const textFragments = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
  
  // Create fragments based on complete sentences
  for (let i = 0; i < sentences.length; i++) {
    // Add individual sentences that are long enough
    if (sentences[i].length >= 50) {
      textFragments.push(sentences[i].trim());
    } 
    // Combine consecutive short sentences
    else if (i < sentences.length - 1) {
      const combinedSentence = `${sentences[i].trim()} ${sentences[i+1].trim()}`;
      if (combinedSentence.length >= 50) {
        textFragments.push(combinedSentence);
        i++; // Skip the next sentence as we've included it
      }
    }
  }
  
  // If no fragments could be extracted from sentences, use word division
  if (textFragments.length === 0) {
    const words = text.split(' ');
    // Create fragments of approximately 15 words
    for (let i = 0; i < words.length; i += 15) {
      if (i + 6 < words.length) {
        const fragmentLength = Math.min(20, words.length - i);
        textFragments.push(words.slice(i, i + fragmentLength).join(' '));
      }
    }
  }
  
  // Remove duplicate or very similar fragments
  const uniqueFragments = [];
  for (const fragment of textFragments) {
    // Check if a very similar fragment already exists
    const isDuplicate = uniqueFragments.some(
      existingFragment => {
        try {
          // Safely import and use calculateSimilarity
          const { calculateSimilarity } = require("./textAnalysis.ts");
          return calculateSimilarity(fragment, existingFragment) > 80;
        } catch (e) {
          console.error("[textFragmentation] Error calculating similarity:", e);
          // Fallback to simple string comparison if the import fails
          return fragment === existingFragment;
        }
      }
    );
    
    if (!isDuplicate) {
      uniqueFragments.push(fragment);
    }
  }
  
  // Select representative fragments for search (limit to 8 to avoid blocks)
  let searchFragments = [];
  
  // If there are more than 8 fragments, select strategically
  if (uniqueFragments.length > 8) {
    // Take the first and last fragment
    searchFragments.push(uniqueFragments[0]);
    searchFragments.push(uniqueFragments[uniqueFragments.length - 1]);
    
    // Take fragments evenly distributed from the rest
    const step = Math.floor((uniqueFragments.length - 2) / 6);
    for (let i = 1; i < uniqueFragments.length - 1 && searchFragments.length < 8; i += step) {
      searchFragments.push(uniqueFragments[i]);
    }
  } else {
    searchFragments = [...uniqueFragments];
  }
  
  return { textFragments, uniqueFragments, searchFragments };
}
