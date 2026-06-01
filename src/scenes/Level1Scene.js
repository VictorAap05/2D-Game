import BaseScene from './BaseScene.js';

/**
 * Level1Scene
 * Nivel introductorio con plataformas básicas.
 * Mapa simple (mapa1) sin object layers — la condición de victoria
 * es que el jugador llegue al borde derecho del mapa.
 */
export default class Level1Scene extends BaseScene {

    constructor() {
        super('Level1Scene');
        this.mapKey    = 'map1';
        this.levelName = 'Level1Scene';
        this.levelNum  = 1;
        this.nextLevel = 'Level2Scene';
        this.spawnX    = 100;
        this.spawnY    = 300;
    }

    create() {
        super.create();

        // En este mapa no hay monedas, marcamos como completado desde el inicio
        // para que si existe la meta, funcione sin restricción de monedas
        this.totalCoins     = 0;
        this.collectedCoins = 0;

        // Zona de victoria invisible al final del mapa (10% antes del borde derecho)
        this._createFinishZone();

        // Pequeño mensaje de instrucciones
        this._showInstructions();
    }

    update() {
        super.update();
    }

    // ─────────────────────────────────────────────────────────
    // ZONA DE VICTORIA
    // ─────────────────────────────────────────────────────────

    _createFinishZone() {
        const mapW = this.map.widthInPixels;
        const mapH = this.map.heightInPixels;

        // Zona estrecha en el borde derecho
        const zone = this.add.zone(mapW - 40, mapH / 2, 80, mapH).setOrigin(0.5);
        this.physics.add.existing(zone, true); // estática

        this.physics.add.overlap(this.player, zone, () => {
            if (!this.player.isDead) this.onLevelComplete();
        });

        // Indicador visual de meta (bandera)
        const flag = this.add.text(mapW - 60, mapH / 2 - 60, '🏁', {
            fontSize: '48px'
        }).setDepth(5);

        this.tweens.add({
            targets: flag, y: flag.y - 12,
            duration: 700, yoyo: true, repeat: -1,
            ease: 'Sine.easeInOut'
        });

        if (this._hud) {
            this._hud.ignoreOnUICamera(flag);
        }
    }

    _showInstructions() {
        const txt = this.add.text(this.spawnX + 20, this.spawnY - 80,
            '← → Mover   W/↑ Saltar   ESPACIO Disparar', {
                fontSize: '14px', color: '#ffffff',
                stroke: '#000000', strokeThickness: 3
            }
        ).setDepth(15);

        if (this._hud) this._hud.ignoreOnUICamera(txt);

        this.time.delayedCall(4000, () => {
            this.tweens.add({
                targets: txt, alpha: 0, duration: 800,
                onComplete: () => txt.destroy()
            });
        });
    }
}
