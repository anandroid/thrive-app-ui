'use client';

import { PageLayout } from '@/components/layout/PageLayout';
import { useState } from 'react';

export default function TestKeyboardPage() {
  const [text, setText] = useState('');
  const [notes, setNotes] = useState('');

  // Simulate keyboard messages for testing
  const simulateKeyboard = (height: number) => {
    window.postMessage(JSON.stringify({
      type: 'keyboard_height_changed',
      payload: { height, visible: height > 0 }
    }), '*');
  };

  return (
    <PageLayout
      header={{
        title: 'Keyboard Test',
        showBackButton: true,
      }}
    >
      <div className="p-4 space-y-4">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h2 className="text-lg font-semibold mb-2">Test Keyboard Behavior</h2>
          <p className="text-sm text-gray-600 mb-4">
            The action bar should stay fixed at top when keyboard appears.
            Only the content should shift up.
          </p>
          
          <div className="space-y-4">
            <button
              onClick={() => simulateKeyboard(300)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg"
            >
              Simulate Keyboard (300px)
            </button>
            
            <button
              onClick={() => simulateKeyboard(0)}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg"
            >
              Hide Keyboard
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h3 className="font-medium mb-2">Input at Top</h3>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type here..."
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>

        {/* Add some content to make page scrollable */}
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} className="bg-gray-100 p-4 rounded-lg">
            <p>Content block {i + 1}</p>
          </div>
        ))}

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h3 className="font-medium mb-2">Input at Bottom</h3>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="This input is at the bottom..."
            rows={4}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
      </div>
    </PageLayout>
  );
}