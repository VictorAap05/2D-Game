import Phaser from 'phaser';

/*
=============================================
BASE SCENE
Hereda toda la lógica del jugador y sistemas.
Cada nivel extiende esta clase y define:
  - this.mapKey      → key del tilemap
  - this.levelName   → nombre de la escena
  - this.nextLevel   → escena del siguiente nivel
  - this.spawnX/Y    → punto de spawn inicial
=============================================
*/
export default class BaseScene extends Phaser.Scene {

    // ─────────────────────────────────────────
    // MAPA
    // ─────────────────────────────────────────
    createMap() {
        const map = this.make.tilemap({ key: this.mapKey });
        const tileset = map.addTilesetImage('tileset', 'tiles');
        const layer = map.createLayer('Piso', tileset, 0, 0);
        layer.setCollisionByProperty({ collides: true });

        this.layer = layer;
        this.map = map;
        return { map, tileset, layer };
    }

    // ─────────────────────────────────────────
    // JUGADOR
    // ─────────────────────────────────────────
    createPlayer(x, y) {
        this.player = this.physics.add.sprite(
            x ?? this.spawnX ?? 100,
            y ?? this.spawnY ?? 300,
            'characters',
            'character_green_idle'
        );
        this.player.setScale(0.5);
        this.player.setCollideWorldBounds(true);

        this.player.setDepth(10);

        // Evita atravesar el piso a altas velocidades
        this.physics.world.TILE_BIAS = 64;
        this.player.setMaxVelocity(800, 800);

        this.player.lives = 3;
        this.player.score = 0;
        this.player.isDead = false;
        this.player.onBooster = false;
        return this.player;
    }

    // ─────────────────────────────────────────
    // BOMBAS
    // ─────────────────────────────────────────
    createBombs() {
        const bombLayer = this.map.getObjectLayer('Bombas');
        if (!bombLayer) return;

        this.bombs = this.physics.add.staticGroup();
        const firstgid = this.map.tilesets[0]?.firstgid ?? 1;

        bombLayer.objects.forEach(obj => {
            const frame = (obj.gid ?? 22) - firstgid;
            const tileProps = this.getTileProperties(obj.gid);
            const cx = obj.x + obj.width / 2;
            const cy = obj.y - obj.height / 2;

            const bomb = this.bombs.create(cx, cy, 'tiles-sheet', frame);
            bomb.setScale(0.9);
            bomb.activated = false;
            bomb.exploded = false;
            bomb.explosionRadius = tileProps?.explosionRadius ?? 150;
            bomb.explosionDelay = tileProps?.explosionDelay ?? 2000;
            bomb.refreshBody();

            bomb.countdownText = this.add.text(cx, cy - 48, '', {
                fontSize: '22px', fontStyle: 'bold',
                color: '#ffff00', stroke: '#000000', strokeThickness: 4
            }).setOrigin(0.5).setDepth(10);
        });
    }
    // ─────────────────────────────────────────
    // PINCHOS (Sierras giratorias)
    // ─────────────────────────────────────────
    createSpikes() {
        const spikeLayer = this.map.getObjectLayer('Pinchos');
        if (!spikeLayer) return;

        this.spikes = this.physics.add.staticGroup();
        const firstgid = this.map.tilesets[0]?.firstgid ?? 1;

        spikeLayer.objects.forEach(obj => {
            const frame = (obj.gid ?? 121) - firstgid;
            const cx = obj.x + obj.width / 2;
            const cy = obj.y - obj.height / 2;

            const spike = this.spikes.create(cx, cy, 'tiles-sheet', frame);

            // Hacemos que el hitbox sea circular (radio 24, offset x:8, y:8)
            // para que la colisión sea perfecta mientras gira
            spike.body.setCircle(24, 8, 8);

            // Leemos la propiedad personalizada "kill" que pusiste en Tiled
            const props = this.getTileProperties(obj.gid);
            spike.isLethal = props?.kill ?? true; // Si no la lee, asume true por defecto

            // Animación de giro infinito
            this.tweens.add({
                targets: spike,
                angle: 360,          // Gira 360 grados
                duration: 1500,         // Tarda 1.5 segundos en dar una vuelta
                repeat: -1,           // Se repite infinitamente
                ease: 'Linear'      // Velocidad constante
            });
        });

        // Detectar cuando el jugador toca un pincho
        this.physics.add.overlap(
            this.player,
            this.spikes,
            this.hitSpike,
            null,
            this
        );
    }

    hitSpike(player, spike) {
        if (spike.isLethal && !player.isDead) {
            this.killPlayer();
        }
    }
    // ─────────────────────────────────────────
    // MONEDAS
    // ─────────────────────────────────────────
    createCoins() {
        const coinLayer = this.map.getObjectLayer('Monedas');
        if (!coinLayer) return;

        this.coins = this.physics.add.staticGroup();
        const firstgid = this.map.tilesets[0]?.firstgid ?? 1;

        // --- LLEVAMOS LA CUENTA DE LAS MONEDAS ---
        this.totalCoins = coinLayer.objects.length;
        this.collectedCoins = 0;

        coinLayer.objects.forEach(obj => {
            const frame = (obj.gid ?? 37) - firstgid;
            const cx = obj.x + obj.width / 2;
            const cy = obj.y - obj.height / 2;

            const coin = this.coins.create(cx, cy, 'tiles-sheet', frame);
            coin.setScale(0.8);
            coin.refreshBody();

            this.tweens.add({
                targets: coin,
                y: cy - 8,
                duration: 800,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
                delay: Phaser.Math.Between(0, 400)
            });

            const props = this.getTileProperties(obj.gid);
            coin.value = props?.valor ?? 10;
        });

        this.physics.add.overlap(
            this.player,
            this.coins,
            this.collectCoin,
            null,
            this
        );
    }

    collectCoin(player, coin) {
        if (coin.collected) return;
        coin.collected = true;

        // Sumamos una moneda a la colección
        this.collectedCoins++;

        coin.body.enable = false;

        const value = coin.value ?? 10;

        this.tweens.add({
            targets: coin,
            y: coin.y - 30,
            alpha: 0,
            duration: 300,
            onComplete: () => coin.destroy()
        });

        const txt = this.add.text(coin.x, coin.y - 10, '+' + value, {
            fontSize: '18px', fontStyle: 'bold',
            color: '#ffdd00', stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(15);

        if (this.uiCamera) this.uiCamera.ignore(txt);

        this.tweens.add({
            targets: txt,
            y: txt.y - 40,
            alpha: 0,
            duration: 600,
            onComplete: () => txt.destroy()
        });

        player.score += value;
        this.updateHUD();
    }
    // ─────────────────────────────────────────
    // META (Puerta final)
    // ─────────────────────────────────────────
    createGoal() {
        const goalLayer = this.map.getObjectLayer('Meta');
        if (!goalLayer) return;

        this.goals = this.physics.add.staticGroup();
        const firstgid = this.map.tilesets[0]?.firstgid ?? 1;

        goalLayer.objects.forEach(obj => {
            const frame = (obj.gid ?? 45) - firstgid;
            const cx = obj.x + obj.width / 2;
            const cy = obj.y - obj.height / 2;

            const goal = this.goals.create(cx, cy, 'tiles-sheet', frame);
            goal.refreshBody();

            // Leemos a qué nivel debe llevarte esta puerta
            const props = this.getTileProperties(obj.gid);
            if (props?.nextLevel) {
                goal.targetLevel = 'Level' + props.nextLevel + 'Scene';
            }
        });

        this.physics.add.overlap(
            this.player,
            this.goals,
            this.hitGoal,
            null,
            this
        );
    }

    hitGoal(player, goal) {
        // Comprobamos si el jugador ya recogió todas las monedas del mapa
        if (this.collectedCoins >= this.totalCoins) {

            // Evitamos que se ejecute múltiples veces
            if (this.player.isDead) return;

            // Actualizamos el nivel al que debe ir según Tiled
            if (goal.targetLevel) {
                this.nextLevel = goal.targetLevel;
            }

            this.onLevelComplete();

        } else {
            // Si le faltan monedas, le mostramos un aviso visual
            if (!goal.warningActive) {
                goal.warningActive = true;
                const faltan = this.totalCoins - this.collectedCoins;

                const txt = this.add.text(goal.x, goal.y - 50, `¡Faltan ${faltan} monedas!`, {
                    fontSize: '18px', fontStyle: 'bold',
                    color: '#ff3333', stroke: '#000000', strokeThickness: 4
                }).setOrigin(0.5).setDepth(20);

                if (this.uiCamera) this.uiCamera.ignore(txt);

                this.tweens.add({
                    targets: txt,
                    y: txt.y - 30,
                    alpha: 0,
                    duration: 1500,
                    onComplete: () => {
                        txt.destroy();
                        goal.warningActive = false; // Permite volver a mostrar el mensaje
                    }
                });
            }
        }
    }
    // ─────────────────────────────────────────
    // IMPULSOR (booster)
    // ─────────────────────────────────────────
    createBoosters() {
        const boostLayer = this.map.getObjectLayer('Impulsor');
        if (!boostLayer) return;

        this.boosters = this.physics.add.staticGroup();
        const firstgid = this.map.tilesets[0]?.firstgid ?? 1;

        boostLayer.objects.forEach(obj => {
            const frame = (obj.gid ?? 128) - firstgid;
            const cx = obj.x + obj.width / 2;
            const cy = obj.y - obj.height / 2;

            const props = this.getTileProperties(obj.gid);

            const booster = this.boosters.create(cx, cy, 'tiles-sheet', frame);
            booster.setScale(1);
            booster.forceY = props?.forceY ?? -700;
            booster.refreshBody();

            this.tweens.add({
                targets: booster,
                alpha: 0.5,
                duration: 500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        });

        this.physics.add.overlap(
            this.player,
            this.boosters,
            this.hitBooster,
            null,
            this
        );
    }

    hitBooster(player, booster) {
        if (player.onBooster) return;
        player.onBooster = true;

        player.setVelocityY(booster.forceY);

        // Zoom out principal (la UI no será afectada gracias a su propia cámara)
        this.cameras.main.zoomTo(0.6, 500, 'Sine.easeInOut', true);
        this.isZoomedOut = true;

        this.tweens.add({
            targets: booster,
            tint: 0xffffff,
            duration: 100,
            yoyo: true
        });

        for (let i = 0; i < 5; i++) {
            const p = this.add.circle(
                booster.x + Phaser.Math.Between(-20, 20),
                booster.y,
                5, 0xffff00, 0.9
            ).setDepth(8);

            if (this.uiCamera) this.uiCamera.ignore(p);

            this.tweens.add({
                targets: p,
                y: p.y - Phaser.Math.Between(40, 80),
                alpha: 0,
                duration: Phaser.Math.Between(300, 600),
                delay: i * 60,
                onComplete: () => p.destroy()
            });
        }

        this.time.delayedCall(300, () => {
            player.onBooster = false;
        });
    }

    // ─────────────────────────────────────────
    // CHECKPOINTS
    // ─────────────────────────────────────────
    createCheckpoints() {
        const cpLayer = this.map.getObjectLayer('Checkpoints');
        if (!cpLayer) return;

        this.checkpoints = this.physics.add.staticGroup();
        this.activeCheckpoint = null;
        const firstgid = this.map.tilesets[0]?.firstgid ?? 1;

        cpLayer.objects.forEach(obj => {
            const frame = (obj.gid ?? 131) - firstgid;
            const cx = obj.x + obj.width / 2;
            const cy = obj.y - obj.height / 2;
            const props = this.getTileProperties(obj.gid);

            const isGoal = props?.type === 'goal';

            const cp = this.checkpoints.create(cx, cy, 'tiles-sheet', frame);
            cp.setScale(1);
            cp.isGoal = isGoal;
            cp.spawnX = cx;
            cp.spawnY = cy;
            cp.reached = false;
            cp.refreshBody();

            if (!isGoal) {
                this.tweens.add({
                    targets: cp,
                    scaleX: 0.85,
                    duration: 600,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            }
        });

        this.physics.add.overlap(
            this.player,
            this.checkpoints,
            this.hitCheckpoint,
            null,
            this
        );
    }

    hitCheckpoint(player, cp) {
        if (cp.reached) return;
        cp.reached = true;

        if (cp.isGoal) {
            this.onLevelComplete();
        } else {
            this.spawnX = cp.spawnX;
            this.spawnY = cp.spawnY - 20;

            cp.setDepth(5);

            this.cameras.main.flash(300, 0, 200, 0);

            cp.setTint(0x00ff66);
            this.tweens.killTweensOf(cp);

            const txt = this.add.text(cp.x, cp.y - 50, '✔ Checkpoint!', {
                fontSize: '18px', fontStyle: 'bold',
                color: '#00ff88', stroke: '#000000', strokeThickness: 3
            }).setOrigin(0.5).setDepth(15);

            if (this.uiCamera) this.uiCamera.ignore(txt);

            this.tweens.add({
                targets: txt,
                y: txt.y - 40,
                alpha: 0,
                duration: 1000,
                onComplete: () => txt.destroy()
            });
        }
    }

    onLevelComplete() {
        this.player.isDead = true;

        this.cameras.main.flash(500, 255, 255, 255);
        this.cameras.main.zoomTo(1.3, 800, 'Linear', true);

        const txt = this.add.text(
            this.player.x, this.player.y - 80,
            '¡Nivel Completado! 🎉',
            {
                fontSize: '32px', fontStyle: 'bold',
                color: '#ffffff', stroke: '#005522', strokeThickness: 5
            }
        ).setOrigin(0.5).setDepth(20);

        if (this.uiCamera) this.uiCamera.ignore(txt);

        this.time.delayedCall(1800, () => {
            if (this.nextLevel) {
                this.cameras.main.fadeOut(600, 0, 0, 0);
                this.cameras.main.once('camerafadeoutcomplete', () => {
                    this.scene.start(this.nextLevel);
                });
            } else {
                this.scene.start('MenuScene');
            }
        });
    }

    // ─────────────────────────────────────────
    // LEER PROPIEDADES DE UN TILE POR GID
    // ─────────────────────────────────────────
    getTileProperties(gid) {
        const tileset = this.map.tilesets[0];
        if (!tileset) return null;

        const localId = gid - tileset.firstgid;
        const tileData = tileset.tileData[localId];
        if (!tileData || !tileData.properties) return null;

        const props = {};
        tileData.properties.forEach(p => { props[p.name] = p.value; });
        return props;
    }

    // ─────────────────────────────────────────
    // CAMARA
    // ─────────────────────────────────────────
    setupCamera() {
        this.cameras.main.startFollow(this.player);
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    }

    // ─────────────────────────────────────────
    // INPUT
    // ─────────────────────────────────────────
    setupInput() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });
        this.spaceBar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    // ─────────────────────────────────────────
    // ANIMACIONES
    // ─────────────────────────────────────────
    createAnimations() {
        if (this.anims.exists('idle')) return;

        this.anims.create({
            key: 'idle',
            frames: [{ key: 'characters', frame: 'character_green_idle' }],
            frameRate: 1, repeat: -1
        });
        this.anims.create({
            key: 'walk',
            frames: [
                { key: 'characters', frame: 'character_green_walk_a' },
                { key: 'characters', frame: 'character_green_walk_b' }
            ],
            frameRate: 6, repeat: -1
        });
        this.anims.create({
            key: 'jump',
            frames: [{ key: 'characters', frame: 'character_green_jump' }],
            frameRate: 1
        });
    }

    // ─────────────────────────────────────────
    // MOVIMIENTO (llamar en update)
    // ─────────────────────────────────────────
    handlePlayerMovement() {
        if (this.player.isDead) return;
        if (Phaser.Input.Keyboard.JustDown(this.spaceBar)) {
            this.shoot();
        }

        if (this.isZoomedOut && this.player.body.blocked.down && !this.player.onBooster) {
            this.cameras.main.zoomTo(1, 400, 'Sine.easeInOut', true);
            this.isZoomedOut = false;
        }

        const speed = 200;

        if (this.cursors.left.isDown || this.wasd.left.isDown) {
            this.player.setVelocityX(-speed);
            this.player.anims.play('walk', true);
            this.player.setFlipX(true);
        } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
            this.player.setVelocityX(speed);
            this.player.anims.play('walk', true);
            this.player.setFlipX(false);
        } else {
            this.player.setVelocityX(0);
            this.player.anims.play('idle', true);
        }

        if (
            (this.cursors.up.isDown || this.wasd.up.isDown) &&
            this.player.body.blocked.down
        ) {
            this.player.setVelocityY(-600);
        }

        if (!this.player.body.blocked.down) {
            this.player.anims.play('jump', true);
        }
    }

    // ─────────────────────────────────────────
    // TILES ESPECIALES (kill, damage, forceY)
    // ─────────────────────────────────────────
    handleTileEffects() {
        if (this.player.isDead) return;

        const tile = this.layer.getTileAtWorldXY(this.player.x, this.player.y);
        if (!tile) return;

        if (tile.properties.kill) this.killPlayer();
        if (tile.properties.forceY) this.player.setVelocityY(tile.properties.forceY);
    }

    // ─────────────────────────────────────────
    // ACTIVAR BOMBA
    // ─────────────────────────────────────────
    activateBomb(player, bomb) {
        if (bomb.activated) return;
        bomb.activated = true;

        const totalMs = bomb.explosionDelay;
        const steps = Math.max(1, Math.floor(totalMs / 1000));

        this.tweens.add({
            targets: bomb, alpha: 0.2,
            duration: Math.floor(totalMs / (steps * 2)),
            yoyo: true, repeat: -1
        });

        bomb.setTint(0xff6666);
        let remaining = steps;
        bomb.countdownText.setText('💣 ' + remaining);

        const ticker = this.time.addEvent({
            delay: 1000, repeat: steps - 1,
            callback: () => {
                remaining--;
                bomb.countdownText.setText(remaining > 0 ? '💣 ' + remaining : '💥');
            }
        });

        this.cameras.main.shake(120, 0.004);

        this.time.delayedCall(totalMs, () => {
            ticker.remove();
            this.explodeBomb(bomb);
        });
    }

    // ─────────────────────────────────────────
    // EXPLOSION
    // ─────────────────────────────────────────
    explodeBomb(bomb) {
        if (bomb.exploded) return;
        bomb.exploded = true;

        const circle = this.add.circle(bomb.x, bomb.y, 20, 0xff6600, 0.85).setDepth(5);
        if (this.uiCamera) this.uiCamera.ignore(circle);

        this.tweens.add({
            targets: circle,
            scaleX: bomb.explosionRadius / 20,
            scaleY: bomb.explosionRadius / 20,
            alpha: 0,
            duration: 450,
            ease: 'Power2',
            onComplete: () => circle.destroy()
        });

        this.cameras.main.shake(350, 0.018);

        const dist = Phaser.Math.Distance.Between(
            bomb.x, bomb.y, this.player.x, this.player.y
        );
        if (dist <= bomb.explosionRadius) this.killPlayer();

        if (bomb.countdownText) bomb.countdownText.destroy();
        bomb.destroy();
    }

    // ─────────────────────────────────────────
    // MATAR JUGADOR
    // ─────────────────────────────────────────
    killPlayer() {
        if (this.player.isDead) return;
        this.player.isDead = true;
        this.player.lives--;

        this.cameras.main.flash(400, 255, 0, 0);
        this.player.setTint(0xff0000);

        this.time.delayedCall(600, () => {
            if (this.player.lives > 0) {
                this.player.setPosition(this.spawnX ?? 100, this.spawnY ?? 300);
                this.player.clearTint();
                this.player.isDead = false;
                this.updateHUD();
            } else {
                this.scene.launch('GameOverScene', { level: this.levelName });
                this.scene.pause();
            }
        });
    }
    // ─────────────────────────────────────────
    // PROYECTILES (Balas)
    // ─────────────────────────────────────────
    createProjectiles() {
        this.projectiles = this.physics.add.group({
            allowGravity: false, // La bala no se cae
            immovable: true
        });

        // Las balas se destruyen si chocan contra una pared del piso
        this.physics.add.collider(this.projectiles, this.layer, (projectile) => {
            projectile.destroy();
        });
    }

    shoot() {
        // Cooldown para no disparar 100 balas por segundo (espera 300ms)
        if (this.lastFired && this.time.now < this.lastFired) return;
        this.lastFired = this.time.now + 300;

        // Creamos la bala (un círculo naranja como bola de fuego/energía)
        const bullet = this.add.circle(this.player.x, this.player.y, 6, 0xffaa00).setDepth(15);
        this.physics.add.existing(bullet);
        bullet.body.allowGravity = false;

        this.projectiles.add(bullet);

        // Hacia dónde mira el jugador determina a dónde va la bala
        const direction = this.player.flipX ? -1 : 1;
        bullet.body.setVelocityX(500 * direction);

        // Destruir bala automáticamente después de 1 segundo si no choca
        this.time.delayedCall(1000, () => {
            if (bullet.active) bullet.destroy();
        });
    }

    // ─────────────────────────────────────────
    // ENEMIGOS
    // ─────────────────────────────────────────
    createEnemies() {
        const enemyLayer = this.map.getObjectLayer('Enemigos');
        if (!enemyLayer) return;

        this.enemies = this.physics.add.group();

        // 1. Leemos dinámicamente tu XML para sacar el nombre del primer enemigo
        const frameNames = this.textures.get('enemies').getFrameNames();
        const defaultFrame = frameNames.length > 0 ? frameNames[0] : null;

        enemyLayer.objects.forEach(obj => {
            // 2. Al tener un "gid", la 'y' de Tiled es la parte inferior del bloque.
            // Calculamos el centro exacto para que Phaser lo dibuje bien sobre el piso.
            const cx = obj.x + (obj.width / 2);
            // Restamos un poco más de obj.height/2 para que caigan suavemente y no se atoren en el piso
            const cy = obj.y - (obj.height / 2) - 10;

            // Creamos el enemigo usando el Atlas XML
            const enemy = this.enemies.create(cx, cy, 'enemies', defaultFrame);

            enemy.setDepth(9);
            enemy.setCollideWorldBounds(true);

            // Físicas del enemigo: patrullaje automático
            enemy.body.setBounceX(1); // Rebota al chocar contra las paredes
            enemy.setVelocityX(80);   // Velocidad de caminata inicial
        });

        // Colisión con el piso para que no se caigan
        this.physics.add.collider(this.enemies, this.layer);

        // Colisión con el jugador
        this.physics.add.overlap(this.player, this.enemies, this.hitEnemy, null, this);

        // Colisión con las balas (si ya creaste la función de disparar)
        if (this.projectiles) {
            this.physics.add.overlap(this.projectiles, this.enemies, this.shootEnemy, null, this);
        }
    }

    hitEnemy(player, enemy) {
        if (!player.isDead) {
            this.killPlayer();
        }
    }

    shootEnemy(projectile, enemy) {
        projectile.destroy(); // Destruimos la bala

        // Animación de muerte del enemigo (se encoge y desaparece)
        enemy.body.enable = false;
        this.tweens.add({
            targets: enemy,
            scaleX: 0,
            scaleY: 0,
            alpha: 0,
            duration: 300,
            onComplete: () => enemy.destroy()
        });

        // Sumar puntos y actualizar HUD
        this.player.score += 50;
        this.updateHUD();
    }

    handleEnemies() {
        if (!this.enemies) return;

        this.enemies.getChildren().forEach(enemy => {
            // Voltear el dibujo del enemigo según hacia dónde camina
            if (enemy.body.velocity.x > 0) {
                enemy.setFlipX(true); // Cambia esto a false si tu dibujo original mira a la derecha
            } else if (enemy.body.velocity.x < 0) {
                enemy.setFlipX(false);
            }
        });
    }
    // ─────────────────────────────────────────
    // HUD Y RESPONSIVENESS
    // ─────────────────────────────────────────
    createHUD() {
        const style = { stroke: '#000000', strokeThickness: 4 };

        // Usamos this.scale.width para tener el tamaño exacto del lienzo
        const w = this.scale.width;
        const h = this.scale.height;

        // Bajamos la posición Y a 30 y damos más margen izquierdo (20)
        this.hudLives = this.add.text(20, 30, '', {
            fontSize: '20px', color: '#ffffff', ...style
        }).setScrollFactor(0).setDepth(20);

        // Bajamos los puntos a Y 60
        this.hudScore = this.add.text(20, 60, '', {
            fontSize: '18px', color: '#ffdd00', ...style
        }).setScrollFactor(0).setDepth(20);

        // Nivel alineado a la derecha con un margen de seguridad de 20px
        this.hudLevel = this.add.text(w - 20, 30, '', {
            fontSize: '20px', color: '#ffff88', ...style
        }).setOrigin(1, 0).setScrollFactor(0).setDepth(20);

        this.updateHUD();

        // ─── CÁMARA DE UI ───
        const uiElements = [this.hudLives, this.hudScore, this.hudLevel];
        this.uiCamera = this.cameras.add(0, 0, w, h);

        // Forzamos a que la cámara UI jamás se mueva de las coordenadas 0,0
        this.uiCamera.setScroll(0, 0);

        this.cameras.main.ignore(uiElements);

        this.children.list.forEach(child => {
            if (!uiElements.includes(child)) {
                this.uiCamera.ignore(child);
            }
        });

        // ─── RESPONSIVE AL TAMAÑO DE LA PANTALLA ───
        this.scale.on('resize', this.resizeHUD, this);
        this.events.once('shutdown', () => {
            this.scale.off('resize', this.resizeHUD, this);
        });
    }

    updateHUD() {
        const lives = this.player.lives ?? 3;
        const score = this.player.score ?? 0;
        const hearts = '❤️ '.repeat(lives) + '🖤 '.repeat(Math.max(0, 3 - lives));
        this.hudLives.setText('Vidas: ' + hearts);
        this.hudScore.setText('Puntos: ' + score);
        this.hudLevel.setText(this.levelName?.replace('Scene', '') ?? '');
    }

    resizeHUD(gameSize) {
        if (!gameSize) return;
        const width = gameSize.width;
        const height = gameSize.height;

        // Reajustamos las dos cámaras
        this.cameras.main.setSize(width, height);
        if (this.uiCamera) {
            this.uiCamera.setSize(width, height);
        }

        // Mantenemos el nivel pegado a la nueva esquina derecha (menos 20px de margen)
        if (this.hudLevel) {
            this.hudLevel.setPosition(width - 20, 30);
        }
    } x
}