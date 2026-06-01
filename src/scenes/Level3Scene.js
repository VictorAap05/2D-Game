import BaseScene from './BaseScene.js';

/**
 * Level3Scene
 * Nivel completo: monedas, bombas, impulsor, pinchos, meta y enemigos.
 * Es el nivel principal del proyecto.
 */
export default class Level3Scene extends BaseScene {

    constructor() {
        super('Level3Scene');
        this.mapKey    = 'map3';
        this.levelName = 'Level3Scene';
        this.levelNum  = 3;
        this.nextLevel = 'MenuScene'; // Último nivel → regresa al menú
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
