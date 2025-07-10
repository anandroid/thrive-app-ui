import OpenAI from 'openai';
import { ThreadContextManager } from '../context/ThreadContextManager';
import { handleFunctionCall } from '../functions/assistantFunctions';

export class StreamingChatService {
  private openai: OpenAI;
  private assistantId: string;
  private chatIntent?: string | null;
  private contextManager: ThreadContextManager;

  constructor(apiKey: string, assistantId: string, chatIntent?: string | null) {
    this.openai = new OpenAI({ apiKey });
    this.assistantId = assistantId;
    this.chatIntent = chatIntent;
    this.contextManager = ThreadContextManager.getInstance();
  }

  async createThread() {
    return await this.openai.beta.threads.create();
  }

  async sendMessage(threadId: string, message: string) {
    // Simply add the user message to the thread
    // Context will be injected at the run level instead
    return await this.openai.beta.threads.messages.create(threadId, {
      role: 'user',
      content: message,
    });
  }

  async createStreamingResponse(threadId: string, userId?: string) {
    // Get dynamic context instructions
    const contextInstructions = await this.contextManager.createRunInstructions(
      userId,
      this.chatIntent || undefined
    );

    const encoder = new TextEncoder();
    let fullContent = '';
    const openai = this.openai;
    const assistantId = this.assistantId;
    const chatIntent = this.chatIntent;

    return new ReadableStream({
      async start(controller) {
        try {
          const stream = openai.beta.threads.runs.stream(threadId, {
            assistant_id: assistantId,
            instructions: contextInstructions,
            max_prompt_tokens: 10000, // Limit context to manage costs
            metadata: {
              intent: chatIntent || 'general',
              timestamp: new Date().toISOString()
            }
          });

          for await (const event of stream) {
            if (event.event === 'thread.message.delta') {
              const delta = event.data.delta;
              if (
                delta.content &&
                delta.content[0] &&
                delta.content[0].type === 'text'
              ) {
                const text = delta.content[0].text?.value || '';
                fullContent += text;
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ type: 'delta', content: text })}\n\n`,
                  ),
                );
              }
            } else if (event.event === 'thread.run.requires_action') {
              // Handle function calls
              const requiredAction = event.data.required_action;
              if (requiredAction?.type === 'submit_tool_outputs') {
                const toolOutputs = [];
                
                for (const toolCall of requiredAction.submit_tool_outputs.tool_calls) {
                  if (toolCall.type === 'function') {
                    const functionName = toolCall.function.name;
                    const functionArgs = JSON.parse(toolCall.function.arguments);
                    
                    // Execute the function
                    const result = await handleFunctionCall(functionName, functionArgs);
                    
                    toolOutputs.push({
                      tool_call_id: toolCall.id,
                      output: JSON.stringify(result)
                    });
                  }
                }
                
                // Submit the tool outputs and continue the run
                // The types might be incorrect in the OpenAI SDK
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const toolStream = await (openai.beta.threads.runs as any).submitToolOutputsStream(
                  threadId,
                  event.data.id,
                  { tool_outputs: toolOutputs }
                );
                
                // Process the tool stream events
                for await (const toolEvent of toolStream) {
                  if (toolEvent.event === 'thread.message.delta') {
                    const delta = toolEvent.data.delta;
                    if (
                      delta.content &&
                      delta.content[0] &&
                      delta.content[0].type === 'text'
                    ) {
                      const text = delta.content[0].text?.value || '';
                      fullContent += text;
                      controller.enqueue(
                        encoder.encode(
                          `data: ${JSON.stringify({ type: 'delta', content: text })}\n\n`,
                        ),
                      );
                    }
                  }
                }
              }
            } else if (event.event === 'thread.run.completed') {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: 'completed', content: fullContent, threadId })}\n\n`,
                ),
              );
            } else if (event.event === 'thread.run.failed') {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: 'error', error: 'Run failed' })}\n\n`,
                ),
              );
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'error', error: 'Stream error' })}\n\n`,
            ),
          );
          controller.close();
        }
      },
    });
  }

  getStreamHeaders() {
    return {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    };
  }
}