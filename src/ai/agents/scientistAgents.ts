import { LLMService } from '../llmService.js';

export interface AgentResponse {
    agent: string;
    content: string;
}

export abstract class ScientistAgent {
    protected llm: LLMService;
    public name: string;
    public domain: string;

    constructor(name: string, domain: string, llm: LLMService) {
        this.name = name;
        this.domain = domain;
        this.llm = llm;
    }

    protected abstract getSystemPrompt(): string;

    async analyze(query: string, projectContext?: string): Promise<string> {
        const prompt = `
        You are a ${this.domain} scientist helping design and debug the Aetherius simulation.
        Use the provided project context as ground truth. If information is missing, say what telemetry is needed.
        Produce actionable guidance, not generic science.

        Project Context:
        ${projectContext || '(none)'}

        Query: "${query}"

        Output:
        - Diagnosis / hypothesis (bullets)
        - Proposed changes (bullets)
        - What to log next tick (bullets)
        `;
        return await this.llm.generateResponse(prompt, this.getSystemPrompt());
    }

    async review(peerResponse: AgentResponse, query: string, projectContext?: string): Promise<string> {
        const prompt = `
        You are a ${this.domain} scientist in a peer review panel for the Aetherius simulation.
        Use the project context. Flag advice that is not implementable in this codebase.

        Project Context:
        ${projectContext || '(none)'}
        
        Peer Hypothesis: "${peerResponse.content}"

        Critique it from your perspective, focusing on correctness and implementability.
        Output 3-5 bullet points.
        `;
        return await this.llm.generateResponse(prompt, this.getSystemPrompt());
    }
}

export class NetworkScienceAgent extends ScientistAgent {
    constructor(llm: LLMService) {
        super('Dr. Watts', 'Network Science', llm);
    }

    protected getSystemPrompt(): string {
        return "You are a network science researcher. You model movement trails as weighted graphs with reinforcement and decay. You propose scalable algorithms, avoid O(N^2), and care about emergent structure.";
    }
}

export class EcologyAgent extends ScientistAgent {
    constructor(llm: LLMService) {
        super('Dr. Odum', 'Ecology', llm);
    }

    protected getSystemPrompt(): string {
        return "You are an ecologist. You think in terms of trophic flows, resource limitation, carrying capacity, and stability. You propose mechanics that create interesting but robust equilibria.";
    }
}

export class EvolutionAgent extends ScientistAgent {
    constructor(llm: LLMService) {
        super('Dr. Fisher', 'Evolution', llm);
    }

    protected getSystemPrompt(): string {
        return "You are an evolutionary biologist and geneticist. You reason about selection pressure, fitness landscapes, and heritable traits. You propose measurable fitness metrics and mutation/selection operators.";
    }
}

export class ClimateHydrologyAgent extends ScientistAgent {
    constructor(llm: LLMService) {
        super('Dr. Lorenz', 'Climate & Hydrology', llm);
    }

    protected getSystemPrompt(): string {
        return "You are a climate and hydrology scientist. You focus on temperature, moisture, wildfire/flood regimes, and seasonal forcing. You propose simple stable models that map well to grid layers.";
    }
}
