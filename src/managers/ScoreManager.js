import StorageManager from './StorageManager.js';

/**
 * ScoreManager
 *
 * Centraliza toda la lógica de puntuación:
 *  - Puntos base (monedas, enemigos)
 *  - Bonus de tiempo: el jugador gana puntos extra si completa el nivel rápido
 *  - Multiplicador de combo (mata varios enemigos seguidos sin tocar el suelo)
 *  - Notificación visual de puntos flotantes
 *
 * Uso:
 *   this._score = new ScoreManager(this, this.player);
 *   this._score.start();                        // al iniciar el nivel
 *   this._score.addPoints(50, x, y);            // monedas/enemigos
 *   this._score.addTimeBonus(parSeconds);        // al terminar el nivel
 *   const total = this._score.getTotal();
 */
export default class ScoreManager {

    /**
     * @param {Phaser.Scene} scene
     * @param {object} player - sprite del jugador (se le asigna player.score)
     * @param {HUDManager} [hud] - para llamar hud.update() tras cambios
     */
    constructor(scene, player, hud = null) {
        this.scene  = scene;
        this.player = player;
        this._hud   = hud;

        this._total      = 0;
        this._comboCount = 0;
        this._startTime  = 0;
    }

    // ═══════════════════════════════════════════════════════════
    // INICIO
    // ═══════════════════════════════════════════════════════════

    /** Llama al comienzo del nivel para empezar a contar el tiempo. */
    start() {
        this._startTime = this.scene.time.now;
        this._total     = this.player.score ?? 0;
    }

    // ═══════════════════════════════════════════════════════════
    // AÑADIR PUNTOS
    // ═══════════════════════════════════════════════════════════

    /**
     * Añade puntos con efecto de texto flotante.
     * @param {number} points - puntos base a añadir
     * @param {number} [worldX] - posición X del texto flotante (coords mundo)
     * @param {number} [worldY] - posición Y del texto flotante
     * @param {boolean} [isEnemy=false] - si es por matar enemigo (activa combo)
     */
    addPoints(points, worldX, worldY, isEnemy = false) {
        if (isEnemy) {
            this._comboCount++;
        } else {
            this._comboCount = 0;
        }

        const multiplier = isEnemy ? Math.min(this._comboCount, 4) : 1;
        const earned     = points * multiplier;

        this._total          += earned;
        this.player.score     = this._total;

        StorageManager.saveHighScore(this._total);
        this._hud?.update();

        // Texto flotante
        if (worldX !== undefined && worldY !== undefined) {
            this._spawnFloatingText(worldX, worldY, earned, multiplier);
        }

        return earned;
    }

    /**
     * Reinicia el contador de combo (cuando el jugador toca el suelo
     * o recibe daño). Llamar desde BaseScene en killPlayer().
     */
    resetCombo() {
        this._comboCount = 0;
    }

    // ═══════════════════════════════════════════════════════════
    // BONUS DE TIEMPO
    // ═══════════════════════════════════════════════════════════

    /**
     * Calcula y aplica el bonus de tiempo al completar un nivel.
     * @param {number} parSeconds - tiempo objetivo en segundos (ej. 60)
     * @returns {number} bonus obtenido (0 si el jugador tardó más)
     */
    addTimeBonus(parSeconds = 60) {
        const elapsed  = (this.scene.time.now - this._startTime) / 1000;
        const margin   = parSeconds - elapsed;

        if (margin <= 0) return 0;

        // Bonus proporcional: hasta 500 puntos si termina mucho antes del par
        const bonus = Math.round(Math.min(margin / parSeconds, 1) * 500);
        if (bonus <= 0) return 0;

        this._total      += bonus;
        this.player.score = this._total;
        StorageManager.saveHighScore(this._total);

        const { width, height } = this.scene.scale;
        this._spawnScreenText(
            width / 2, height * 0.35,
            `⏱ +${bonus} bonus de tiempo!`,
            '#00ffcc'
        );

        return bonus;
    }

    // ═══════════════════════════════════════════════════════════
    // GETTERS
    // ═══════════════════════════════════════════════════════════

    getTotal()      { return this._total; }
    getCombo()      { return this._comboCount; }
    getElapsedSec() { return (this.scene.time.now - this._startTime) / 1000; }

    /** Referencia de HUD actualizable después del create() */
    setHUD(hud) { this._hud = hud; }

    // ═══════════════════════════════════════════════════════════
    // TEXTO FLOTANTE
    // ═══════════════════════════════════════════════════════════

    _spawnFloatingText(x, y, points, multiplier = 1) {
        const label = multiplier > 1
            ? `+${points}  ×${multiplier}!`
            : `+${points}`;

        const color = multiplier > 1 ? '#ff8800' : '#ffdd00';

        const txt = this.scene.add.text(x, y - 10, label, {
            fontSize:        multiplier > 1 ? '22px' : '18px',
            fontStyle:       'bold',
            color,
            stroke:          '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(20);

        this.scene._hud?.ignoreOnUICamera(txt);

        this.scene.tweens.add({
            targets:    txt,
            y:          txt.y - 50,
            alpha:       0,
            duration:   700,
            onComplete: () => txt.destroy()
        });
    }

    _spawnScreenText(x, y, label, color = '#ffffff') {
        const txt = this.scene.add.text(x, y, label, {
            fontSize:        '28px',
            fontStyle:       'bold',
            color,
            stroke:          '#000000',
            strokeThickness: 5
        }).setOrigin(0.5).setDepth(30).setScrollFactor(0);

        this.scene.tweens.add({
            targets:    txt,
            y:          y - 40,
            alpha:       0,
            duration:   1800,
            delay:       300,
            onComplete: () => txt.destroy()
        });
    }
}
