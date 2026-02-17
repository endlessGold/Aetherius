import { Entity } from '../node.js';
import { NodeInterface } from '../interfaces.js';
import { PlaceData } from '../../components/entityData.js';
import { ComponentBase } from '../interfaces.js';

// Place Component to wrap PlaceData
export class PlaceComponent extends ComponentBase<PlaceData> {
    name = 'PlaceData';
    constructor(initial: Partial<PlaceData> = {}) {
        super({
            identity: initial.identity ?? { name: 'Unknown Place', type: 'Generic' },
            position: initial.position ?? { x: 0, y: 0 },
            maze: initial.maze ?? {
                radius: 5,
                activityLevel: 50,
                connections: new Map<string, number>(),
                createdAt: Date.now()
            }
        } as PlaceData);
    }
}

export class Place extends Entity implements NodeInterface {
    constructor(id: string, name: string, x: number, y: number) {
        super(id, 'Place');
        
        // Add PlaceComponent
        this.addComponent(new PlaceComponent({
            identity: { name, type: 'Natural' },
            position: { x, y },
            maze: {
                radius: 5,
                activityLevel: 50,
                connections: new Map(),
                createdAt: Date.now()
            }
        }));
    }

    // Helper accessors
    get data(): PlaceData {
        return this.getComponent('PlaceData')?.state as PlaceData;
    }
    
    get position() {
        return this.data.position;
    }

    get maze() {
        return this.data.maze;
    }
}
