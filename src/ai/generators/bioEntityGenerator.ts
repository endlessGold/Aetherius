import { ControlService } from '../llmService.js';
import { BiologicalEntity } from '../../core/bio/types.js';

/**
 * Input request for generating a BiologicalEntity
 */
export interface BioEntityGenerationRequest {
  /** Natural language description of the species */
  description: string;
  /** Primary language of the description (default: 'ko') */
  language?: 'ko' | 'en';
  /** 
   * Partial parameters to enforce. 
   * Any fields present here will be preserved and not overwritten by LLM.
   */
  partialParams?: Partial<BiologicalEntity>;
  /**
   * Policy for handling missing required fields.
   * - ASK: Return suggestions and ask for confirmation (not fully implemented in v1, falls back to AUTO_FILL with notes)
   * - AUTO_FILL: Automatically fill missing fields based on description/logic
   * - STRICT_MANUAL: Fail if required fields are missing (not recommended for this generator)
   */
  policy?: 'ASK' | 'AUTO_FILL' | 'STRICT_MANUAL';
  /** Detail level for generation (default: 'MEDIUM') */
  detailLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
}

/**
 * Output response from the generator
 */
export interface BioEntityGenerationResponse {
  /** The generated entity model */
  model?: BiologicalEntity;
  /** Result status */
  status: 'SUCCESS' | 'MISSING_FIELDS' | 'ERROR';
  /** Explanation or notes from the generator */
  message: string;
  /** 
   * For 'MISSING_FIELDS' or 'ASK' policy, this contains the draft model 
   * that needs user review.
   */
  draft?: BiologicalEntity;
}

export class BioEntityGenerator {
  private control: ControlService;

  constructor(control: ControlService) {
    this.control = control;
  }

  /**
   * Generates a BiologicalEntity based on the provided request.
   */
  async generate(request: BioEntityGenerationRequest): Promise<BioEntityGenerationResponse> {
    const lang = request.language || 'ko';
    const policy = request.policy || 'AUTO_FILL';
    
    // Construct the system prompt
    const systemPrompt = `
You are an advanced Bio-Engineer AI for the Aetherius simulation.
Your task is to generate a JSON object matching the 'BiologicalEntity' TypeScript interface based on a natural language description.

Rules:
1. Output ONLY valid JSON. No markdown, no comments.
2. Adhere strictly to the field types (number, string enum, etc.).
3. If the user provides specific traits, reflect them in the parameters.
4. For unspecified traits, infer reasonable values based on the description and biological plausibility.
5. 'entity_id' should be uppercase, unique-sounding (e.g., CELL-00X-NAME).
6. 'biomass_picograms' is in picograms (1e-12 kg). Typical range: 0.1 (virus) to 1e6 (large amoeba).
7. Ensure all required fields (non-optional in interface) are filled.

Interface Definition (Simplified):
interface BiologicalEntity {
  entity_id: string;
  biomass_picograms: number;
  topology: { skeletal_density?, articulation_nodes?, membrane_fluidity?, cytoskeleton_integrity? };
  metabolic_engine: { atp_generation_rate, absorption_method, starvation_response: { tissue_sacrifice_ratio?, sporulation_trigger } };
  nervous_system?: { complexity? };
  sensory_array: { vision_spectrum?, chemotaxis?: { sensitivity_radius_microns, attractant, repellent? } };
  predatory_array?: { physical_damage? };
  chemical_warfare?: { lysis_enzymes?: { secretion_rate, target_bond }, toxin_resistance };
  locomotion: { primary_method, base_speed_microns_per_sec };
  reproductive_cycle: { method, mating_criteria?, horizontal_gene_transfer?: { active, theft_success_rate } };
  visuals?: { glyph, color, description };
}
`;

    // Construct the user prompt
    const userPrompt = `
Request: Generate a BiologicalEntity.
Description: "${request.description}"
Language: ${lang}
Detail Level: ${request.detailLevel || 'MEDIUM'}
Policy: ${policy}

${request.partialParams ? `Enforced Partial Parameters (Merge these into result): ${JSON.stringify(request.partialParams)}` : ''}

Generate the full JSON object.
`;

    try {
      const responseText = await this.control.generateResponse(userPrompt, systemPrompt);
      
      // Basic JSON cleaning
      const jsonStart = responseText.indexOf('{');
      const jsonEnd = responseText.lastIndexOf('}');
      if (jsonStart === -1 || jsonEnd === -1) {
        const fallback = this.createFallbackModel(request);
        const merged = request.partialParams ? this.mergeTopLevel(fallback, request.partialParams) : fallback;
        return { status: 'SUCCESS', message: 'Control Service unavailable. Fallback model generated.', model: merged };
      }
      
      const cleanJson = responseText.substring(jsonStart, jsonEnd + 1);
      const generatedModel = JSON.parse(cleanJson) as BiologicalEntity;

      // Merge partial params if they exist (double check enforcement)
      if (request.partialParams) {
        Object.assign(generatedModel, request.partialParams);
      }

      // Validation (Simple check for required fields)
      if (!generatedModel.entity_id || !generatedModel.metabolic_engine || !generatedModel.topology || !generatedModel.sensory_array || !generatedModel.locomotion || !generatedModel.reproductive_cycle) {
        if (policy === 'AUTO_FILL') {
          const filled = this.fillDefaults(generatedModel, request);
          return { status: 'SUCCESS', message: 'Model completed with defaults.', model: filled };
        }
        return { status: 'MISSING_FIELDS', message: 'Generated model is missing critical fields.', draft: generatedModel };
      }

      return {
        status: 'SUCCESS',
        message: 'Successfully generated biological entity.',
        model: generatedModel
      };

    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      const fallback = this.createFallbackModel(request);
      const merged = request.partialParams ? this.mergeTopLevel(fallback, request.partialParams) : fallback;
      return { status: 'SUCCESS', message: `Fallback model generated due to error: ${msg}`, model: merged };
    }
  }

  private mergeTopLevel<T>(base: T, overlay: Partial<T>): T {
    return Object.assign({}, base, overlay);
  }

  private createFallbackModel(request: BioEntityGenerationRequest): BiologicalEntity {
    const id = `CELL-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`;
    const d = (request.detailLevel || 'MEDIUM').toUpperCase();
    const speed = d === 'LOW' ? 20 : d === 'HIGH' ? 50 : 30;
    const biomass = d === 'LOW' ? 30 : d === 'HIGH' ? 80 : 50;
    const resistance = d === 'LOW' ? 0.3 : d === 'HIGH' ? 0.7 : 0.5;
    const hgt = d === 'LOW' ? 0.05 : d === 'HIGH' ? 0.2 : 0.1;
    const chemRadius = d === 'LOW' ? 80 : d === 'HIGH' ? 150 : 100;
    return {
      entity_id: id,
      biomass_picograms: biomass,
      topology: {
        membrane_fluidity: 0.7,
        cytoskeleton_integrity: 50
      },
      metabolic_engine: {
        atp_generation_rate: 10,
        absorption_method: 'PHAGOCYTOSIS',
        starvation_response: {
          sporulation_trigger: true
        }
      },
      nervous_system: undefined,
      sensory_array: {
        chemotaxis: {
          sensitivity_radius_microns: chemRadius,
          attractant: 'AMINO_ACID_GRADIENT',
          repellent: 'TOXIC_METABOLITES'
        }
      },
      predatory_array: undefined,
      chemical_warfare: {
        toxin_resistance: resistance
      },
      locomotion: {
        primary_method: 'FLAGELLAR_PROPULSION',
        base_speed_microns_per_sec: speed
      },
      reproductive_cycle: {
        method: 'BINARY_FISSION',
        horizontal_gene_transfer: {
          active: true,
          theft_success_rate: hgt
        }
      },
      visuals: {
        glyph: 'o',
        color: 'green',
        description: request.description
      }
    };
  }

  private fillDefaults(model: BiologicalEntity, request: BioEntityGenerationRequest): BiologicalEntity {
    const base = this.createFallbackModel(request);
    const out: BiologicalEntity = {
      entity_id: model.entity_id || base.entity_id,
      biomass_picograms: model.biomass_picograms || base.biomass_picograms,
      topology: model.topology || base.topology,
      metabolic_engine: model.metabolic_engine || base.metabolic_engine,
      nervous_system: model.nervous_system,
      sensory_array: model.sensory_array || base.sensory_array,
      predatory_array: model.predatory_array,
      chemical_warfare: model.chemical_warfare || base.chemical_warfare,
      locomotion: model.locomotion || base.locomotion,
      reproductive_cycle: model.reproductive_cycle || base.reproductive_cycle,
      visuals: model.visuals || base.visuals
    };
    return out;
  }
}
