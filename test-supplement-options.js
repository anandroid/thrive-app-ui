const testSupplementOptions = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/assistant/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'What supplements can help me sleep better?',
        threadId: null
      })
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'delta') {
              fullContent += data.content;
            } else if (data.type === 'completed') {
              fullContent = data.content;
            }
          } catch {}
        }
      }
    }

    // Parse final response
    console.log('\nFull content length:', fullContent.length);
    if (!fullContent) {
      console.log('ERROR: No content received');
      return;
    }
    
    try {
      const parsed = JSON.parse(fullContent);
      console.log('\n=== SUPPLEMENT OPTIONS TEST ===\n');
      
      if (parsed.actionableItems) {
        console.log('Total actionable items:', parsed.actionableItems.length);
        console.log('\nActionable items:');
        
        parsed.actionableItems.forEach((item, i) => {
          console.log(`\n${i+1}. Type: ${item.type}`);
          console.log(`   Title: ${item.title}`);
          if (item.productName) console.log(`   Product: ${item.productName}`);
        });
        
        // Check for buy actions
        const buyActions = parsed.actionableItems.filter(item => item.type === 'buy');
        console.log(`\n✓ Found ${buyActions.length} buy actions`);
        
        // Check for already_have actions
        const alreadyHaveActions = parsed.actionableItems.filter(item => item.type === 'already_have');
        console.log(`✓ Found ${alreadyHaveActions.length} already_have actions`);
        
        if (buyActions.length > 0 && alreadyHaveActions.length === 0) {
          console.log('\n❌ ERROR: Buy actions found but NO already_have options!');
          console.log('This indicates the post-processing is not working.');
        } else if (alreadyHaveActions.length > 0) {
          console.log('\n✅ SUCCESS: Already have options are present!');
        }
      }
      
      // Also show raw response for debugging
      console.log('\n=== RAW ACTIONABLE ITEMS ===');
      console.log(JSON.stringify(parsed.actionableItems, null, 2));
      
    } catch (e) {
      console.error('Parse error:', e.message);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
};

testSupplementOptions();