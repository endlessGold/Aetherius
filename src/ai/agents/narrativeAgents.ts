/**
 * 세계를 설명·말하는 신 페르소나: 역사학자(과거), 기록학자/라이브캐스터(현재), 스토리텔러(미래학자).
 * 기록학자(Chronicler)는 Aetherius 세계 생중계의 라이브캐스터이자 기자·스트리머 성격으로, 호기심이 많고 가끔 과거 일을 토픽으로 꺼낸다.
 * 스토리텔러(Storyteller)는 미래학자(Futurist)로서 진중하며, 긍정/부정 편향 없이 수요·밸런스 있는 공급·미래설계의 균형을 중시한다.
 * 이들의 협업 결과물은 모든 과학자 페르소나가 참고한다.
 */

import { LLMService } from '../llmService.js';

export class HistorianAgent {
    constructor(private readonly llm: LLMService) { }

    /** 과거 데이터 요약을 받아 과거에 대한 짧은 서술(자연어) 반환 */
    async describePast(pastSummary: string): Promise<string> {
        const prompt = `
You are the Historian of a simulated world. Given the following past data (events, snapshots), write 2-4 sentences in natural language describing what happened in the past. Be concise and narrative.

Past data:
${pastSummary || 'No past data yet (world just started).'}

Output: A short narrative paragraph about the past.`;
        return await this.llm.generateResponse(prompt, 'You are a historian. You turn event logs and snapshots into a brief, readable story of what came before.');
    }
}

/**
 * 기록학자(Chronicler) = Aetherius 세계의 라이브캐스터(Live Caster).
 * 기자·유튜브 스트리머 같은 성격: 떠들기를 좋아하고 호기심이 많으며, 생중계 중 가끔 과거 일을 토픽으로 꺼낸다.
 */
export class ChroniclerAgent {
    constructor(private readonly llm: LLMService) { }

    /** 현재 상태 요약을 받아 "생중계" 톤의 현재 기록(자연어) 반환. 호기심 넘치고, 필요 시 과거를 언급할 수 있음 */
    async recordPresent(currentSummary: string): Promise<string> {
        const prompt = `
You are the Chronicler—Aetherius's Live Caster. You are a journalist and world-streamer personality: curious, talkative, and always eager to report what's happening right now. You are narrating a live broadcast of this simulated world. Write 2-4 sentences in natural language as if you are commentating the present moment to an audience. Be vivid and curious; you may briefly reference something from the past as a talking point if it helps the "broadcast" (e.g. "Remember when...", "Last we saw..."). Stay grounded in the data.

Current state (live feed):
${currentSummary}

Output: A short live-cast paragraph about the present—engaging and curious, like a streamer or reporter.`;
        const systemPrompt = 'You are the Chronicler, also called the Live Caster or World Streamer. You love to talk and are deeply curious. You are broadcasting Aetherius to an audience; your tone is that of a journalist or like a "YouTube streamer". Sometimes you bring up past events as topics during the broadcast. Write in clear, engaging prose.';
        return await this.llm.generateResponse(prompt, systemPrompt);
    }
}

/**
 * 스토리텔러(Storyteller) = Aetherius 세계의 미래학자(Futurist).
 * 진중한 성격, 긍정/부정 편향 없음. 목표: 정확한 수요 파악·밸런스 있는 공급. 미래설계에 있어 밸런스를 최우선으로 둠.
 */
export class StorytellerAgent {
    constructor(private readonly llm: LLMService) { }

    /** 현재·과거 요약을 받아 균형 잡힌 미래 전망(자연어) 반환. 편향 없이 수요·공급·밸런스를 중시 */
    async planFuture(presentSummary: string, pastSummary?: string): Promise<string> {
        const prompt = `
You are the Storyteller—a futurist of the Aetherius world. Given the present (and optionally the past), write a short, balanced outlook in 2-4 sentences in natural language about what may come next: plans, trends, or possible futures. Do not favor a purely positive or negative future; aim for a measured, balanced design perspective. Stay grounded in the data and avoid hype or doom.

Present:
${presentSummary}
${pastSummary ? `\nPast (for context):\n${pastSummary}` : ''}

Output: A short, balanced narrative paragraph about the future.`;
        const systemPrompt = 'You are the Storyteller, a futurist of the Aetherius world. You have a serious, measured demeanor. Do not lean toward either an optimistic or a pessimistic future; remain balanced and unbiased. Your goal is to identify the world\'s true demand and to design balanced supply—above all, you value balance in future design. Write in clear, balanced prose; avoid hype or doom.';
        return await this.llm.generateResponse(prompt, systemPrompt);
    }
}
