import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Submit tool outputs received:', JSON.stringify(body, null, 2));
    
    const { threadId, runId, toolOutputs } = body;

    if (!threadId || !runId || !toolOutputs) {
      console.error('Missing parameters:', { threadId, runId, toolOutputs: !!toolOutputs });
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }), 
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // OpenAI SDK not used due to submitToolOutputs bug in v5.8.3
    // Using direct API calls instead

    console.log('Submitting to OpenAI:', { threadId, runId, toolOutputsCount: toolOutputs.length });
    
    // First submit the tool outputs without streaming
    console.log('Submitting tool outputs using manual API call...');
    try {
      // Use manual API call due to SDK bug
      const response = await fetch(
        `https://api.openai.com/v1/threads/${threadId}/runs/${runId}/submit_tool_outputs`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.THRIVE_OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
            'OpenAI-Beta': 'assistants=v2'
          },
          body: JSON.stringify({ tool_outputs: toolOutputs })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API error: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      const updatedRun = await response.json();
      console.log('Tool outputs submitted successfully, run status:', updatedRun.status);
      
      // Poll for completion or stream the messages
      if (updatedRun.status === 'completed') {
        // Get the final message using manual API call
        const messagesResponse = await fetch(
          `https://api.openai.com/v1/threads/${threadId}/messages?limit=1&order=desc`,
          {
            headers: {
              'Authorization': `Bearer ${process.env.THRIVE_OPENAI_API_KEY}`,
              'OpenAI-Beta': 'assistants=v2'
            }
          }
        );
        
        const messages = await messagesResponse.json();
        
        const lastMessage = messages.data[0];
        if (lastMessage && lastMessage.content[0]?.type === 'text') {
          const fullContent = lastMessage.content[0].text.value;
          
          const encoder = new TextEncoder();
          return new Response(
            new ReadableStream({
              start(controller) {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ type: 'delta', content: fullContent })}\n\n`
                  )
                );
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ type: 'completed', content: fullContent })}\n\n`
                  )
                );
                controller.close();
              }
            }),
            {
              headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                Connection: 'keep-alive',
              },
            }
          );
        }
      }
      
      // If not completed, poll for updates
      let currentRun = updatedRun;
      const encoder = new TextEncoder();
      let fullContent = '';
      
      return new Response(
        new ReadableStream({
          async start(controller) {
            try {
              while (currentRun.status === 'in_progress' || currentRun.status === 'queued' || currentRun.status === 'requires_action') {
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
                
                // Retrieve run status using manual API call
                const runResponse = await fetch(
                  `https://api.openai.com/v1/threads/${threadId}/runs/${runId}`,
                  {
                    headers: {
                      'Authorization': `Bearer ${process.env.THRIVE_OPENAI_API_KEY}`,
                      'OpenAI-Beta': 'assistants=v2'
                    }
                  }
                );
                currentRun = await runResponse.json();
                console.log('Run status:', currentRun.status);
                
                // If requires_action again, send the function call event
                if (currentRun.status === 'requires_action' && currentRun.required_action?.submit_tool_outputs) {
                  const toolCalls = currentRun.required_action.submit_tool_outputs.tool_calls;
                  
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({ 
                        type: 'function_call', 
                        runId: currentRun.id,
                        threadId: threadId,
                        toolCalls: toolCalls 
                      })}\n\n`
                    )
                  );
                  
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({ type: 'awaiting_function_results' })}\n\n`
                    )
                  );
                  
                  // Close the stream as we need new function results
                  controller.close();
                  return;
                }
                
                if (currentRun.status === 'completed') {
                  // Get the final message
                  const messagesResponse = await fetch(
                    `https://api.openai.com/v1/threads/${threadId}/messages?limit=1&order=desc`,
                    {
                      headers: {
                        'Authorization': `Bearer ${process.env.THRIVE_OPENAI_API_KEY}`,
                        'OpenAI-Beta': 'assistants=v2'
                      }
                    }
                  );
                  const messages = await messagesResponse.json();
                  
                  const lastMessage = messages.data[0];
                  if (lastMessage && lastMessage.content[0]?.type === 'text') {
                    fullContent = lastMessage.content[0].text.value;
                    
                    controller.enqueue(
                      encoder.encode(
                        `data: ${JSON.stringify({ type: 'delta', content: fullContent })}\n\n`
                      )
                    );
                    controller.enqueue(
                      encoder.encode(
                        `data: ${JSON.stringify({ type: 'completed', content: fullContent })}\n\n`
                      )
                    );
                  }
                  break;
                } else if (currentRun.status === 'failed' || currentRun.status === 'cancelled' || currentRun.status === 'expired') {
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({ type: 'error', error: `Run ${currentRun.status}` })}\n\n`
                    )
                  );
                  break;
                }
              }
              
              controller.close();
            } catch (error) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ 
                    type: 'error', 
                    error: error instanceof Error ? error.message : 'Stream error' 
                  })}\n\n`
                )
              );
              controller.close();
            }
          }
        }),
        {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
          },
        }
      );
    } catch (submitError) {
      console.error('Error calling submitToolOutputs:', submitError);
      if (submitError instanceof Error) {
        console.error('Error details:', submitError.message);
      }
      throw submitError;
    }
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