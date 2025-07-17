const { RoutineCreationService } = require('./src/services/openai/routines/routineCreationService.ts');
require('dotenv').config({ path: '.env.local' });

console.log('Testing streaming directly...');

const service = new RoutineCreationService(process.env.THRIVE_OPENAI_API_KEY);

async function testStream() {
  try {
    console.log('Starting stream test...');
    let totalChunks = 0;
    let totalContent = '';
    
    await service.createRoutineStream({
      routineType: 'wellness_routine',
      healthConcern: 'test sleep',
      duration: '3_days',
      frequency: 'daily'
    }, {
      onChunk: (chunk) => {
        totalChunks++;
        totalContent += chunk;
        if (totalChunks % 10 === 0) {
          console.log(`Chunk ${totalChunks}, total length: ${totalContent.length}`);
        }
      },
      onComplete: (routine) => {
        console.log(`✅ Stream completed! Total chunks: ${totalChunks}, final length: ${totalContent.length}`);
        console.log('Routine keys:', Object.keys(routine));
      },
      onError: (error) => {
        console.error('❌ Stream error:', error.message);
      }
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testStream();