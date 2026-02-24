
import { BiologicalEntity } from '../core/bio/types.js';

/**
 * 게임 내 생물 종 데이터셋 (Species Dataset)
 *
 * 이 데이터셋은 각 생물 종의 물리적, 화학적, 생물학적 특성을 정의합니다.
 * 초기 미생물부터 다세포 생물까지 진화의 단계를 포함할 수 있습니다.
 */
export const SpeciesLibrary: BiologicalEntity[] = [
  {
    "entity_id": "CELL-00A-PROKARYOTE",
    "biomass_picograms": 42.5, // 킬로그램(kg)이 아닌 피코그램(pg) 단위의 미세한 질량.

    // 1. 위상 기하학 (Topology) - 거시적 육체의 부재
    "topology": {
      "skeletal_density": undefined, // 뼈가 존재하지 않음.
      "articulation_nodes": undefined, // 관절이 존재하지 않음.
      "membrane_fluidity": 0.85,     // 세포막 유동성. 높을수록 물리적 충격을 유연하게 흘려보내지만, 화학적 공격에 취약함.
      "cytoskeleton_integrity": 40.0 // 세포골격 강도. 다른 세포에게 먹힐 때(Phagocytosis) 저항하는 수치.
    },

    // 2. 대사 엔진 (Metabolic Engine) - 원초적 탐욕
    "metabolic_engine": {
      "atp_generation_rate": 12.5,     // 매 틱당 생성하는 에너지(ATP).
      "absorption_method": "PHAGOCYTOSIS", // 식세포작용. 상대방을 통째로 집어삼켜 소화시킴.
      "starvation_response": {
        "tissue_sacrifice_ratio": undefined, // 태울 살점이 없음.
        "sporulation_trigger": true // 에너지가 고갈되면 단단한 포자(Spore) 형태로 굳어 수십만 틱을 동면하며 버팀.
      }
    },

    // 3. 신경 및 감각 (Nervous & Sensory) - 이성과 고통의 부재
    "nervous_system": undefined, // 뇌나 신경망이 없으므로 고통이나 공포를 느끼지 않음. 오직 반응만 존재함.
    "sensory_array": {
      "vision_spectrum": undefined, // 눈이 없음.
      "chemotaxis": {
        // 화학주성. 주변의 아미노산(먹이) 농도가 높은 곳으로 맹목적으로 돌진함.
        "sensitivity_radius_microns": 150,
        "attractant": "AMINO_ACID_GRADIENT",
        "repellent": "TOXIC_METABOLITES" // 타 개체가 뿜어내는 독성 배설물을 회피.
      }
    },

    // 4. 포식 및 전투 기제 (Microscopic Warfare) - 이빨 대신 산성액
    "predatory_array": undefined, // 발톱이나 턱 같은 물리적 무기가 없음. 대신 아래의 화학 무기를 사용.
    "chemical_warfare": {
      "lysis_enzymes": {
        // 용해 효소. 물리적 타격 대신 상대의 세포벽(데이터)을 화학적으로 녹여버리는 공격 방식.
        "secretion_rate": 2.5,
        "target_bond": "PEPTIDOGLYCAN" // 특정 세포벽 구조를 가진 개체에게 치명적인 데미지를 가함.
      },
      "toxin_resistance": 0.90 // 다른 개체가 뿜어내는 소화액에 견디는 내성 수치.
    },

    // 5. 이동 기제 (Locomotion)
    "locomotion": {
      "primary_method": "FLAGELLAR_PROPULSION", // 편모 추진. 꼬리 모양의 단백질을 회전시켜 액체 속을 헤엄침.
      "base_speed_microns_per_sec": 45.0
    },

    // 6. 번식 및 데이터 탈취 (Propagation & DNA Theft)
    "reproductive_cycle": {
      "method": "BINARY_FISSION", // 이분법. 자신을 정확히 반으로 쪼개어 증식.
      "mating_criteria": undefined, // 교미 개념이 없음.
      // [가장 노골적인 진화 본능] 수평적 유전자 전달(HGT).
      // 자신에게 유리한 특성이 없다면, 주변에 죽어있는 다른 개체의 DNA 파편(플라스미드)을 강제로 흡수하여 내 것으로 만듦.
      "horizontal_gene_transfer": {
        "active": true,
        "theft_success_rate": 0.15
      }
    },

    // 7. 시각적 표현 (Visual Representation)
    "visuals": {
      "glyph": "o",
      "color": "green",
      "description": "투명한 막으로 둘러싸인 작은 원형 생명체. 내부에 희미하게 DNA 가닥이 보인다."
    }
  },

  // Example of a slightly evolved variant
  {
    "entity_id": "CELL-00B-CYANOBACTERIA",
    "biomass_picograms": 55.0,

    "topology": {
      "skeletal_density": undefined,
      "articulation_nodes": undefined,
      "membrane_fluidity": 0.60, // 더 단단한 세포벽
      "cytoskeleton_integrity": 60.0
    },

    "metabolic_engine": {
      "atp_generation_rate": 8.0, // 광합성은 느리지만 꾸준함
      "absorption_method": "PHOTOSYNTHESIS", // 광합성
      "starvation_response": {
        "sporulation_trigger": false // 포자 형성 능력 상실
      }
    },

    "nervous_system": undefined,
    "sensory_array": {
      "chemotaxis": {
        "sensitivity_radius_microns": 100,
        "attractant": "LIGHT_GRADIENT", // 빛을 향해 이동
        "repellent": "SHADOW"
      }
    },

    "predatory_array": undefined,
    "chemical_warfare": {
      "toxin_resistance": 0.50
    },

    "locomotion": {
      "primary_method": "GLIDING", // 표면을 미끄러지듯 이동
      "base_speed_microns_per_sec": 15.0
    },

    "reproductive_cycle": {
      "method": "BINARY_FISSION",
      "horizontal_gene_transfer": {
        "active": false,
        "theft_success_rate": 0
      }
    },

    "visuals": {
      "glyph": "O",
      "color": "cyan",
      "description": "청록색 빛을 내는 광합성 세균. 표면에 기포가 맺혀 있다."
    }
  }
];
