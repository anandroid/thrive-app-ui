import OpenAI from 'openai';

export class StreamingChatService {
  private openai: OpenAI;
  private assistantId: string;

  constructor(apiKey: string, assistantId: string) {
    this.openai = new OpenAI({ apiKey });
    this.assistantId = assistantId;
  }

  async createThread() {
    return await this.openai.beta.threads.create();
  }

  async sendMessage(threadId: string, message: string) {
    return await this.openai.beta.threads.messages.create(threadId, {
      role: 'user',
      content: message,
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