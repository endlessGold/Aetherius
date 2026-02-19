import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

async function main() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    console.error('GEMINI_API_KEY is not set in .env or environment variables.');
    process.exit(1);
  }

  const model = (process.env.GEMINI_MODEL?.trim() || 'gemini-3-pro-preview');

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model,
      contents: 'Say hello from Aetherius in one short sentence.',
    });
    console.log('--- LLM quick test response ---');
    console.log(response.text);
  } catch (e) {
    console.error('LLM quick test failed:');
    console.error(e);
    process.exit(1);
  }
}

main();

