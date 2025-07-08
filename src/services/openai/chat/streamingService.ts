import OpenAI from 'openai';

export class StreamingChatService {
  private openai: OpenAI;
  private assistantId: string;
  private chatIntent?: string | null;

  constructor(apiKey: string, assistantId: string, chatIntent?: string | null) {
    this.openai = new OpenAI({ apiKey });
    this.assistantId = assistantId;
    this.chatIntent = chatIntent;
  }

  async createThread() {
    return await this.openai.beta.threads.create();
  }

  async sendMessage(threadId: string, message: string, chatIntent?: string | null) {
    // Augment message with intent context if in creation mode
    let augmentedMessage = message;
    if (chatIntent) {
      const intentContext = chatIntent === 'create_journey' 
        ? '\n\n[SYSTEM: User is in Journey Creation Mode. Focus only on creating a wellness journey. Ask 2-3 focused questions and show ONLY the journey creation actionableItem.]'
        : '\n\n[SYSTEM: User is in Thriving Creation Mode. Focus only on creating a wellness thriving. Ask about schedule/preferences and show ONLY the thriving creation actionableItem.]';
      augmentedMessage = message + intentContext;
    }
    
    return await this.openai.beta.threads.messages.create(threadId, {
      role: 'user',
      content: augmentedMessage,
    });
  }

  createStreamingResponse(threadId: string) {
    const stream = this.openai.beta.threads.runs.stream(threadId, {
      assistant_id: this.assistantId,
    });

    const encoder = new TextEncoder();
    let fullContent = '';

    return new ReadableStream({
      async start(controller) {
        try {
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