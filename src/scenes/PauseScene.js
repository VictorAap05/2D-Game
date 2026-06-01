import Phaser from 'phaser';
export default class PauseScene extends Phaser.Scene {

    constructor() {
        super({ key: 'PauseScene' });
    }

    init(data) {
        this.fromLevel = data.fromLevel ?? 'Level1Scene';
        this._audio    = data.audio    ?? null;
    }

create() {
        
        // Obliga a la escena de Pausa a renderizarse por encima de cualquier otro nivel o fondo
        this.scene.bringToTop();

        const { width, height } = this.scale;

        // Asegurar que la cámara de esta escena esté en (0,0) y no scrollee
        this.cameras.main.setScroll(0, 0);

        // ── Fondo oscuro (cubre TODO la pantalla) ──────────────
        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.75)
            .setScrollFactor(0)
            .setDepth(0);

        // ── Título ────────────────────────────────────────────
        this.add.text(width / 2, height * 0.20, '⏸️  PAUSA', {
            fontSize:        '56px',
            fontStyle:       'bold',
            color:           '#ffffff',
            stroke:          '#000000',
            strokeThickness: 7
        }).setOrigin(0.5)
          .setScrollFactor(0)
          .setDepth(1);

        // ── Botones ───────────────────────────────────────────
        this._btn(width / 2, height * 0.40, '▶️  CONTINUAR',  0x005522, '#00ff88', () => this._resume());
        this._btn(width / 2, height * 0.54, '🔄  REINICIAR', 0x002244, '#66aaff', () => this._restart());
        this._btn(width / 2, height * 0.68, '🏠  MENÚ',      0x331100, '#ffaa44', () => this._goMenu());

        // ── Hint de teclado ───────────────────────────────────
        this.add.text(width / 2, height * 0.82, 'ESC → Continuar', {
            fontSize: '16px', color: '#666666'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(1);

        // ESC para continuar
        this.input.keyboard.once('keydown-ESC', () => this._resume());

        // Fade-in rápido
        this.cameras.main.fadeIn(180, 0, 0, 0);
    }
    // ═══════════════════════════════════════════════════════════
    // ACCIONES
    // ═══════════════════════════════════════════════════════════

    _resume() {
        this.cameras.main.fadeOut(150, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.resume(this.fromLevel);
            this.scene.stop('PauseScene');
        });
    }

    _restart() {
        this.cameras.main.fadeOut(200, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.stop('PauseScene');
            this.scene.stop(this.fromLevel);
            this.scene.start(this.fromLevel);
        });
    }

    _goMenu() {
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.stop('PauseScene');
            this.scene.stop(this.fromLevel);
            this.scene.start('MenuScene');
        });
    }

    // ═══════════════════════════════════════════════════════════
    // HELPER BOTÓN
    // ═══════════════════════════════════════════════════════════

    _btn(x, y, label, bgColor, textColor, cb) {
        const bg = this.add.rectangle(x, y, 320, 54, bgColor)
            .setInteractive({ useHandCursor: true })
            .setScrollFactor(0)
            .setDepth(1);

        const txt = this.add.text(x, y, label, {
            fontSize: '22px', color: textColor
        }).setOrigin(0.5)
          .setScrollFactor(0)
          .setDepth(2);

        bg.on('pointerover',  () => { bg.setAlpha(0.85); txt.setScale(1.06); });
        bg.on('pointerout',   () => { bg.setAlpha(1);    txt.setScale(1);    });
        bg.on('pointerdown',  cb);
    }
}