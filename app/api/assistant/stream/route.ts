/**
 * @fileoverview Multi-Assistant API Route (v2)
 * @module api/assistant/v2/stream
 * 
 * This route handles streaming communication with specialized assistants
 * that automatically route based on user intent.
 */

import { NextRequest } from 'next/server';
import { MultiAssistantService, getMultiAssistantService } from '@/src/services/openai/multiAssistantService';
import { BasicContext } from '@/src/services/openai/types';

/**
 * Check if multi-assistant mode is available
 */
const isMultiAssistantAvailable = () => {
  return MultiAssistantService.isMultiAssistantMode();
};

/**
 * Handle streaming with multi-assistant service
 */
async function handleMultiAssistant(
  message: string,
  threadId: string | undefined,
  basicContext?: BasicContext
) {
  const service = getMultiAssistantService();
  
  // Create thread if needed
  let currentThreadId = threadId;
  if (!currentThreadId) {
    currentThreadId = await service.createThread();
  }

  // Create streaming response
  const encoder = new TextEncoder();
  let buffer = '';
  
  const stream = new ReadableStream({
    async start(controller) {
      // Send initial thread ID if new
      if (!threadId) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ 
            type: 'thread_created', 
            threadId: currentThreadId 
          })}\n\n`)
        );
      }

      try {
        await service.sendMessage(
          currentThreadId!,
          message,
          basicContext,
          (chunk) => {
            if (chunk.type === 'content') {
              buffer += chunk.content;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ 
                  type: 'content', 
                  content: chunk.content,
                  role: chunk.role 
                })}\n\n`)
              );
            } else if (chunk.type === 'function_call') {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ 
                  type: 'function_call',
                  toolCalls: chunk.toolCalls,
                  runId: chunk.runId,
                  role: chunk.role
                })}\n\n`)
              );
            } else if (chunk.type === 'done') {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ 
                  type: 'done',
                  fullContent: buffer,
                  role: chunk.role
                })}\n\n`)
              );
              controller.close();
            } else if (chunk.type === 'error') {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ 
                  type: 'error',
                  error: chunk.error,
                  role: chunk.role
                })}\n\n`)
              );
              controller.close();
            }
          }
        );
      } catch (error) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ 
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          })}\n\n`)
        );
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}


/**
 * POST handler for assistant streaming
 */
export async function POST(request: NextRequest) {
  console.log('API Route v2: Received request');
  
  try {
    const { message, threadId, basicContext } = await request.json();
    console.log('API Route v2: Message:', message, 'ThreadId:', threadId);

    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if multi-assistant is configured
    if (!isMultiAssistantAvailable()) {
      return new Response(JSON.stringify({ 
        error: 'Multi-assistant not configured. Please run: node scripts/create-assistant-team-simple.js' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('API Route v2: Using multi-assistant mode');
    return await handleMultiAssistant(message, threadId, basicContext);

  } catch (error) {
    console.error('API Route v2 Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }), 
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}