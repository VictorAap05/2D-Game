import Phaser from 'phaser';
import PreloadScene  from './scenes/PreloadScene.js';
import MenuScene     from './scenes/MenuScene.js';
import PauseScene    from './scenes/PauseScene.js';
import Level1Scene   from './scenes/Level1Scene.js';
import Level2Scene   from './scenes/Level2Scene.js';
import Level3Scene   from './scenes/Level3Scene.js';
import GameOverScene from './scenes/GameOverScene.js';

/*
=====================================
CONFIGURACIÓN GLOBAL DEL JUEGO — v2
=====================================
*/
const config = {
    type: Phaser.AUTO,

    backgroundColor: '#000000',
    parent: 'game-container',

    // Responsive: escala manteniendo proporción 16:9
    scale: {
        mode:      Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width:     1280,
        height:    720
    },

    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 900 },
            debug:   false        // cambiar a true para ver hitboxes
        }
    },

    // PauseScene se añade al registro para poder lanzarla con scene.launch()
    scene: [
        PreloadScene,
        MenuScene,
        PauseScene,
        Level1Scene,
        Level2Scene,
        Level3Scene,
        GameOverScene
    ]
};

new Phaser.Game(config);
