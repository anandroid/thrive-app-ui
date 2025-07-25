'use client';

import { useState, useEffect } from 'react';

interface Product {
  id: string;
  name: string;
  brand: string;
  dosage: string;
  timing: string;
  icon: string;
  inPantry: boolean;
}

interface ProductRecommendationsProps {
  pantryItems: Array<{
    id?: string;
    name?: string;
  }>;
}

export function ProductRecommendations({ pantryItems }: ProductRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Product[]>([]);

  useEffect(() => {
    // Mock data for recommendations based on user concerns
    const mockRecommendations: Product[] = [
      {
        id: '1',
        name: 'Melatonin',
        brand: 'Nature Made',
        dosage: '3mg',
        timing: 'Before bed',
        icon: '🌙',
        inPantry: pantryItems.some(item => item.name?.toLowerCase().includes('melatonin'))
      },
      {
        id: '2',
        name: 'Magnesium',
        brand: 'Pure Encapsulations',
        dosage: '400mg',
        timing: 'Evening',
        icon: '💊',
        inPantry: pantryItems.some(item => item.name?.toLowerCase().includes('magnesium'))
      },
      {
        id: '3',
        name: 'L-Theanine',
        brand: 'NOW Foods',
        dosage: '200mg',
        timing: 'Anytime',
        icon: '🍃',
        inPantry: pantryItems.some(item => item.name?.toLowerCase().includes('theanine'))
      }
    ];

    setRecommendations(mockRecommendations.slice(0, 3));
  }, [pantryItems]);

  const inPantryItems = recommendations.filter(r => r.inPantry);

  const promptTemplates = [
    { id: '1', text: 'What supplements help with sleep?', icon: '🌙' },
    { id: '2', text: 'Natural ways to improve energy', icon: '⚡' },
    { id: '3', text: 'Best vitamins for immunity', icon: '🛡️' }
  ];

  return (
    <div>
      <div style={{ marginBottom: '4vh' }}>
        <h2 className="font-bold text-gray-900" style={{ fontSize: '5vw' }}>Your Recommendations</h2>
      </div>
      
      {/* Prompt Templates */}
      <div className="flex overflow-x-auto scrollbar-hide" style={{ gap: '3vw', marginBottom: '4vh', marginLeft: '-5vw', marginRight: '-5vw', paddingLeft: '5vw', paddingRight: '5vw' }}>
        {promptTemplates.map((template) => (
          <button
            key={template.id}
            className="flex-shrink-0 rounded-full flex items-center transition-all active:scale-95 relative overflow-hidden"
            style={{ 
              padding: '2vw 4vw', 
              gap: '2vw', 
              backgroundColor: 'var(--neutral-light)',
              border: '1px solid var(--neutral-light)',
              position: 'relative'
            }}
            onClick={() => window.location.href = `/chat/new?prompt=${encodeURIComponent(template.text)}`}
          >
            <span style={{ fontSize: '4vw' }}>{template.icon}</span>
            <span className="text-gray-700" style={{ fontSize: '3.5vw' }}>{template.text}</span>
          </button>
        ))}
      </div>
      
      <h3 className="font-semibold text-gray-900" style={{ fontSize: '4vw', marginBottom: '3vh' }}>Recommended Products</h3>
        
      <div className="flex overflow-x-auto scrollbar-hide pb-2" style={{ gap: '3vw', marginLeft: '-5vw', marginRight: '-5vw', paddingLeft: '5vw', paddingRight: '5vw' }}>
        {recommendations.map((product) => (
          <div key={product.id} className="bg-white shadow-sm flex-shrink-0" style={{ borderRadius: '4vw', padding: '4vw', width: '40vw', backgroundColor: 'white', border: '1px solid var(--neutral-light)' }}>
            <div className="text-center">
              <div style={{ fontSize: '8vw', marginBottom: '2vw' }}>{product.icon}</div>
              <p className="font-medium text-gray-900" style={{ fontSize: '3.5vw' }}>{product.name}</p>
              <p className="text-gray-600" style={{ fontSize: '3vw' }}>{product.brand}</p>
              <p className="font-medium text-gray-700" style={{ fontSize: '3vw', marginTop: '1vh' }}>{product.dosage}</p>
              <p className="text-gray-500" style={{ fontSize: '2.8vw', marginTop: '0.5vh' }}>{product.timing}</p>
              
              {product.inPantry ? (
                <div className="text-center" style={{ marginTop: '3vh' }}>
                  <span className="px-3 py-1 rounded-full font-medium text-white" style={{ fontSize: '3vw', background: 'var(--accent-green)' }}>
                    ✓ In Pantry
                  </span>
                </div>
              ) : (
                <div className="flex items-stretch" style={{ marginTop: '3vh', gap: '1.5vw', height: '9.5vw' }}>
                  <button 
                    className="flex-1 rounded-lg font-medium transition-all active:scale-95 hover:bg-gray-100 flex items-center justify-center" 
                    style={{ 
                      fontSize: '3.2vw', 
                      backgroundColor: '#fafafa', 
                      color: '#374151', 
                      border: '1px solid #f3f4f6',
                      fontWeight: '500'
                    }}
                    onClick={() => window.location.href = `/pantry?add=${encodeURIComponent(product.name)}`}
                  >
                    Have it
                  </button>
                  <button 
                    className="rounded-lg transition-all active:scale-95 hover:opacity-90 flex items-center justify-center flex-shrink-0" 
                    style={{ 
                      width: '9.5vw',
                      backgroundColor: 'rgba(143, 173, 143, 0.15)', 
                      color: 'var(--accent)', 
                      border: '1px solid rgba(143, 173, 143, 0.3)',
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                    }}
                    onClick={() => window.open(`https://www.amazon.com/s?k=${encodeURIComponent(product.name + ' ' + product.brand)}`, '_blank')}
                    aria-label="Shop for this product"
                  >
                    <svg style={{ width: '4.8vw', height: '4.8vw' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="9" cy="21" r="1" fill="currentColor"/>
                      <circle cx="20" cy="21" r="1" fill="currentColor"/>
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>


      {/* Already Have Section */}
      {inPantryItems.length > 0 && (
        <div className="rounded-2xl" style={{ padding: '4vw', marginTop: '4vh', backgroundColor: 'rgba(143, 173, 143, 0.08)' }}>
          <h3 className="font-medium" style={{ fontSize: '3.8vw', marginBottom: '2vh', color: 'var(--accent-dark)' }}>You already have:</h3>
          <div className="flex flex-wrap" style={{ gap: '2vw' }}>
            {inPantryItems.map((item) => (
              <button
                key={item.id}
                className="underline"
                style={{ fontSize: '3.5vw', color: 'var(--accent)' }}
              >
                {item.name} ({item.dosage})
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}