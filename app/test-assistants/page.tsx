'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';

const TEST_MESSAGES = [
  { role: 'Chat', message: 'I have trouble sleeping', color: 'bg-blue-500' },
  { role: 'Routine', message: 'Create a sleep routine for me', color: 'bg-green-500' },
  { role: 'Pantry', message: 'What supplements help with sleep?', color: 'bg-purple-500' }
];

export default function TestAssistants() {
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const testAssistant = async (test: typeof TEST_MESSAGES[0]) => {
    setLoading(prev => ({ ...prev, [test.role]: true }));
    setResponses(prev => ({ ...prev, [test.role]: '' }));

    try {
      const response = await fetch('/api/assistant/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: test.message,
          threadId: `test-${test.role}-${Date.now()}`
        })
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.type === 'content' || data.type === 'delta') {
                  fullContent += data.content;
                  setResponses(prev => ({ ...prev, [test.role]: fullContent }));
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }
      }
    } catch (error) {
      setResponses(prev => ({ ...prev, [test.role]: `Error: ${error}` }));
    } finally {
      setLoading(prev => ({ ...prev, [test.role]: false }));
    }
  };

  return (
    <AppLayout
      header={{
        title: 'Multi-Assistant Test',
        showBackButton: true,
        backHref: '/'
      }}
    >
      <div className="min-h-full bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
        
        <div className="grid md:grid-cols-3 gap-6">
          {TEST_MESSAGES.map((test) => (
            <div key={test.role} className="bg-white rounded-lg shadow-lg p-6">
              <div className={`${test.color} text-white px-4 py-2 rounded-lg mb-4 text-center font-semibold`}>
                {test.role} Specialist
              </div>
              
              <p className="text-gray-700 mb-4 italic">&ldquo;{test.message}&rdquo;</p>
              
              <button
                onClick={() => testAssistant(test)}
                disabled={loading[test.role]}
                className="w-full bg-blue-500 text-white rounded-lg px-4 py-2 hover:bg-blue-600 disabled:bg-gray-300 transition-colors mb-4"
              >
                {loading[test.role] ? 'Testing...' : 'Test Assistant'}
              </button>
              
              {responses[test.role] && (
                <div className="bg-gray-100 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <pre className="text-xs whitespace-pre-wrap">{responses[test.role]}</pre>
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold mb-2">🧪 Test Instructions:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Click each &ldquo;Test Assistant&rdquo; button to send a test message</li>
            <li>Watch as the appropriate specialist responds</li>
            <li>Each specialist has unique knowledge and response style</li>
            <li>Responses are streamed in real-time</li>
          </ol>
        </div>
        </div>
      </div>
    </AppLayout>
  );
}