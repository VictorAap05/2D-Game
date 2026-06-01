import Phaser from 'phaser';

export default class PreloadScene extends Phaser.Scene {

    constructor() {
        super('PreloadScene');
    }

    preload() {

        /*
        =====================================
        BARRA DE CARGA
        =====================================
        */

        const { width, height } = this.scale;

        const barBg = this.add.rectangle(width / 2, height / 2, 400, 20, 0x333333);
        const bar   = this.add.rectangle(width / 2 - 200, height / 2, 0, 20, 0x00cc66);
        bar.setOrigin(0, 0.5);

        this.add.text(width / 2, height / 2 - 40, 'Cargando...', {
            fontSize: '20px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.load.on('progress', (value) => {
            bar.width = 400 * value;
        });

        /*
        =====================================
        MAPAS
        =====================================
        */

        this.load.tilemapTiledJSON('map1', 'assets/maps/mapa1.json');
        // this.load.tilemapTiledJSON('map2', 'assets/maps/mapa2.json'); // descomenta cuando tu compañero lo suba
        this.load.tilemapTiledJSON('map3', 'assets/maps/mapa3.json');

        /*
        =====================================
        TILESET
        =====================================
        */

        // Como imagen para el tilemap
        this.load.image(
            'tiles',
            'assets/tiles/spritesheet-tiles-default.png'
        );

        // Como spritesheet para usar frames individuales (bombas, monedas, etc.)
        // El tileset tiene 18 columnas × 64px por tile
        this.load.spritesheet(
            'tiles-sheet',
            'assets/tiles/spritesheet-tiles-default.png',
            { frameWidth: 64, frameHeight: 64, spacing: 1, margin: 0 }
        );

        /*
        =====================================
        PLAYER
        =====================================
        */

        this.load.atlasXML(
            'characters',
            'assets/player/spritesheet-characters-default.png',
            'assets/player/spritesheet-characters-default.xml'
        );

        /*
        =====================================
        ENEMIGOS
        =====================================
        */

        this.load.atlasXML(
            'enemies',
            'assets/enemies/spritesheet-enemies-default.png',
            'assets/enemies/spritesheet-enemies-default.xml'
        );
    }

    create() {
        this.scene.start('MenuScene');
    }
}