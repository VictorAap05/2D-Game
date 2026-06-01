import BaseScene from './BaseScene';

/*
=============================================
NIVEL 1
Extiende BaseScene — aquí va la lógica
específica del nivel 1.

Tu compañero solo necesita:
  1. Ajustar this.mapKey si usa otro mapa
  2. Ajustar this.spawnX / this.spawnY
  3. Agregar lógica propia en create() y update()
     llamando a super.create() y super.update()
=============================================
*/
export default class Level1Scene extends BaseScene {

    constructor() {
        super('Level1Scene');
        this.mapKey    = 'map1';
        this.levelName = 'Level1Scene';
        this.spawnX    = 100;
        this.spawnY    = 300;
    }

    create() {

        /*
        =====================================
        MAPA, JUGADOR Y SISTEMAS BASE
        =====================================
        */

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

        /*
        =====================================
        TODO: agregar lógica propia del nivel 1
        (enemigos, coleccionables, meta, etc.)
        =====================================
        */

        // Fade-in al entrar al nivel
        this.cameras.main.fadeIn(500, 0, 0, 0);
    }

    update() {

        this.handlePlayerMovement();
        this.handleTileEffects();

        /*
        =====================================
        TODO: lógica extra del nivel 1
        =====================================
        */
    }
}
