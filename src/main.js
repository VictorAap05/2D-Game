import Phaser from 'phaser';

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#000000', 
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: {
        create: function() {
            
            this.add.text(400, 300, 'Estructura lista - Phaser inicializado', {
                fontSize: '32px',
                fill: '#ffffff'
            }).setOrigin(0.5);
        }
    }
};

const game = new Phaser.Game(config);
export default game;