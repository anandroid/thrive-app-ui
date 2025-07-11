'use client';

import { useState } from 'react';

export default function TestContextPage() {
  const [threadId] = useState(`test-thread-${Date.now()}`);
  const [messages, setMessages] = useState<Array<{role: string; content: string}>>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!currentMessage.trim() || isLoading) return;

    const userMessage = currentMessage;
    setCurrentMessage('');
    setIsLoading(true);

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      const response = await fetch('/api/assistant/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          threadId,
          basicContext: {
            pantryCount: 3,
            activeRoutineCount: 1,
            routineTypes: 'sleep_wellness'
          }
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      // Read streaming response
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'content') {
                assistantMessage += data.content;
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }

      // Add assistant message
      setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  // Pre-defined test messages for sliding window
  const testMessages = [
    "I have trouble sleeping at night",
    "What time do you usually recommend going to bed?",
    "I've been stressed about work lately",
    "Tell me about sleep hygiene practices",
    "What supplements can help with sleep?",
    "I heard melatonin is good, what do you think?",
    "How much melatonin should I take?",
    "What about magnesium for sleep?",
    "Are there any side effects?",
    "Should I take them together?",
    "What about L-theanine?",
    "Can you remind me what we discussed about melatonin?"
  ];

  const runSlidingWindowTest = async () => {
    setMessages([]);
    
    for (let i = 0; i < testMessages.length; i++) {
      setCurrentMessage(testMessages[i]);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between messages
      await sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-beige to-dusty-rose/20 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-soft p-6">
          <h1 className="text-2xl font-semibold text-burgundy mb-4">Test Context Window</h1>
          
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-700 mb-2">
              This page tests the sliding window context management. The system maintains the last 10 messages in context.
            </p>
            <p className="text-sm text-gray-700 mb-2">
              Thread ID: <code className="bg-gray-100 px-2 py-1 rounded">{threadId}</code>
            </p>
            <p className="text-sm text-gray-700">
              Messages in conversation: {messages.length}
            </p>
          </div>

          <button
            onClick={runSlidingWindowTest}
            className="mb-4 px-4 py-2 bg-gradient-to-r from-rose to-dusty-rose text-white rounded-full hover:opacity-90"
            disabled={isLoading}
          >
            Run Sliding Window Test
          </button>

          <div className="border rounded-lg p-4 h-96 overflow-y-auto mb-4">
            {messages.length === 0 ? (
              <p className="text-gray-500 text-center">No messages yet. Start a conversation!</p>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className={`mb-3 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                  <div className={`inline-block max-w-[80%] p-3 rounded-lg ${
                    msg.role === 'user' 
                      ? 'bg-gradient-to-r from-rose to-dusty-rose text-white' 
                      : 'bg-gray-100'
                  }`}>
                    <p className="text-sm">{msg.content}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {msg.role} • Message {idx + 1}
                  </p>
                </div>
              ))
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-rose"
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              className="px-6 py-2 bg-gradient-to-r from-rose to-dusty-rose text-white rounded-full hover:opacity-90 disabled:opacity-50"
              disabled={isLoading || !currentMessage.trim()}
            >
              {isLoading ? 'Sending...' : 'Send'}
            </button>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            <p>💡 Test the sliding window by:</p>
            <ul className="list-disc list-inside mt-2">
              <li>Sending more than 10 messages</li>
              <li>Asking the assistant to recall earlier topics</li>
              <li>Checking if it remembers the last 10 messages but not older ones</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}