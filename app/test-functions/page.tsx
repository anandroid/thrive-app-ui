'use client';

import { useState } from 'react';
// import { db } from '@/lib/db/client';
import { LoadingButton } from '@/components/ui/LoadingButton';

export default function TestFunctionsPage() {
  const [results, setResults] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState<string | null>(null);

  const setupTestData = async () => {
    setLoading('setup');
    try {
      // DB functionality commented out for now
      setResults({ setup: 'Test data setup is currently disabled' });
    } catch (error) {
      setResults({ setup: `Error: ${error}` });
    } finally {
      setLoading(null);
    }
  };

  const testGetContext = async () => {
    setLoading('context');
    try {
      const response = await fetch('/api/assistant/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool_calls: [{
            function: {
              name: 'get_user_context',
              arguments: '{}'
            }
          }]
        })
      });
      const data = await response.json();
      setResults({ ...results, context: data });
    } catch (error) {
      setResults({ ...results, context: `Error: ${error}` });
    } finally {
      setLoading(null);
    }
  };

  const testGetPantry = async () => {
    setLoading('pantry');
    try {
      const response = await fetch('/api/assistant/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool_calls: [{
            function: {
              name: 'get_pantry_items',
              arguments: '{}'
            }
          }]
        })
      });
      const data = await response.json();
      setResults({ ...results, pantry: data });
    } catch (error) {
      setResults({ ...results, pantry: `Error: ${error}` });
    } finally {
      setLoading(null);
    }
  };

  const testGetRoutines = async () => {
    setLoading('routines');
    try {
      const response = await fetch('/api/assistant/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool_calls: [{
            function: {
              name: 'get_routines',
              arguments: '{}'
            }
          }]
        })
      });
      const data = await response.json();
      setResults({ ...results, routines: data });
    } catch (error) {
      setResults({ ...results, routines: `Error: ${error}` });
    } finally {
      setLoading(null);
    }
  };

  const testAddToPantry = async () => {
    setLoading('addPantry');
    try {
      const response = await fetch('/api/assistant/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool_calls: [{
            function: {
              name: 'add_to_pantry',
              arguments: JSON.stringify({
                name: 'Melatonin',
                dosage: '3mg',
                timing: 'bedtime',
                category: 'supplement',
                notes: 'For sleep support'
              })
            }
          }]
        })
      });
      const data = await response.json();
      setResults({ ...results, addPantry: data });
    } catch (error) {
      setResults({ ...results, addPantry: `Error: ${error}` });
    } finally {
      setLoading(null);
    }
  };

  const testCreateRoutine = async () => {
    setLoading('createRoutine');
    try {
      const response = await fetch('/api/assistant/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool_calls: [{
            function: {
              name: 'create_routine',
              arguments: JSON.stringify({
                name: 'Morning Energy Routine',
                description: 'Start your day with energy',
                steps: [
                  {
                    action: 'Drink water',
                    time: '07:00',
                    duration: 5,
                    notes: '16oz room temperature'
                  },
                  {
                    action: 'Take vitamin D',
                    time: '07:05',
                    duration: 2,
                    notes: 'With breakfast'
                  }
                ]
              })
            }
          }]
        })
      });
      const data = await response.json();
      setResults({ ...results, createRoutine: data });
    } catch (error) {
      setResults({ ...results, createRoutine: `Error: ${error}` });
    } finally {
      setLoading(null);
    }
  };

  const testCreateJourney = async () => {
    setLoading('createJourney');
    try {
      const response = await fetch('/api/assistant/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool_calls: [{
            function: {
              name: 'create_journey',
              arguments: JSON.stringify({
                condition: 'chronic back pain',
                intensity: 6,
                notes: 'Lower back pain from sitting too much'
              })
            }
          }]
        })
      });
      const data = await response.json();
      setResults({ ...results, createJourney: data });
    } catch (error) {
      setResults({ ...results, createJourney: `Error: ${error}` });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Assistant Function Testing</h1>
        
        {/* Setup Button */}
        <div className="mb-8">
          <LoadingButton
            onClick={setupTestData}
            isLoading={loading === 'setup'}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Setup Test Data
          </LoadingButton>
        </div>

        {/* Function Test Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <LoadingButton
            onClick={testGetContext}
            isLoading={loading === 'context'}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Test Get Context
          </LoadingButton>

          <LoadingButton
            onClick={testGetPantry}
            isLoading={loading === 'pantry'}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Test Get Pantry
          </LoadingButton>

          <LoadingButton
            onClick={testGetRoutines}
            isLoading={loading === 'routines'}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Test Get Routines
          </LoadingButton>

          <LoadingButton
            onClick={testAddToPantry}
            isLoading={loading === 'addPantry'}
            className="bg-purple-500 text-white px-4 py-2 rounded"
          >
            Test Add to Pantry
          </LoadingButton>

          <LoadingButton
            onClick={testCreateRoutine}
            isLoading={loading === 'createRoutine'}
            className="bg-purple-500 text-white px-4 py-2 rounded"
          >
            Test Create Routine
          </LoadingButton>

          <LoadingButton
            onClick={testCreateJourney}
            isLoading={loading === 'createJourney'}
            className="bg-purple-500 text-white px-4 py-2 rounded"
          >
            Test Create Journey
          </LoadingButton>
        </div>

        {/* Results Display */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Results:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}