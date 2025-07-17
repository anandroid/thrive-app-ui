// Step type definition for parsing
export interface ParsedStep {
  title?: string;
  stepTitle?: string;
  description?: string;
  stepDescription?: string;
  duration?: string | number;
  stepNumber?: number;
  bestTime?: string;
  tips?: string[];
  videoSearchQuery?: string;
  will_video_tutorial_help?: boolean;
  reminderText?: string;
  reminderTime?: string;
  [key: string]: unknown; // Allow other properties
}

// Simplified step parser that looks for complete step objects anywhere in the content
export function parseStepsProgressive(
  content: string, 
  fromIndex: number = 0,
  alreadyParsed: Set<string> = new Set()
): Array<{step: ParsedStep, index: number, endPos: number}> {
  const steps: Array<{step: ParsedStep, index: number, endPos: number}> = [];
  
  // Look for all complete JSON objects that look like steps
  let searchPos = fromIndex;
  let stepIndex = alreadyParsed.size; // Start from the number of already parsed steps
  
  while (searchPos < content.length) {
    // Find next object start
    const objStart = content.indexOf('{', searchPos);
    if (objStart === -1) break;
    
    // Try to find the matching closing brace
    let braceCount = 0;
    let inString = false;
    let escaped = false;
    let pos = objStart;
    
    while (pos < content.length) {
      const char = content[pos];
      
      if (!escaped) {
        if (char === '"' && !inString) {
          inString = true;
        } else if (char === '"' && inString) {
          inString = false;
        } else if (!inString) {
          if (char === '{') braceCount++;
          else if (char === '}') {
            braceCount--;
            if (braceCount === 0) {
              // Found complete object
              const objStr = content.substring(objStart, pos + 1);
              
              try {
                const obj = JSON.parse(objStr) as ParsedStep;
                
                // Check if this looks like a step
                const stepTitle = obj.title || obj.stepTitle;
                const stepDescription = obj.description || obj.stepDescription;
                
                if (stepTitle && stepDescription && !alreadyParsed.has(stepTitle)) {
                  alreadyParsed.add(stepTitle);
                  steps.push({
                    step: obj,
                    index: stepIndex++,
                    endPos: pos + 1
                  });
                }
              } catch {
                // Not valid JSON, continue
              }
              
              searchPos = pos + 1;
              break;
            }
          }
        }
        
        escaped = (char === '\\');
      } else {
        escaped = false;
      }
      
      pos++;
    }
    
    // If we didn't find a closing brace, move forward
    if (pos >= content.length) {
      searchPos = objStart + 1;
    }
  }
  
  return steps;
}