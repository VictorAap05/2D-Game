import Phaser from 'phaser';

export default class GameOverScene extends Phaser.Scene {

    constructor() {
        super('GameOverScene');
    }

    init(data) {
        // Recibe qué nivel volver a intentar
        this.fromLevel = data.level || 'Level3Scene';
    }

    create() {

        const { width, height } = this.scale;

        /*
        =====================================
        FONDO OSCURO
        =====================================
        */

        this.add.rectangle(0, 0, width, height, 0x000000, 0.85).setOrigin(0, 0);

        /*
        =====================================
        TEXTO
        =====================================
        */

        this.add.text(width / 2, height * 0.30, '💀  GAME OVER', {
            fontSize: '56px',
            fontStyle: 'bold',
            color: '#ff3333',
            stroke: '#660000',
            strokeThickness: 6
        }).setOrigin(0.5);

        this.add.text(width / 2, height * 0.45, 'Mejor suerte la próxima vez', {
            fontSize: '22px',
            color: '#aaaaaa'
        }).setOrigin(0.5);

        /*
        =====================================
        BOTONES
        =====================================
        */

        this.createButton(width / 2, height * 0.60, 'REINTENTAR', 0x005522, '#00ff88', () => {
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.stop('GameOverScene');
                this.scene.start(this.fromLevel);
            });
        });

        this.createButton(width / 2, height * 0.73, 'MENÚ PRINCIPAL', 0x222266, '#8888ff', () => {
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.stop('GameOverScene');
                this.scene.start('MenuScene');
            });
        });
    }

    createButton(x, y, label, bgColor, textColor, callback) {

        const bg = this.add.rectangle(x, y, 280, 50, bgColor).setInteractive({ useHandCursor: true });

        const text = this.add.text(x, y, label, {
            fontSize: '20px',
            color: textColor
        }).setOrigin(0.5);

        bg.on('pointerover', () => {
            bg.setAlpha(0.8);
        });

        bg.on('pointerout', () => {
            bg.setAlpha(1);
        });

        bg.on('pointerdown', callback);
    }
}
