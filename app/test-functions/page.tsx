'use client';

import React, { useState } from 'react';
import { executeClientSideFunctions } from '@/src/services/openai/functions/clientFunctionHandler';

export default function TestFunctionsPage() {
  const [results, setResults] = useState<{
    functionName: string;
    args: Record<string, unknown>;
    result?: unknown;
    error?: string;
    timestamp: string;
  }[]>([]);
  const [loading, setLoading] = useState(false);

  // Add test data to localStorage
  const setupTestData = () => {
    const pantryItems = [
      {
        id: '1',
        name: 'Vitamin D3',
        tags: ['supplement', 'vitamin'],
        notes: '2000 IU daily',
        dateAdded: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Magnesium',
        tags: ['supplement', 'mineral'],
        notes: 'For sleep',
        dateAdded: new Date().toISOString()
      },
      {
        id: '3',
        name: 'Ginger Tea',
        tags: ['remedy', 'herb'],
        notes: 'For digestion',
        dateAdded: new Date().toISOString()
      }
    ];

    const routines = [
      {
        id: 'r1',
        name: 'Morning Routine',
        description: 'Start the day right',
        type: 'wellness',
        duration: 30,
        frequency: 'daily',
        reminderTimes: ['08:00'],
        healthConcern: 'energy',
        steps: [
          {
            id: 's1',
            title: 'Drink water',
            description: 'Hydrate',
            order: 1
          }
        ],
        expectedOutcomes: ['Better energy'],
        safetyNotes: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      }
    ];

    localStorage.setItem('thrive_pantry_items', JSON.stringify(pantryItems));
    localStorage.setItem('wellness-routines', JSON.stringify(routines));
    
    alert('Test data added to localStorage!');
  };

  const testFunction = async (functionName: string, args: Record<string, unknown> = {}) => {
    setLoading(true);
    
    const functionCall = {
      id: `call_${Date.now()}`,
      type: 'function' as const,
      function: {
        name: functionName,
        arguments: JSON.stringify(args)
      }
    };

    try {
      const outputs = await executeClientSideFunctions([functionCall]);
      const result = JSON.parse(outputs[0].output);
      
      setResults(prev => [...prev, {
        functionName,
        args,
        result,
        timestamp: new Date().toISOString()
      }]);
    } catch (error) {
      setResults(prev => [...prev, {
        functionName,
        args,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }]);
    }
    
    setLoading(false);
  };

  const clearResults = () => setResults([]);

  return (
    <div className="app-screen bg-gray-50">
      <div className="p-4 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Test Client-Side Functions</h1>
        
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800 mb-2">
            This page tests the client-side function execution. Functions run in your browser and access localStorage data.
          </p>
          <button
            onClick={setupTestData}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Setup Test Data
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => testFunction('get_pantry_items')}
            disabled={loading}
            className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow disabled:opacity-50"
          >
            <h3 className="font-semibold mb-1">Get All Pantry Items</h3>
            <p className="text-sm text-gray-600">Retrieves all items from localStorage</p>
          </button>

          <button
            onClick={() => testFunction('get_pantry_items', { category: 'supplement' })}
            disabled={loading}
            className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow disabled:opacity-50"
          >
            <h3 className="font-semibold mb-1">Get Supplements Only</h3>
            <p className="text-sm text-gray-600">Filters by category</p>
          </button>

          <button
            onClick={() => testFunction('get_pantry_items', { search: 'vitamin' })}
            disabled={loading}
            className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow disabled:opacity-50"
          >
            <h3 className="font-semibold mb-1">Search Pantry</h3>
            <p className="text-sm text-gray-600">Search for &quot;vitamin&quot;</p>
          </button>

          <button
            onClick={() => testFunction('get_thriving_progress', { thriving_id: 'all' })}
            disabled={loading}
            className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow disabled:opacity-50"
          >
            <h3 className="font-semibold mb-1">Get All Routines</h3>
            <p className="text-sm text-gray-600">Shows active routines</p>
          </button>

          <button
            onClick={() => testFunction('get_supplement_recommendations', { health_concern: 'sleep' })}
            disabled={loading}
            className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow disabled:opacity-50"
          >
            <h3 className="font-semibold mb-1">Get Recommendations</h3>
            <p className="text-sm text-gray-600">For sleep issues</p>
          </button>

          <button
            onClick={() => testFunction('invalid_function')}
            disabled={loading}
            className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow disabled:opacity-50"
          >
            <h3 className="font-semibold mb-1">Test Error Handling</h3>
            <p className="text-sm text-gray-600">Calls non-existent function</p>
          </button>
        </div>

        {results.length > 0 && (
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Results</h2>
              <button
                onClick={clearResults}
                className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
              >
                Clear
              </button>
            </div>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <div key={index} className="border-b pb-4 last:border-b-0">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-blue-600">{result.functionName}</h3>
                    <span className="text-xs text-gray-500">
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  
                  {result.args && Object.keys(result.args).length > 0 && (
                    <div className="mb-2">
                      <span className="text-sm font-medium text-gray-600">Args: </span>
                      <code className="text-sm bg-gray-100 px-1 rounded">
                        {JSON.stringify(result.args)}
                      </code>
                    </div>
                  )}
                  
                  <div className="bg-gray-50 p-2 rounded text-sm overflow-x-auto">
                    <pre>
                      {result.error 
                        ? `Error: ${result.error}`
                        : JSON.stringify(result.result, null, 2)
                      }
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}