'use client';

import React, { useEffect, useState } from 'react';

export function KeyboardDebugPanel() {
  const [debugInfo, setDebugInfo] = useState({
    cssVar: '0px',
    bodyClass: false,
    containerBottom: '0px',
    containerFound: false,
    messageCount: 0,
    lastMessage: '',
    rawHeight: '0px',
    platform: ''
  });

  useEffect(() => {
    const updateDebugInfo = () => {
      const rootStyle = getComputedStyle(document.documentElement);
      const cssVarValue = rootStyle.getPropertyValue('--keyboard-height').trim() || '0px';
      const hasClass = document.body.classList.contains('keyboard-visible');
      
      const container = document.querySelector('.chat-container');
      let containerBottom = 'not found';
      let containerFound = false;
      
      if (container) {
        containerFound = true;
        const styles = getComputedStyle(container);
        containerBottom = styles.bottom;
      }
      
      setDebugInfo(prev => ({
        ...prev,
        cssVar: cssVarValue,
        bodyClass: hasClass,
        containerBottom,
        containerFound
      }));
    };

    // Listen for messages
    const handleMessage = (event: MessageEvent) => {
      try {
        if (typeof event.data === 'string') {
          const data = JSON.parse(event.data);
          if (data.type === 'keyboard_height_changed') {
            setDebugInfo(prev => ({
              ...prev,
              messageCount: prev.messageCount + 1,
              lastMessage: `height: ${data.payload.height}, visible: ${data.payload.visible}`,
              rawHeight: data.payload.rawHeight ? `${data.payload.rawHeight}px` : prev.rawHeight,
              platform: data.payload.platform || prev.platform
            }));
          }
        }
      } catch {
        // Ignore
      }
    };

    window.addEventListener('message', handleMessage);
    const interval = setInterval(updateDebugInfo, 500);

    updateDebugInfo();

    return () => {
      window.removeEventListener('message', handleMessage);
      clearInterval(interval);
    };
  }, []);

  // Test functions
  const simulateKeyboard = (height: number) => {
    window.postMessage(JSON.stringify({
      type: 'keyboard_height_changed',
      payload: {
        height,
        visible: height > 0,
        duration: 250
      }
    }), '*');
  };

  const directManipulation = (height: number) => {
    document.documentElement.style.setProperty('--keyboard-height', `${height}px`);
    if (height > 0) {
      document.body.classList.add('keyboard-visible');
    } else {
      document.body.classList.remove('keyboard-visible');
    }
  };

  const checkStyles = () => {
    const container = document.querySelector('.chat-container');
    if (container) {
      const styles = getComputedStyle(container);
      console.group('Chat Container Styles');
      console.log('position:', styles.position);
      console.log('bottom:', styles.bottom);
      console.log('transition:', styles.transition);
      console.log('height:', styles.height);
      console.log('CSS specificity check:');
      
      // Check which rules are applying
      const rules = Array.from(document.styleSheets)
        .flatMap(sheet => {
          try {
            return Array.from(sheet.cssRules || []);
          } catch {
            return [];
          }
        })
        .filter(rule => {
          if (rule instanceof CSSStyleRule) {
            return rule.selectorText && rule.selectorText.includes('chat-container');
          }
          return false;
        }) as CSSStyleRule[];
      
      rules.forEach(rule => {
        console.log('Rule:', rule.selectorText, rule.style.bottom);
      });
      
      console.groupEnd();
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: 10,
      left: 10,
      right: 10,
      background: 'rgba(0, 0, 0, 0.9)',
      color: 'white',
      padding: '15px',
      borderRadius: '8px',
      fontSize: '12px',
      zIndex: 9999,
      fontFamily: 'monospace',
      maxWidth: '400px'
    }}>
      <h4 style={{ margin: '0 0 10px 0' }}>Keyboard Debug Panel</h4>
      
      <div style={{ display: 'grid', gap: '5px' }}>
        <div>CSS Var: <span style={{ color: '#10b981' }}>{debugInfo.cssVar}</span></div>
        <div>Body Class: <span style={{ color: debugInfo.bodyClass ? '#10b981' : '#ef4444' }}>
          {debugInfo.bodyClass ? 'keyboard-visible' : 'none'}
        </span></div>
        <div>Container Found: <span style={{ color: debugInfo.containerFound ? '#10b981' : '#ef4444' }}>
          {debugInfo.containerFound ? 'yes' : 'no'}
        </span></div>
        <div>Container Bottom: <span style={{ color: '#3b82f6' }}>{debugInfo.containerBottom}</span></div>
        <div>Raw Height: <span style={{ color: '#ec4899' }}>{debugInfo.rawHeight}</span></div>
        <div>Platform: <span style={{ color: '#8b5cf6' }}>{debugInfo.platform}</span></div>
        <div>Messages: <span style={{ color: '#f59e0b' }}>{debugInfo.messageCount}</span></div>
        {debugInfo.lastMessage && (
          <div>Last: <span style={{ color: '#8b5cf6' }}>{debugInfo.lastMessage}</span></div>
        )}
      </div>
      
      <div style={{ marginTop: '10px', display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
        <button 
          onClick={() => simulateKeyboard(300)}
          style={{ padding: '4px 8px', fontSize: '11px', cursor: 'pointer' }}
        >
          Msg 300px
        </button>
        <button 
          onClick={() => simulateKeyboard(0)}
          style={{ padding: '4px 8px', fontSize: '11px', cursor: 'pointer' }}
        >
          Msg Hide
        </button>
        <button 
          onClick={() => directManipulation(300)}
          style={{ padding: '4px 8px', fontSize: '11px', cursor: 'pointer' }}
        >
          Direct 300px
        </button>
        <button 
          onClick={() => directManipulation(0)}
          style={{ padding: '4px 8px', fontSize: '11px', cursor: 'pointer' }}
        >
          Direct Hide
        </button>
        <button 
          onClick={checkStyles}
          style={{ padding: '4px 8px', fontSize: '11px', cursor: 'pointer' }}
        >
          Check Styles
        </button>
      </div>
    </div>
  );
}