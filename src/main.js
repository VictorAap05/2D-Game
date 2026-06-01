import Phaser from 'phaser';
import PreloadScene  from './scenes/PreloadScene';
import MenuScene     from './scenes/MenuScene';
import Level1Scene   from './scenes/Level1Scene';
import Level2Scene   from './scenes/Level2Scene';
import Level3Scene   from './scenes/Level3Scene';
import GameOverScene from './scenes/GameOverScene';

const config = {

    type: Phaser.AUTO,

    width:  1280,
    height: 720,

    backgroundColor: '#000000',

    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 900 },
            debug: false
        }
    },

    /*
    =====================================
    ORDEN DE ESCENAS
    PreloadScene carga assets → MenuScene
    MenuScene lanza Level1/2/3Scene
    GameOverScene se lanza encima del nivel
    =====================================
    */
    scene: [
        PreloadScene,
        MenuScene,
        Level1Scene,
        Level2Scene,
        Level3Scene,
        GameOverScene
    ]
};

new Phaser.Game(config);
