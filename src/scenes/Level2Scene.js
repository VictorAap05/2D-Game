import BaseScene from './BaseScene';

/*
=============================================
NIVEL 2
Igual que Level1Scene pero para el mapa 2.
=============================================
*/
export default class Level2Scene extends BaseScene {

    constructor() {
        super('Level2Scene');
        this.mapKey    = 'map2';   // cambia al key real cuando exista mapa2.json
        this.levelName = 'Level2Scene';
        this.spawnX    = 100;
        this.spawnY    = 300;
    }

    create() {

        this.createMap();
        this.createPlayer();

        this.physics.add.collider(this.player, this.layer);

        this.createBombs();

        if (this.bombs) {
            this.physics.add.overlap(
                this.player,
                this.bombs,
                this.activateBomb,
                null,
                this
            );
        }

        this.setupCamera();
        this.setupInput();
        this.createAnimations();
        this.createHUD();

        this.cameras.main.fadeIn(500, 0, 0, 0);
    }

    update() {

        this.handlePlayerMovement();
        this.handleTileEffects();
    }
}
