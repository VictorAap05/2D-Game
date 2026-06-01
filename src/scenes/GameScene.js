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
            'assets/maps/mapa3.json'
        );

        /*
        =====================================
        TILESET
        =====================================
        */

            this.load.image(
                'tiles',
                'assets/tiles/spritesheet-tiles-default.png',
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
      ]
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
            'Piso',
            tileset,
            0,
            0
        );

        this.layer = layer;

        const bombLayer =
            map.getObjectLayer('Bombas');

        this.bombs =
            this.physics.add.staticGroup();

        bombLayer.objects.forEach(obj => {

            const bomb = this.bombs.create(
                obj.x,
                obj.y - obj.height,
                'bomb'
            );

            bomb.activated = false;

            bomb.explosionRadius =
                obj.properties.find(
                    p => p.name === 'explosionRadius'
                )?.value || 150;

            bomb.explosionDelay =
                obj.properties.find(
                    p => p.name === 'explosionDelay'
                )?.value || 2000;
        });

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
        this.physics.add.overlap(
            this.player,
            this.bombs,
            this.activateBomb,
            null,
            this
        );
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

            this.player.setVelocityY(-600);
        }

        /*
        =====================================
        ANIMACION SALTO
        =====================================
        */

        if (!this.player.body.blocked.down) {

            this.player.anims.play('jump', true);
        }
        const tile = this.layer.getTileAtWorldXY(
            this.player.x,
            this.player.y
        );

        if (tile) {

            if (tile.properties.kill) {

                console.log("MUERTO");

                this.player.setPosition(100, 300);
            }

            if (tile.properties.damage) {

                console.log("DAÑO");
            }

            if (tile.properties.forceY) {

                this.player.setVelocityY(
                    tile.properties.forceY
                );
            }
        }

    }
    activateBomb(player, bomb) {

        if (bomb.activated) return;

        bomb.activated = true;

        this.tweens.add({
            targets: bomb,
            alpha: 0.2,
            duration: 100,
            yoyo: true,
            repeat: -1
        });

        this.time.delayedCall(
            bomb.explosionDelay,
            () => this.explodeBomb(bomb)
        );
    }

    explodeBomb(bomb) {

        const distance =
            Phaser.Math.Distance.Between(
                bomb.x,
                bomb.y,
                this.player.x,
                this.player.y
            );

        if (
            distance <= bomb.explosionRadius
        ) {

            console.log('BOOM');

            this.player.setPosition(
                100,
                300
            );
        }

        bomb.destroy();
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