/**
 * LLM을 사용해 AI 출력을 한국어로 번역.
 * 모든 프롬프트는 영어로 보내고, 사용자가 번역 옵션을 선택했을 때만 출력을 한국어로 변환한다.
 */

import type { LLMService } from './llmService.js';

const TRANSLATE_SYSTEM = 'You are a translator. Output only the Korean translation. Preserve meaning, tone, and structure (e.g. markdown, line breaks). Do not add explanations or notes.';
const TRANSLATE_PROMPT_PREFIX = 'Translate the following English text to Korean. Output only the translation.\n\n';

/**
 * 영어 텍스트를 한국어로 번역한다. LLM 호출 1회.
 * 실패 시 원문을 그대로 반환한다.
 */
export async function translateToKorean(llm: LLMService, text: string): Promise<string> {
  if (!text || !text.trim()) return text;
  try {
    const out = await llm.generateResponse(TRANSLATE_PROMPT_PREFIX + text, TRANSLATE_SYSTEM);
    return (out && out.trim()) ? out.trim() : text;
  } catch {
    return text;
  }
}
