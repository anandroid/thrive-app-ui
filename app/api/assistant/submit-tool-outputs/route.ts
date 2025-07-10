import { NextRequest } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    const { threadId, runId, toolOutputs } = await request.json();

    if (!threadId || !runId || !toolOutputs) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }), 
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const openai = new OpenAI({ 
      apiKey: process.env.THRIVE_OPENAI_API_KEY! 
    });

    // Submit the tool outputs and get a new stream
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stream = await (openai.beta.threads.runs as any).submitToolOutputsStream(
      threadId,
      runId,
      { tool_outputs: toolOutputs }
    );

    const encoder = new TextEncoder();
    let fullContent = '';

    return new Response(
      new ReadableStream({
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
                    `data: ${JSON.stringify({ type: 'completed', content: fullContent })}\n\n`,
                  ),
                );
                controller.close();
              } else if (event.event === 'thread.run.failed') {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ type: 'error', error: 'Run failed' })}\n\n`,
                  ),
                );
                controller.close();
              }
            }
          } catch (error) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ 
                  type: 'error', 
                  error: error instanceof Error ? error.message : 'Stream error' 
                })}\n\n`,
              ),
            );
            controller.close();
          }
        },
      }),
      {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to submit tool outputs' 
      }), 
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}