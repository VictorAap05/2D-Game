import BaseScene from './BaseScene';

export default class Level3Scene extends BaseScene {

    constructor() {
        super('Level3Scene');
        this.mapKey    = 'map3';
        this.levelName = 'Level3Scene';
        this.nextLevel = 'MenuScene';   // cambia cuando haya nivel 4
        this.spawnX    = 100;
        this.spawnY    = 300;
    }

    create() {

        // ── Mapa y colisiones ──
        this.createMap();
        this.createPlayer();
        this.physics.add.collider(this.player, this.layer);

        // ── Sistemas de objetos ──
        this.createBombs();
        this.createCoins();
        this.createBoosters();
        this.createCheckpoints();
        this.createSpikes();
        this.createGoal();
        this.createProjectiles(); 
        this.createEnemies();

        // Overlap bombas (despues de crear todos los sistemas)
        if (this.bombs) {
            this.physics.add.overlap(
                this.player, this.bombs,
                this.activateBomb, null, this
            );
        }

        // ── Camara, input, animaciones, HUD ──
        this.setupCamera();
        this.setupInput();
        this.createAnimations();
        this.createHUD();

        this.cameras.main.fadeIn(500, 0, 0, 0);
    }

    update() {
        this.handlePlayerMovement();
        this.handleTileEffects();
        this.handleEnemies();
    }
}