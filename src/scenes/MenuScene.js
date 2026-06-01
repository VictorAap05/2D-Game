import Phaser from 'phaser';
import StorageManager from '../managers/StorageManager.js';

/**
 * MenuScene
 * Pantalla principal del juego.
 * Muestra high score desde localStorage, botones de nivel y controles.
 */
export default class MenuScene extends Phaser.Scene {

    constructor() {
        super('MenuScene');
    }

    create() {
        const { width, height } = this.scale;

        // ── Fondo degradado ──────────────────────────────────
        this.add.rectangle(0, 0, width, height, 0x0d1117).setOrigin(0, 0);

        // Franjas decorativas
        this.add.rectangle(0, height * 0.12, width, 4, 0x00cc66).setOrigin(0, 0.5);
        this.add.rectangle(0, height * 0.88, width, 4, 0x00cc66).setOrigin(0, 0.5);

        // ── Título ───────────────────────────────────────────
        this.add.text(width / 2, height * 0.20, '🎮 2D PLATAFORMA', {
            fontSize: '52px', fontStyle: 'bold',
            color: '#00cc66',
            stroke: '#003311', strokeThickness: 6
        }).setOrigin(0.5);

        this.add.text(width / 2, height * 0.32, 'Aventura en plataformas — Phaser.js', {
            fontSize: '18px', color: '#888888'
        }).setOrigin(0.5);

        // ── High Score ───────────────────────────────────────
        const hs = StorageManager.getHighScore();
        this.add.text(width / 2, height * 0.40, `🏆 Mejor puntuación: ${hs}`, {
            fontSize: '20px', color: '#ffdd00',
            stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5);

        // ── Nivel alcanzado ───────────────────────────────────
        const lvl = StorageManager.getLevelReached();
        this.add.text(width / 2, height * 0.47, `📌 Nivel alcanzado: ${lvl}`, {
            fontSize: '17px', color: '#aaaaaa'
        }).setOrigin(0.5);

        // ── Botones de nivel ─────────────────────────────────
        this._createButton(width / 2, height * 0.56, '▶  NIVEL 1', true, () => {
            this.scene.start('Level1Scene');
        });

        this._createButton(width / 2, height * 0.66, '▶  NIVEL 2  (beta)', true, () => {
            this.scene.start('Level2Scene');
        });

        this._createButton(width / 2, height * 0.76, '▶  NIVEL 3  (completo)', true, () => {
            this.scene.start('Level3Scene');
        });

        // ── Controles ────────────────────────────────────────
        this.add.text(width / 2, height * 0.87, [
            '⌨️  ← → / WASD  mover   |   W / ↑  saltar   |   ESPACIO  disparar   |   ESC  pausa',
            '📱  Botones táctiles en pantalla para móvil'
        ].join('\n'), {
            fontSize: '14px', color: '#555555', align: 'center'
        }).setOrigin(0.5);

        // Fade-in
        this.cameras.main.fadeIn(400, 0, 0, 0);
    }

    _createButton(x, y, label, enabled, callback) {
        const bg = this.add.rectangle(x, y, 340, 48, enabled ? 0x005522 : 0x1e1e1e)
            .setInteractive({ useHandCursor: enabled });

        const text = this.add.text(x, y, label, {
            fontSize: '20px',
            color: enabled ? '#00ff88' : '#444444'
        }).setOrigin(0.5);

        if (!enabled) return;

        bg.on('pointerover', () => {
            bg.setFillStyle(0x007733);
            text.setStyle({ color: '#ffffff' });
        });
        bg.on('pointerout', () => {
            bg.setFillStyle(0x005522);
            text.setStyle({ color: '#00ff88' });
        });
        bg.on('pointerdown', () => {
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', callback);
        });
    }
}
