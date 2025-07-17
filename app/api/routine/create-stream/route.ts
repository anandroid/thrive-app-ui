import { NextRequest } from 'next/server';
import { RoutineCreationService } from '@/src/services/openai/routines/routineCreationService';
import { getMultiAssistantService } from '@/src/services/openai/multiAssistantService';
import { parseStepsProgressive } from './parseSteps';

// Step type definition
interface RoutineStep {
  title: string;
  description: string;
  duration: string | number;
  stepNumber?: number;
  bestTime?: string;
  tips?: string[];
  videoSearchQuery?: string;
  will_video_tutorial_help?: boolean;
  reminderText?: string;
  reminderTime?: string;
}

// Helper function to transform routine data
function transformRoutine(routine: Record<string, unknown>, routineType: string, healthConcern: string, threadId?: string, origin?: Record<string, unknown>) {
  const routineId = routine.id || Date.now().toString();
  
  // Transform journal template if it exists
  let journalTemplate = routine.journalTemplate;
  if (journalTemplate && typeof journalTemplate === 'object') {
    const template = journalTemplate as Record<string, unknown>;
    journalTemplate = {
      ...template,
      templateId: template.templateId || `template-${routineId}`,
      routineId: routineId,
      version: template.version || '1.0',
      createdAt: template.createdAt || new Date().toISOString()
    };
  }
  
  return {
    ...routine,
    id: routineId,
    title: routine.routineTitle || routine.title || routine.name || 'Wellness Routine',
    name: routine.routineTitle || routine.name || 'Wellness Routine', // Keep for backward compatibility
    description: routine.routineDescription || routine.description || '',
    type: routine.routineType || routineType || 'wellness_routine',
    duration: typeof routine.duration === 'string' ? 
      parseInt(routine.duration.replace('_days', '')) : 
      routine.duration || 7,
    frequency: routine.frequency || 'daily',
    reminderTimes: (routine.steps as RoutineStep[] | undefined)?.map((s) => s.reminderTime).filter(Boolean) || [],
    healthConcern: routine.healthConcern || healthConcern,
    steps: ((routine.steps as RoutineStep[] | undefined) || []).map((step, index) => ({
      id: `step-${routineId}-${index + 1}`,
      order: index + 1,
      title: step.title,
      description: step.description,
      duration: typeof step.duration === 'string' ? 
        parseInt(step.duration.replace(' minutes', '')) : 
        step.duration || 5,
      stepNumber: step.stepNumber || index + 1,
      bestTime: step.bestTime,
      tips: step.tips || [],
      videoSearchQuery: step.videoSearchQuery,
      will_video_tutorial_help: step.will_video_tutorial_help,
      reminderText: step.reminderText,
      reminderTime: step.reminderTime,
      time: step.reminderTime // Add time property for UI
    })),
    expectedOutcomes: routine.expectedOutcomes || [],
    safetyNotes: routine.safetyNotes || [],
    createdAt: new Date((routine.createdAt as string | number | Date) || Date.now()),
    updatedAt: new Date((routine.updatedAt as string | number | Date) || Date.now()),
    isActive: true,
    routineType: routine.routineType,
    routineTitle: routine.routineTitle,
    routineDescription: routine.routineDescription,
    totalSteps: routine.totalSteps || (routine.steps as RoutineStep[] | undefined)?.length || 0,
    reminderFrequency: routine.reminderFrequency || 'daily',
    additionalSteps: routine.additionalSteps,
    additionalRecommendations: routine.additionalRecommendations,
    proTips: routine.proTips,
    journalTemplate: journalTemplate,
    origin: origin || (threadId ? {
      threadId,
      createdFrom: 'chat' as const,
      context: healthConcern
    } : undefined)
  };
}

// Helper function to attempt parsing partial JSON (kept for potential future use)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function attemptPartialParse(content: string, lastIndex: number, parsedSteps: Set<string> = new Set()): { 
  parsed: boolean; 
  type?: string; 
  data?: unknown; 
  index?: number; 
  lastIndex: number;
  parsedSteps?: Set<string>;
} {
  // Try to find complete JSON properties as they stream
  
  // Look for routine title
  const titleMatch = content.match(/"routineTitle"\s*:\s*"([^"]+)"/);
  if (titleMatch && titleMatch.index! > lastIndex) {
    return { parsed: true, type: 'title', data: titleMatch[1], lastIndex: titleMatch.index! + titleMatch[0].length };
  }
  
  // Look for description
  const descMatch = content.match(/"routineDescription"\s*:\s*"([^"]+)"/);
  if (descMatch && descMatch.index! > lastIndex) {
    return { parsed: true, type: 'description', data: descMatch[1], lastIndex: descMatch.index! + descMatch[0].length };
  }
  
  // Look for step objects starting from lastIndex
  // This allows us to continue parsing steps progressively
  let currentIdx = lastIndex;
  
  // First, check if we're inside or can find a steps array
  const stepsArrayCheck = content.substring(0, currentIdx).lastIndexOf('"steps"');
  const inStepsArray = stepsArrayCheck > -1 && content.substring(stepsArrayCheck).includes('[');
  
  if (inStepsArray || content.indexOf('"steps"', lastIndex) > -1) {
    let stepIndex = parsedSteps.size; // Start from the next unparsed step
    let searchAttempts = 0;
    
    while (currentIdx < content.length && searchAttempts < 50) {
      searchAttempts++;
        // Skip whitespace
        while (currentIdx < content.length && /\s/.test(content[currentIdx])) {
          currentIdx++;
        }
        
        // Check if we hit the end of array
        if (content[currentIdx] === ']') break;
        
        // Look for start of object
        if (content[currentIdx] === '{') {
          const objStartIdx = currentIdx;
          let braceCount = 1;
          let inString = false;
          let escaped = false;
          currentIdx++;
          
          // Find matching closing brace
          while (currentIdx < content.length && braceCount > 0) {
            const char = content[currentIdx];
            
            if (!escaped) {
              if (char === '"' && !inString) {
                inString = true;
              } else if (char === '"' && inString) {
                inString = false;
              } else if (!inString) {
                if (char === '{') braceCount++;
                else if (char === '}') braceCount--;
              }
              
              escaped = (char === '\\');
            } else {
              escaped = false;
            }
            
            currentIdx++;
          }
          
          // If we found a complete object
          if (braceCount === 0) {
            const objStr = content.substring(objStartIdx, currentIdx);
            try {
              const step = JSON.parse(objStr);
              if (step && (step.title || step.stepTitle)) {
                // Check if this step has new data
                const stepTitle = step.title || step.stepTitle;
                const hasMoreData = step.description && step.description !== 'Loading step details...';
                if (stepTitle && (!parsedSteps.has(stepTitle) || hasMoreData)) {
                  parsedSteps.add(stepTitle);
                  console.log(`Parsed step ${stepIndex + 1}: "${stepTitle}"`);
                  return {
                    parsed: true,
                    type: 'step',
                    data: step,
                    index: stepIndex,
                    lastIndex: currentIdx,
                    parsedSteps
                  };
                }
              }
            } catch {
              // Not valid JSON yet, try partial parsing
              if (stepIndex < 5) { // Log first few parsing attempts
                console.log(`Step ${stepIndex} parse failed, partial content: ${objStr.substring(0, 100)}...`);
              }
              const titleMatch = objStr.match(/"(?:title|stepTitle)"\s*:\s*"([^"]+)"/);
              if (titleMatch && !parsedSteps.has(titleMatch[1])) {
                // Extract what we can
                const descMatch = objStr.match(/"(?:description|stepDescription)"\s*:\s*"([^"]+)"/);
                const durationMatch = objStr.match(/"duration"\s*:\s*["\']?(\d+)/);
                
                parsedSteps.add(titleMatch[1]);
                console.log(`Parsed partial step ${stepIndex + 1}: "${titleMatch[1]}"`);
                return {
                  parsed: true,
                  type: 'partial_step',
                  data: {
                    title: titleMatch[1],
                    description: descMatch ? descMatch[1] : 'Loading step details...',
                    duration: durationMatch ? parseInt(durationMatch[1]) : 5,
                    stepNumber: stepIndex + 1
                  },
                  index: stepIndex,
                  lastIndex: objStartIdx + titleMatch.index! + titleMatch[0].length,
                  parsedSteps
                };
              }
            }
            
            stepIndex++;
          } else {
            // Incomplete object, skip ahead to look for more complete steps
            // Don't break - there might be complete steps further in the stream
            const nextBraceIdx = content.indexOf('{', currentIdx);
            if (nextBraceIdx > -1 && nextBraceIdx < content.length - 10) {
              currentIdx = nextBraceIdx;
              // Don't increment stepIndex yet - we haven't successfully parsed this step
            } else {
              // No more potential objects to parse
              break;
            }
          }
        } else {
          // Not an object start, look for next object
          const nextObjIdx = content.indexOf('{', currentIdx);
          if (nextObjIdx > -1) {
            currentIdx = nextObjIdx;
          } else {
            break;
          }
        }
      }
    }
    
    // Look for journalTemplate section
    const journalTemplateRegex = /"journalTemplate"\s*:\s*(\{[\s\S]*?\}(?=\s*[,}]))/;
    const journalMatch = content.match(journalTemplateRegex);
    if (journalMatch && journalMatch.index! > lastIndex) {
      try {
        // Try to parse the journal template object
        const journalTemplate = JSON.parse(journalMatch[1]);
        if (journalTemplate && journalTemplate.journalType) {
          return { 
            parsed: true, 
            type: 'journalTemplate', 
            data: journalTemplate, 
            lastIndex: journalMatch.index! + journalMatch[0].length 
          };
        }
      } catch {
        // Not complete yet, continue
      }
    }

    // Look for other sections as they complete
    const sectionsToCheck = [
      { name: 'additionalRecommendations', type: 'recommendations' },
      { name: 'expectedOutcomes', type: 'outcomes' },
      { name: 'proTips', type: 'tips' },
      { name: 'safetyNotes', type: 'safety' }
    ];
    
    for (const section of sectionsToCheck) {
      const sectionRegex = new RegExp(`"${section.name}"\\s*:\\s*\\[(.*?)\\]`);
      const sectionMatch = content.match(sectionRegex);
      if (sectionMatch && sectionMatch.index! > lastIndex) {
        try {
          const data = JSON.parse(`[${sectionMatch[1]}]`);
          if (data.length > 0) {
            return { parsed: true, type: section.type, data, lastIndex: sectionMatch.index! + sectionMatch[0].length };
          }
        } catch {
          // Not complete yet
        }
      }
    }
  
  return { parsed: false, lastIndex, parsedSteps };
}

export async function POST(request: NextRequest) {
  try {
    // Check if request has a body
    const contentLength = request.headers.get('content-length');
    if (!contentLength || contentLength === '0') {
      return new Response(
        JSON.stringify({ error: 'Empty request body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    let body;
    try {
      body = await request.json();
    } catch (e) {
      console.error('Failed to parse request body:', e);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const { 
      routineType, 
      healthConcern, 
      customInstructions, 
      frequency, 
      duration,
      userPreferences,
      threadId,
      origin 
    } = body;

    if (!healthConcern) {
      return new Response(
        JSON.stringify({ error: 'Health concern is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Extract context from thread if provided
    let conversationContext = '';
    if (threadId) {
      try {
        const multiAssistantService = getMultiAssistantService();
        const messages = await multiAssistantService.getThreadMessagesWithWindow(threadId);
        
        // Create a detailed context with emphasis on user's specific situation
        const contextMessages = messages.map(msg => {
          if (msg.role === 'user') {
            return `USER'S ACTUAL WORDS: "${msg.content}"`;
          } else {
            // Include full assistant responses, especially recommendations
            const content = msg.content;
            
            // Try to parse structured responses
            try {
              const parsed = JSON.parse(content);
              let assistantMessage = `ASSISTANT'S RECOMMENDATIONS:\n`;
              
              // Extract greeting/main message
              if (parsed.greeting) {
                assistantMessage += `${parsed.greeting}\n`;
              }
              
              // Extract action items (like exercises)
              if (parsed.actionItems && parsed.actionItems.length > 0) {
                assistantMessage += `\nSpecific recommendations provided:`;
                parsed.actionItems.forEach((item: { title?: string; description?: string }) => {
                  assistantMessage += `\n- ${item.title}`;
                  if (item.description) assistantMessage += `: ${item.description}`;
                });
              }
              
              // Extract additional information
              if (parsed.additionalInformation) {
                assistantMessage += `\n\nAdditional guidance: ${parsed.additionalInformation}`;
              }
              
              // Extract supplement recommendations (CRITICAL for routine personalization)
              if (parsed.actionableItems && parsed.actionableItems.length > 0) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const supplements = parsed.actionableItems.filter((item: any) => 
                  item.type === 'supplement_choice' || item.type === 'already_have'
                );
                if (supplements.length > 0) {
                  assistantMessage += `\n\nSUPPLEMENTS RECOMMENDED/ACCEPTED:`;
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  supplements.forEach((supp: any) => {
                    assistantMessage += `\n- ${supp.productName || supp.title}`;
                    if (supp.dosage) assistantMessage += ` (${supp.dosage})`;
                    if (supp.timing) assistantMessage += ` - Take: ${supp.timing}`;
                  });
                }
              }
              
              return assistantMessage;
            } catch {
              // If not JSON, include the full content as it might contain exercises or recommendations
              return `ASSISTANT'S RESPONSE: ${content}`;
            }
          }
        }).join('\n\n');
        
        conversationContext = `CONVERSATION CONTEXT:

${contextMessages}

CRITICAL INSTRUCTIONS:
1. Pay special attention to USER'S ACTUAL WORDS - these reveal their specific situation
2. INCORPORATE ALL ASSISTANT'S RECOMMENDATIONS - especially any exercises, techniques, or specific advice given
3. If the assistant recommended specific exercises (like shoulder strengthening), these MUST be included in the routine
4. Create a routine that builds upon what was already discussed - don't start from scratch
5. Make it feel like a natural continuation of the conversation, not a generic routine`;
      } catch (error) {
        console.error('Error fetching thread context:', error);
        // Continue without context if fetching fails
      }
    }

    // Initialize service
    const routineService = new RoutineCreationService(
      process.env.THRIVE_OPENAI_API_KEY!
    );

    // Create a readable stream for the response
    const encoder = new TextEncoder();
    let controllerClosed = false;
    const stream = new ReadableStream({
      async start(controller) {
        // Helper function to safely enqueue data
        const safeEnqueue = (data: unknown) => {
          if (!controllerClosed) {
            try {
              controller.enqueue(encoder.encode(JSON.stringify(data) + '\n'));
            } catch (e) {
              console.error('Failed to enqueue:', e);
              controllerClosed = true;
            }
          }
        };
        
        try {
          
          // Send initial response
          safeEnqueue({
            type: 'start',
            id: Date.now().toString(),
            timestamp: new Date().toISOString()
          });

          // Track streamed content and parsing state
          let streamedContent = '';
          let lastParsedIndex = 0;
          const parsedStepTitles = new Set<string>();
          let totalChunks = 0;
          let lastStepSearchPos = 0;
          // let currentRoutine: Record<string, any> | null = null;

          // Use the streaming method
          await routineService.createRoutineStream({
            routineType: routineType || 'wellness_routine',
            duration: duration || '7_days',
            frequency: frequency || 'daily',
            healthConcern,
            customInstructions: customInstructions || '',
            sleepTime: userPreferences?.sleepSchedule?.bedtime || '22:00',
            wakeTime: userPreferences?.sleepSchedule?.wakeTime || '07:00',
            conversationContext
          }, {
            onChunk: (chunk: string) => {
              totalChunks++;
              streamedContent += chunk;
              
              // Log streaming progress less frequently to avoid potential buffer issues
              if (totalChunks % 50 === 0) {
                console.log(`Chunk ${totalChunks}, total length: ${streamedContent.length}`);
              }
              
              // Parse title and description using simple regex
              const titleMatch = streamedContent.match(/"routineTitle"\s*:\s*"([^"]+)"/);
              if (titleMatch && titleMatch.index! > lastParsedIndex) {
                safeEnqueue({
                  type: 'routine_info',
                  data: { title: titleMatch[1] }
                });
                lastParsedIndex = titleMatch.index! + titleMatch[0].length;
              }
              
              const descMatch = streamedContent.match(/"routineDescription"\s*:\s*"([^"]+)"/);
              if (descMatch && descMatch.index! > lastParsedIndex) {
                safeEnqueue({
                  type: 'routine_info',
                  data: { description: descMatch[1] }
                });
                lastParsedIndex = Math.max(lastParsedIndex, descMatch.index! + descMatch[0].length);
              }
              
              // Use progressive parser for all steps
              try {
                const foundSteps = parseStepsProgressive(streamedContent, lastStepSearchPos, parsedStepTitles);
                
                for (const {step, index, endPos} of foundSteps) {
                  console.log(`Streaming step ${index + 1}: "${step.title || step.stepTitle}"`);
                  
                  // Send the step
                  const timeMatch = typeof step.bestTime === 'string' 
                    ? step.bestTime.match(/\d{2}:\d{2}/) 
                    : null;
                    
                  safeEnqueue({
                    type: 'step',
                    stepIndex: index,
                    data: {
                      ...step,
                      stepNumber: index + 1,
                      time: timeMatch?.[0] || 
                            step.reminderTime || 
                            `${7 + index}:00`
                    }
                  });
                  
                  // Update search position
                  lastStepSearchPos = Math.max(lastStepSearchPos, endPos);
                }
              } catch (e) {
                console.error('Step parsing error:', e);
              }
              
              // Skip the old parsing logic - we're using the progressive parser above
              /*
              // Try to parse and send partial data as it streams
              // Keep parsing until no more complete elements are found
              let parseResult;
              let parseCount = 0;
              do {
                parseCount++;
                try {
                  parseResult = attemptPartialParse(streamedContent, lastParsedIndex, parsedStepTitles);
                  if (parseResult.parsed) {
                    // Update parsed steps set if provided
                    if (parseResult.parsedSteps) {
                      parsedSteps = parseResult.parsedSteps;
                    }
                    
                    // Send parsed data to client
                    if (parseResult.type === 'title' && parseResult.data) {
                      safeEnqueue({
                        type: 'routine_info',
                        data: {
                          title: parseResult.data
                        }
                      });
                    } else if (parseResult.type === 'description' && parseResult.data) {
                      safeEnqueue({
                        type: 'routine_info',
                        data: {
                          description: parseResult.data
                        }
                      });
                    } else if (parseResult.type === 'step' && parseResult.data) {
                      safeEnqueue({
                        type: 'step',
                        stepIndex: parseResult.index,
                        data: parseResult.data
                      });
                    } else if (parseResult.type === 'partial_step' && parseResult.data) {
                      safeEnqueue({
                        type: 'partial_step',
                        stepIndex: parseResult.index,
                        data: parseResult.data
                      });
                    } else if (parseResult.type === 'recommendations' && parseResult.data) {
                      safeEnqueue({
                        type: 'recommendations',
                        data: parseResult.data
                      });
                    } else if (parseResult.type === 'outcomes' && parseResult.data) {
                      safeEnqueue({
                        type: 'outcomes',
                        data: parseResult.data
                      });
                    } else if (parseResult.type === 'tips' && parseResult.data) {
                      safeEnqueue({
                        type: 'tips',
                        data: parseResult.data
                      });
                    } else if (parseResult.type === 'safety' && parseResult.data) {
                      safeEnqueue({
                        type: 'safety',
                        data: parseResult.data
                      });
                    } else if (parseResult.type === 'journalTemplate' && parseResult.data) {
                      safeEnqueue({
                        type: 'journalTemplate',
                        data: parseResult.data
                      });
                    }
                    lastParsedIndex = parseResult.lastIndex;
                  }
                } catch (parseError) {
                  // Log parse errors but continue
                  console.error('Parse error:', parseError);
                  parseResult = { parsed: false, lastIndex: lastParsedIndex };
                }
                
                // Prevent infinite loops
                if (parseCount > 100) {
                  console.warn('Parse loop limit reached');
                  break;
                }
              } while (parseResult && parseResult.parsed); // Keep parsing until no more complete elements
              */
              
              // Send streaming indicator less frequently to avoid overwhelming the connection
              if (totalChunks % 20 === 0) {
                safeEnqueue({
                  type: 'streaming',
                  progress: totalChunks
                });
              }
            },
            onComplete: (routine: Record<string, unknown>) => {
              // currentRoutine = routine;
              console.log(`Stream completed. Total chunks: ${totalChunks}, final content length: ${streamedContent.length}`);
              console.log('Final accumulated content (first 500 chars):', streamedContent.substring(0, 500));
              console.log('Final accumulated content (last 500 chars):', streamedContent.substring(Math.max(0, streamedContent.length - 500)));
              
              
              // Send completion with the full routine
              safeEnqueue({
                type: 'complete', 
                routine: transformRoutine(routine, routineType, healthConcern, threadId, origin)
              });
              
              if (!controllerClosed) {
                controllerClosed = true;
                controller.close();
              }
            },
            onError: (error: Error) => {
              console.error('Streaming error:', error);
              
              
              safeEnqueue({
                type: 'error',
                error: error.message
              });
              if (!controllerClosed) {
                controllerClosed = true;
                controller.close();
              }
            }
          });
        } catch (error) {
          console.error('Stream error:', error);
          
          
          safeEnqueue({
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          if (!controllerClosed) {
            controllerClosed = true;
            controller.close();
          }
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'X-Accel-Buffering': 'no', // Disable proxy buffering
      },
    });
  } catch (error) {
    console.error('Error creating routine:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to create routine',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}