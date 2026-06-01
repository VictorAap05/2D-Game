import BaseScene from './BaseScene.js';

/**
 * Level2Scene
 * Nivel 2. Usa el mismo mapa que el nivel 3 como fallback
 * hasta que se añada mapa2.json al proyecto.
 */
export default class Level2Scene extends BaseScene {

    constructor() {
        super('Level2Scene');
        this.mapKey    = 'map3';   // reutilizamos mapa3 hasta que exista mapa2
        this.levelName = 'Level2Scene';
        this.levelNum  = 2;
        this.nextLevel = 'Level3Scene';
        this.spawnX    = 100;
        this.spawnY    = 300;
    }

    create() {
        super.create();
    }

    update() {
        super.update();
    }
}
