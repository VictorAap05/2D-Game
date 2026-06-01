import Phaser from 'phaser';
import StorageManager from '../managers/StorageManager.js';

/**
 * GameOverScene
 * Pantalla de Game Over: muestra puntuación, high score y botones de acción.
 * Se lanza encima del nivel con scene.launch() y lo pausa.
 */
export default class GameOverScene extends Phaser.Scene {

    constructor() {
        super('GameOverScene');
    }

    init(data) {
        this.fromLevel = data.level     ?? 'Level3Scene';
        this.score     = data.score     ?? 0;
        this.highScore = data.highScore ?? StorageManager.getHighScore();
    }

    create() {
        const { width, height } = this.scale;

        // ── Fondo semitransparente ────────────────────────────
        this.add.rectangle(0, 0, width, height, 0x000000, 0.88).setOrigin(0, 0);

        // ── Título ───────────────────────────────────────────
        this.add.text(width / 2, height * 0.22, '💀  GAME OVER', {
            fontSize: '56px', fontStyle: 'bold',
            color: '#ff3333', stroke: '#660000', strokeThickness: 6
        }).setOrigin(0.5);

        // ── Puntuación ───────────────────────────────────────
        this.add.text(width / 2, height * 0.37, `Puntuación: ${this.score}`, {
            fontSize: '26px', color: '#ffdd00',
            stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5);

        this.add.text(width / 2, height * 0.46, `🏆 Récord: ${this.highScore}`, {
            fontSize: '22px', color: '#aaaaaa',
            stroke: '#000000', strokeThickness: 2
        }).setOrigin(0.5);

        const isNewRecord = this.score >= this.highScore && this.score > 0;
        if (isNewRecord) {
            this.add.text(width / 2, height * 0.53, '¡Nuevo récord! 🎉', {
                fontSize: '20px', color: '#00ff88',
                stroke: '#000000', strokeThickness: 3
            }).setOrigin(0.5);
        }

        // ── Botones ──────────────────────────────────────────
        this._createButton(width / 2, height * 0.63, 'REINTENTAR', 0x005522, '#00ff88', () => {
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.stop('GameOverScene');
                this.scene.start(this.fromLevel);
            });
        });

        this._createButton(width / 2, height * 0.75, 'MENÚ PRINCIPAL', 0x222266, '#8888ff', () => {
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.stop('GameOverScene');
                this.scene.stop(this.fromLevel);
                this.scene.start('MenuScene');
            });
        });

        // ── Consejo ──────────────────────────────────────────
        this.add.text(width / 2, height * 0.88, 'Mejor suerte la próxima vez 💪', {
            fontSize: '16px', color: '#555555'
        }).setOrigin(0.5);
    }

    _createButton(x, y, label, bgColor, textColor, callback) {
        const bg = this.add.rectangle(x, y, 280, 50, bgColor)
            .setInteractive({ useHandCursor: true });

        const text = this.add.text(x, y, label, {
            fontSize: '20px', color: textColor
        }).setOrigin(0.5);

        bg.on('pointerover', () => bg.setAlpha(0.75));
        bg.on('pointerout',  () => bg.setAlpha(1));
        bg.on('pointerdown', callback);
    }
}
