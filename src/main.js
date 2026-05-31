import Phaser from 'phaser';
import GameScene from './scenes/GameScene';

const config = {

    type: Phaser.AUTO,

    width: 1280,
    height: 720,

    backgroundColor: '#000000',

    physics: {
        default: 'arcade',
        arcade: {
            gravity: {
                y: 900
            },
            debug: false
        }
    },

    scene: [
        GameScene
    ]
};

new Phaser.Game(config);