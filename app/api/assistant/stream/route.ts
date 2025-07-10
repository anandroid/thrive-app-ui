import { NextRequest } from 'next/server';
import { StreamingChatService } from '@/src/services/openai/chat/streamingService';

export async function POST(request: NextRequest) {
  try {
    const { message, threadId, chatIntent } = await request.json();

    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Initialize service with optional chat intent
    const streamingService = new StreamingChatService(
      process.env.THRIVE_OPENAI_API_KEY!,
      process.env.THRIVE_OPENAI_ASSISTANT_ID!,
      chatIntent
    );

    let currentThreadId = threadId;

    // Create thread if needed
    if (!currentThreadId) {
      const thread = await streamingService.createThread();
      currentThreadId = thread.id;
    }

    // Send the message
    await streamingService.sendMessage(currentThreadId, message);

    // Create streaming response with context
    // For now, we don't have user auth, so userId is undefined
    const stream = await streamingService.createStreamingResponse(currentThreadId);

    // Add thread ID to the stream if it's a new thread
    if (!threadId) {
      const encoder = new TextEncoder();
      const threadIdStream = new ReadableStream({
        async start(controller) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'thread_created', threadId: currentThreadId })}\n\n`
            )
          );
          
          // Now pipe the original stream
          const reader = stream.getReader();
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              controller.enqueue(value);
            }
          } finally {
            controller.close();
          }
        }
      });

      return new Response(threadIdStream, {
        headers: streamingService.getStreamHeaders()
      });
    }

    return new Response(stream, {
      headers: streamingService.getStreamHeaders()
    });
  } catch (error) {
    console.error('Error in assistant stream:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : 'Unknown error'
      }), 
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}