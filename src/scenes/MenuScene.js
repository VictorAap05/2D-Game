import Phaser from 'phaser';

export default class MenuScene extends Phaser.Scene {

    constructor() {
        super('MenuScene');
    }

    create() {

        const { width, height } = this.scale;

        /*
        =====================================
        FONDO
        =====================================
        */

        this.add.rectangle(0, 0, width, height, 0x1a1a2e).setOrigin(0, 0);

        /*
        =====================================
        TITULO
        =====================================
        */

        this.add.text(width / 2, height * 0.25, '2D PLATAFORMA', {
            fontSize: '52px',
            fontStyle: 'bold',
            color: '#00cc66',
            stroke: '#005522',
            strokeThickness: 6
        }).setOrigin(0.5);

        this.add.text(width / 2, height * 0.38, 'Aventura en plataformas', {
            fontSize: '20px',
            color: '#aaaaaa'
        }).setOrigin(0.5);

        /*
        =====================================
        BOTONES DE NIVEL
        =====================================
        */

        // Nivel 1 (en construcción por tu compañero)
        this.createButton(width / 2, height * 0.52, 'NIVEL 1  (próximamente)', false, () => {
            // this.scene.start('Level1Scene');  // descomenta cuando esté listo
        });

        // Nivel 2 (en construcción por tu compañero)
        this.createButton(width / 2, height * 0.63, 'NIVEL 2  (próximamente)', false, () => {
            // this.scene.start('Level2Scene');  // descomenta cuando esté listo
        });

        // Nivel 3 - disponible
        this.createButton(width / 2, height * 0.74, 'NIVEL 3', true, () => {
            this.scene.start('Level3Scene');
        });

        /*
        =====================================
        CONTROLES
        =====================================
        */

        this.add.text(width / 2, height * 0.90, '← → / WASD  mover     W / ↑  saltar', {
            fontSize: '16px',
            color: '#666666'
        }).setOrigin(0.5);
    }

    createButton(x, y, label, enabled, callback) {

        const bg = this.add.rectangle(x, y, 320, 50, enabled ? 0x005522 : 0x2a2a2a)
            .setInteractive({ useHandCursor: enabled });

        const text = this.add.text(x, y, label, {
            fontSize: '20px',
            color: enabled ? '#00ff88' : '#555555'
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
