import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    console.error('GEMINI_API_KEY is not set in .env or environment variables.');
    process.exit(1);
  }

  const model = (process.env.GEMINI_MODEL?.trim() || 'gemini-3-flash-preview');
  console.log(`Using model: ${model}`);

  const ai = new GoogleGenAI({ apiKey });

  const maxRetries = 5;
  let backoffMs = 2000;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt + 1}...`);
      const response = await ai.models.generateContent({
        model,
        contents: 'Say hello from Aetherius in one short sentence.',
      });
      console.log('--- LLM quick test response ---');
      const txt = typeof response.text === 'function' ? response.text() : (response.response ? response.response.text() : JSON.stringify(response));
      console.log(txt);
      return; // Success
    } catch (e) {
      console.error(`Attempt ${attempt + 1} failed.`);
      const msg = e.message || String(e);
      
      if (msg.includes('429') || msg.toLowerCase().includes('resource_exhausted')) {
        const match = msg.match(/retry in ([0-9.]+)s/);
        let waitTime = backoffMs;
        if (match && match[1]) {
          waitTime = Math.ceil(parseFloat(match[1]) * 1000) + 1000;
        } else {
          waitTime = Math.max(backoffMs, 5000);
        }
        
        console.warn(`Rate limited. Retrying in ${waitTime}ms...`);
        await sleep(waitTime);
        backoffMs = Math.min(backoffMs * 2, 60000);
      } else {
        // Non-retryable error
        console.error(e);
        process.exit(1);
      }
    }
  }
  
  console.error('Max retries exceeded.');
  process.exit(1);
}

main();

