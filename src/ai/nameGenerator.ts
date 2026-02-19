import { PRNG } from './prng.js';

export class NameGenerator {
    private prng: PRNG;

    // Latin/Scientific feeling for plants
    private plantPrefixes = ['Syl', 'Flor', 'Ver', 'Arb', 'Fol', 'Herb', 'Xyl', 'Bot', 'Chlor', 'Rhiz', 'Am', 'Bel', 'Cera', 'Phy'];
    private plantRoots = ['va', 'o', 'ia', 'us', 'um', 'on', 'a', 'is', 'os', 'ys', 'ax', 'ix', 'ea', 'oa'];
    private plantSuffixes = ['phyte', 'sperm', 'flora', 'leaf', 'root', 'bloom', 'moss', 'fern', 'vine', 'th', 'dril', 'las'];

    // Alien/Fantasy feeling for creatures
    private creaturePrefixes = ['Vor', 'Xan', 'Gor', 'Thra', 'Kyl', 'Zor', 'Mor', 'Grim', 'Slith', 'Rax', 'Vel', 'Nyx', 'Kra', 'Tor'];
    private creatureRoots = ['go', 'ra', 'xi', 'tu', 'ba', 'ni', 'ko', 'ze', 'vu', 'ha'];
    private creatureSuffixes = ['ax', 'or', 'ix', 'on', 'ar', 'us', 'ak', 'th', 'os', 'im', 'al', 'en', 'is', 'ur'];

    constructor(seed: number = 12345) {
        this.prng = new PRNG(seed);
    }

    private pick(list: string[]): string {
        return list[this.prng.nextInt(list.length)];
    }

    // e.g., Florvaphyte, Arbofern
    generatePlantName(): string {
        const prefix = this.pick(this.plantPrefixes);
        const root = this.prng.nextFloat01() > 0.3 ? this.pick(this.plantRoots) : '';
        const suffix = this.pick(this.plantSuffixes);
        return `${prefix}${root}${suffix}`;
    }

    // e.g., Vorax, Zorth
    generateCreatureName(): string {
        const prefix = this.pick(this.creaturePrefixes);
        const root = this.prng.nextFloat01() > 0.5 ? this.pick(this.creatureRoots) : '';
        const suffix = this.pick(this.creatureSuffixes);
        return `${prefix}${root}${suffix}`;
    }
}
