'use client'

import { useEffect, useRef, useState } from 'react'
import { getPantryItems } from '@/src/utils/pantryStorage'

interface EmbeddedShopProps {
  height?: string
  url?: string
}

export default function EmbeddedShop({ 
  height = '100%', // Use full height within AppLayout
  url = process.env.NEXT_PUBLIC_SHOP_URL || 'http://localhost:3002'
}: EmbeddedShopProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Send pantry data to iframe when it loads
    const sendPantryData = () => {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        const pantryItems = getPantryItems()
        iframeRef.current.contentWindow.postMessage({
          type: 'pantry-data',
          items: pantryItems
        }, url)
      }
    }

    // Handle messages from the embedded shop
    const handleMessage = (event: MessageEvent) => {
      // Validate origin
      if (!event.origin.includes('localhost:3001') && !event.origin.includes('localhost:3002') && !event.origin.includes('shop.thriveful.app')) {
        return
      }

      // Handle different message types
      if (event.data.type === 'resize') {
        // Allow iframe to communicate height changes if needed
        if (iframeRef.current && event.data.height) {
          iframeRef.current.style.height = `${event.data.height}px`
        }
      } else if (event.data.type === 'request-pantry-data') {
        // Shop is requesting pantry data
        sendPantryData()
      } else if (event.data.type === 'open-pantry') {
        // Navigate to pantry page
        window.location.href = '/pantry'
      }
    }

    window.addEventListener('message', handleMessage)
    
    // Send pantry data after iframe loads
    if (!loading) {
      setTimeout(sendPantryData, 500)
    }

    return () => window.removeEventListener('message', handleMessage)
  }, [loading, url])

  const shopUrl = `${url}/embedded`

  return (
    <div style={{
      width: '100%',
      height: height,
      position: 'relative',
      backgroundColor: '#fafafa',
    }}>
      {loading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fafafa',
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              border: '4px solid #e5e7eb',
              borderTopColor: '#914372',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}></div>
            <p style={{
              color: '#6b7280',
              fontSize: '14px',
            }}>Loading shop...</p>
          </div>
          <style jsx>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}
      
      <iframe
        ref={iframeRef}
        src={shopUrl}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: loading ? 'none' : 'block',
        }}
        onLoad={() => setLoading(false)}
        allow="payment"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
        title="Thrive Shop"
      />
    </div>
  )
}