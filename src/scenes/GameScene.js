import Phaser from 'phaser';

export default class GameScene extends Phaser.Scene {

    constructor() {
        super('GameScene');
    }

    preload() {

        /*
        =====================================
        MAPA JSON
        =====================================
        */

        this.load.tilemapTiledJSON(
            'map',
            'assets/maps/mapa1.json'
        );

        /*
        =====================================
        TILESET
        =====================================
        */

        this.load.image(
            'tiles',
            'assets/tiles/spritesheet-tiles-default.png'
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
    }

    create() {

        /*
        =====================================
        CREAR MAPA
        =====================================
        */

        const map = this.make.tilemap({
            key: 'map'
        });

        /*
        =====================================
        TILESET
        =====================================
        */

        const tileset = map.addTilesetImage(
            'tileset', // nombre EN TILED
            'tiles' // key del load
        );

        /*
        =====================================
        CAPA
        =====================================
        */

        const layer = map.createLayer(
            'Layer1',
            tileset,
            0,
            0
        );

        /*
        =====================================
        COLISIONES
        =====================================
        */

        layer.setCollisionByProperty({
            collides: true
        });

        /*
        =====================================
        PLAYER
        =====================================
        */

        this.player = this.physics.add.sprite(
            100,
            300,
            'characters',
            'character_green_idle'
        );

        this.player.setScale(0.5);

        this.player.setCollideWorldBounds(true);

        /*
        =====================================
        PLAYER VS MAPA
        =====================================
        */

        this.physics.add.collider(
            this.player,
            layer
        );

        /*
        =====================================
        CAMARA
        =====================================
        */

        this.cameras.main.startFollow(this.player);

        this.cameras.main.setBounds(
            0,
            0,
            map.widthInPixels,
            map.heightInPixels
        );

        this.physics.world.setBounds(
            0,
            0,
            map.widthInPixels,
            map.heightInPixels
        );

        /*
        =====================================
        INPUT
        =====================================
        */

        this.cursors = this.input.keyboard.createCursorKeys();

        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });

        /*
        =====================================
        ANIMACIONES
        =====================================
        */

        this.createAnimations();
    }

    update() {

        const speed = 200;

        /*
        =====================================
        MOVIMIENTO
        =====================================
        */

        if (this.cursors.left.isDown || this.wasd.left.isDown) {

            this.player.setVelocityX(-speed);

            this.player.anims.play('walk', true);

            this.player.setFlipX(true);

        }
        else if (this.cursors.right.isDown || this.wasd.right.isDown) {

            this.player.setVelocityX(speed);

            this.player.anims.play('walk', true);

            this.player.setFlipX(false);
            
        }
        else {

            this.player.setVelocityX(0);

            this.player.anims.play('idle', true);
        }

        /*
        =====================================
        SALTO
        =====================================
        */

        if (
            (this.cursors.up.isDown || this.wasd.up.isDown) &&
            this.player.body.blocked.down 
        ) {

            this.player.setVelocityY(-450);
        }

        /*
        =====================================
        ANIMACION SALTO
        =====================================
        */

        if (!this.player.body.blocked.down) {

            this.player.anims.play('jump', true);
        }
    }

    createAnimations() {

        /*
        =====================================
        IDLE
        =====================================
        */

        this.anims.create({
            key: 'idle',
            frames: [
                {
                    key: 'characters',
                    frame: 'character_green_idle'
                }
            ],
            frameRate: 1,
            repeat: -1
        });

        /*
        =====================================
        WALK
        =====================================
        */

        this.anims.create({
            key: 'walk',
            frames: [
                {
                    key: 'characters',
                    frame: 'character_green_walk_a'
                },
                {
                    key: 'characters',
                    frame: 'character_green_walk_b'
                }
            ],
            frameRate: 6,
            repeat: -1
        });

        /*
        =====================================
        JUMP
        =====================================
        */

        this.anims.create({
            key: 'jump',
            frames: [
                {
                    key: 'characters',
                    frame: 'character_green_jump'
                }
            ],
            frameRate: 1
        });
    }
}