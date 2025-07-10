const testMessage = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/assistant/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'I have trouble sleeping at night',
        threadId: null
      })
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';
    let chunks = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      chunks.push(chunk);
      
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
    try {
      const parsed = JSON.parse(fullContent);
      console.log('\n=== QUESTIONS FORMAT TEST ===\n');
      
      if (parsed.questions && parsed.questions.length > 0) {
        const firstQ = parsed.questions[0];
        console.log('First question type:', typeof firstQ);
        
        if (typeof firstQ === 'string') {
          console.log('❌ STRING FORMAT (old)');
          console.log('Example:', firstQ);
        } else {
          console.log('✅ OBJECT FORMAT (enhanced)');
          console.log('Structure:', JSON.stringify(firstQ, null, 2));
        }
        
        console.log('\nAll questions:');
        parsed.questions.forEach((q, i) => {
          if (typeof q === 'string') {
            console.log(`${i+1}. "${q}"`);
          } else {
            console.log(`${i+1}. ${q.prompt} (type: ${q.type})`);
          }
        });
      }
    } catch (e) {
      console.error('Parse error:', e.message);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
};

testMessage();