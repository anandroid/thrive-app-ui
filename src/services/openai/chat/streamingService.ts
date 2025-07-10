import OpenAI from 'openai';
import { ThreadContextManager } from '../context/ThreadContextManager';

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
              // Send function calls to client for execution
              const requiredAction = event.data.required_action;
              if (requiredAction?.type === 'submit_tool_outputs') {
                // Send function call request to client
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ 
                      type: 'function_call',
                      runId: event.data.id,
                      threadId: threadId,
                      toolCalls: requiredAction.submit_tool_outputs.tool_calls
                    })}\n\n`
                  )
                );
                
                // The client will need to call a new endpoint to submit the results
                // For now, we'll close this stream
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ type: 'awaiting_function_results' })}\n\n`
                  )
                );
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