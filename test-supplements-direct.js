const testSupplements = async () => {
  try {
    console.log('Sending request for supplement recommendations...');
    const response = await fetch('http://localhost:3000/api/assistant/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'I need magnesium supplements for sleep',
        threadId: null
      })
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';
    let receivedComplete = false;

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
              receivedComplete = true;
            }
          } catch (e) {}
        }
      }
    }

    if (!receivedComplete || !fullContent) {
      console.log('ERROR: Did not receive complete response');
      return;
    }

    // Parse response
    const parsed = JSON.parse(fullContent);
    
    console.log('\n=== ACTIONABLE ITEMS ===');
    if (parsed.actionableItems) {
      parsed.actionableItems.forEach((item, i) => {
        console.log(`\n${i+1}. ${item.title}`);
        console.log(`   Type: ${item.type}`);
        if (item.productName) console.log(`   Product: ${item.productName}`);
      });
      
      const buyCount = parsed.actionableItems.filter(i => i.type === 'buy').length;
      const alreadyHaveCount = parsed.actionableItems.filter(i => i.type === 'already_have').length;
      
      console.log(`\nSummary:`);
      console.log(`- Buy options: ${buyCount}`);
      console.log(`- Already have options: ${alreadyHaveCount}`);
      
      if (buyCount > 0 && alreadyHaveCount === 0) {
        console.log('\n❌ ISSUE: Buy options exist but no "I already have it" options!');
      } else if (alreadyHaveCount > 0) {
        console.log('\n✅ SUCCESS: "I already have it" options are present!');
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
};

testSupplements();