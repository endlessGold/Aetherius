
/**
 * 1. 위상 기하학 (Topology) - 거시적 육체의 부재
 */
export interface Topology {
    /** 뼈가 존재하지 않음 (undefined) */
    skeletal_density?: number;
    /** 관절이 존재하지 않음 (undefined) */
    articulation_nodes?: number;
    /** 세포막 유동성. 높을수록 물리적 충격을 유연하게 흘려보내지만, 화학적 공격에 취약함. (0.0 ~ 1.0) */
    membrane_fluidity?: number;
    /** 세포골격 강도. 다른 세포에게 먹힐 때(Phagocytosis) 저항하는 수치. */
    cytoskeleton_integrity?: number;
}

/**
 * 2. 대사 엔진 (Metabolic Engine) - 원초적 탐욕
 */
export interface MetabolicEngine {
    /** 매 틱당 생성하는 에너지(ATP). */
    atp_generation_rate: number;
    /** 에너지 흡수 방식 (예: PHAGOCYTOSIS, PHOTOSYNTHESIS, CHEMOSYNTHESIS) */
    absorption_method: 'PHAGOCYTOSIS' | 'PHOTOSYNTHESIS' | 'CHEMOSYNTHESIS' | string;
    starvation_response: {
        /** 태울 살점이 없음 (undefined) */
        tissue_sacrifice_ratio?: number;
        /** 에너지가 고갈되면 단단한 포자(Spore) 형태로 굳어 수십만 틱을 동면하며 버팀. */
        sporulation_trigger: boolean;
    };
}

/**
 * 3. 신경 및 감각 (Nervous & Sensory) - 이성과 고통의 부재
 */
export interface NervousSystem {
    // 뇌나 신경망이 없으므로 고통이나 공포를 느끼지 않음. 오직 반응만 존재함.
    /** 신경망 복잡도 (undefined for simple cells) */
    complexity?: number;
}

export interface Chemotaxis {
    /** 화학주성. 주변의 아미노산(먹이) 농도가 높은 곳으로 맹목적으로 돌진함. (감지 반경 microns) */
    sensitivity_radius_microns: number;
    /** 유인 물질 (예: AMINO_ACID_GRADIENT) */
    attractant: string;
    /** 기피 물질 (예: TOXIC_METABOLITES - 타 개체가 뿜어내는 독성 배설물을 회피) */
    repellent?: string;
}

export interface SensoryArray {
    /** 눈이 없음 (undefined) */
    vision_spectrum?: string;
    chemotaxis?: Chemotaxis;
}

/**
 * 4. 포식 및 전투 기제 (Microscopic Warfare) - 이빨 대신 산성액
 */
export interface LysisEnzymes {
    /** 용해 효소. 물리적 타격 대신 상대의 세포벽(데이터)을 화학적으로 녹여버리는 공격 방식. (분비량) */
    secretion_rate: number;
    /** 특정 세포벽 구조를 가진 개체에게 치명적인 데미지를 가함. (예: PEPTIDOGLYCAN) */
    target_bond: string;
}

export interface ChemicalWarfare {
    lysis_enzymes?: LysisEnzymes;
    /** 다른 개체가 뿜어내는 소화액에 견디는 내성 수치. (0.0 ~ 1.0) */
    toxin_resistance: number;
}

export interface PredatoryArray {
    // 발톱이나 턱 같은 물리적 무기가 없음. 대신 화학 무기를 사용.
    physical_damage?: number;
}

/**
 * 5. 이동 기제 (Locomotion)
 */
export interface Locomotion {
    /** 이동 방식 (예: FLAGELLAR_PROPULSION - 편모 추진) */
    primary_method: 'FLAGELLAR_PROPULSION' | 'CILIA_BEATING' | 'AMOEBOID_MOVEMENT' | string;
    /** 기본 이동 속도 (microns/sec) */
    base_speed_microns_per_sec: number;
}

/**
 * 6. 번식 및 데이터 탈취 (Propagation & DNA Theft)
 */
export interface HorizontalGeneTransfer {
    /** 활성화 여부 */
    active: boolean;
    /** 성공 확률 (0.0 ~ 1.0) */
    theft_success_rate: number;
}

export interface ReproductiveCycle {
    /** 번식 방식 (예: BINARY_FISSION - 이분법) */
    method: 'BINARY_FISSION' | 'SEXUAL_REPRODUCTION' | 'BUDDING' | string;
    /** 교미 기준 (undefined for asexual) */
    mating_criteria?: string;
    /** 수평적 유전자 전달(HGT). 자신에게 유리한 특성이 없다면, 주변에 죽어있는 다른 개체의 DNA 파편을 강제로 흡수. */
    horizontal_gene_transfer?: HorizontalGeneTransfer;
}

/**
 * 전체 생명체 데이터 모델 (Entity Data Model)
 */
export interface BiologicalEntity {
    entity_id: string;
    /** 킬로그램(kg)이 아닌 피코그램(pg) 단위의 미세한 질량. */
    biomass_picograms: number;

    topology: Topology;
    metabolic_engine: MetabolicEngine;

    nervous_system?: NervousSystem; // undefined means no nervous system
    sensory_array: SensoryArray;

    predatory_array?: PredatoryArray; // undefined means no physical weapons
    chemical_warfare?: ChemicalWarfare;

    locomotion: Locomotion;
    reproductive_cycle: ReproductiveCycle;

    // 7. 시각적 표현 (Visual Representation)
    visuals?: {
        glyph: string; // CLI 맵에서 보여질 문자 (예: 'o', '@')
        color: string; // ANSI 색상 코드 또는 이름 (예: '#00FF00', 'green')
        description: string; // 생김세 묘사
    };
}
