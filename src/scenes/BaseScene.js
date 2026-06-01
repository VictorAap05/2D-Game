import Phaser from 'phaser';
import AudioManager from '../managers/AudioManager.js';
import EnemyManager from '../managers/EnemyManager.js';
import HUDManager from '../managers/HUDManager.js';
import ProjectileManager from '../managers/ProjectileManager.js';
import ScoreManager from '../managers/ScoreManager.js';
import StorageManager from '../managers/StorageManager.js';
import { PhysicsConstants } from '../physics/PhysicsHelper.js';

/**
 * BaseScene 
 *
 * Clase base de la que heredan todos los niveles.
 *
 * 
 *
 * Cada nivel que extienda BaseScene debe definir en su constructor:
 *   this.mapKey    → key del tilemap registrado en PreloadScene
 *   this.levelName → 'Level1Scene', 'Level2Scene', etc.
 *   this.levelNum  → número de nivel para localStorage
 *   this.nextLevel → key de la siguiente escena (o null = MenuScene)
 *   this.spawnX/Y  → posición inicial del jugador
 *   this.parTime   → (opcional) segundos objetivo para bonus de tiempo
 */
export default class BaseScene extends Phaser.Scene {

    // ═══════════════════════════════════════════════════════════
    // LIFECYCLE
    // ═══════════════════════════════════════════════════════════

    create() {
        // 1. Mapa y capa de colisión
        this.createMap();

        // 2. Jugador
        this.createPlayer();
        this.physics.add.collider(this.player, this.layer);

        // 3. Objetos del mapa
        this.createBombs();
        this.createCoins();
        this.createBoosters();
        this.createSpikes();
        this.createGoal();
        this.createCheckpoints();

        // 4. Managers de sistemas
        this._audio = new AudioManager(this);
        this._projectile = new ProjectileManager(this, this.layer, this._audio);
        this._enemy = new EnemyManager(
            this, this.map, this.player,
            this._projectile.getGroup(), this.layer, this._audio
        );
        this._enemy.create();

        // 5. Overlap bombas
        if (this.bombs) {
            this.physics.add.overlap(
                this.player, this.bombs,
                this.activateBomb, null, this
            );
        }

        // 6. Cámara, input, animaciones
        this.setupCamera();
        this.setupInput();
        this.createAnimations();

        // 7. HUD (al final para que uiCamera ignore objetos del mundo)
        this._hud = new HUDManager(this, this.player, this.levelName, this._audio);
        this._hud.create();

        // 8. ScoreManager (después del HUD)
        this._score = new ScoreManager(this, this.player, this._hud);
        this._score.start();

        // 9. Música de fondo
        this._audio.playMusic('bgm');

        // 10. Persistencia
        StorageManager.saveLevelReached(this.levelNum ?? 1);

        // 11. Pausa — ESC lanza PauseScene separada
        this._pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        // El botón táctil de pausa del HUD también emite este evento
        this.events.on('pauseRequested', this._launchPause, this);

        // 12. Fade-in
        this.cameras.main.fadeIn(500, 0, 0, 0);

        // 13. Limpieza
        this.events.once('shutdown', () => this._cleanup());
    }

    update() {
        // Activar pausa con ESC (teclado)
        if (Phaser.Input.Keyboard.JustDown(this._pauseKey)) {
            this._launchPause();
        }

        // El jugador y enemigos se actualizan normalmente (la escena
        // queda suspendida cuando PauseScene está activa, así que este
        // update no se ejecuta durante la pausa)
        this.handlePlayerMovement();
        this.handleTileEffects();
        this._enemy?.update();

        // Actualizar HUD (timer, combo)
        this._hud?.update();
    }

    _cleanup() {
        this._audio?.destroy();
        this.events.off('pauseRequested', this._launchPause, this);
    }

    // ═══════════════════════════════════════════════════════════
    // PAUSA → delegada a PauseScene
    // ═══════════════════════════════════════════════════════════

    _launchPause() {
        // Suspende esta escena y lanza PauseScene encima
        this.scene.pause();
        this.scene.launch('PauseScene', {
            fromLevel: this.scene.key,
            audio: this._audio
        });
    }

    // ═══════════════════════════════════════════════════════════
    // MAPA
    // ═══════════════════════════════════════════════════════════

    createMap() {
        const map = this.make.tilemap({ key: this.mapKey });
        const tileset = map.addTilesetImage('tileset', 'tiles');

        const layerName = map.layers.find(l => l.name === 'Piso')
            ? 'Piso'
            : (map.layers[0]?.name ?? 'Piso');

        const layer = map.createLayer(layerName, tileset, 0, 0);
        layer.setCollisionByProperty({ collides: true });

        this.layer = layer;
        this.map = map;
    }

    // ═══════════════════════════════════════════════════════════
    // JUGADOR
    // ═══════════════════════════════════════════════════════════

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

        this.physics.world.TILE_BIAS = PhysicsConstants.TILE_BIAS;
        this.player.setMaxVelocity(
            PhysicsConstants.MAX_VELOCITY,
            PhysicsConstants.MAX_VELOCITY
        );

        this.player.lives = 3;
        this.player.score = 0;
        this.player.isDead = false;
        this.player.onBooster = false;
    }

    // ═══════════════════════════════════════════════════════════
    // CÁMARA
    // ═══════════════════════════════════════════════════════════

    setupCamera() {
        this.cameras.main.startFollow(this.player);
        this.cameras.main.setBounds(
            0, 0,
            this.map.widthInPixels,
            this.map.heightInPixels
        );
        this.physics.world.setBounds(
            0, 0,
            this.map.widthInPixels,
            this.map.heightInPixels
        );
    }

    // ═══════════════════════════════════════════════════════════
    // INPUT
    // ═══════════════════════════════════════════════════════════

    setupInput() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });
        this.spaceBar = this.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.SPACE
        );
    }

    // ═══════════════════════════════════════════════════════════
    // ANIMACIONES
    // ═══════════════════════════════════════════════════════════

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

    // ═══════════════════════════════════════════════════════════
    // MOVIMIENTO
    // ═══════════════════════════════════════════════════════════

    handlePlayerMovement() {
        if (this.player.isDead) return;

        const touch = this._hud?.getTouchInput() ?? {};
        const speed = PhysicsConstants.PLAYER_SPEED;
        const goLeft = this.cursors.left.isDown || this.wasd.left.isDown || touch.left;
        const goRight = this.cursors.right.isDown || this.wasd.right.isDown || touch.right;
        const goJump = this.cursors.up.isDown || this.wasd.up.isDown || touch.jump;
        const goShoot = Phaser.Input.Keyboard.JustDown(this.spaceBar) || touch.shoot;

        if (goShoot) {
            this._projectile?.shoot(this.player);
        }

        // Restablecer zoom después de booster
        if (this.isZoomedOut && this.player.body.blocked.down && !this.player.onBooster) {
            this.cameras.main.zoomTo(1, 400, 'Sine.easeInOut', true);
            this.isZoomedOut = false;
        }

        if (goLeft) {
            this.player.setVelocityX(-speed);
            this.player.anims.play('walk', true);
            this.player.setFlipX(true);
        } else if (goRight) {
            this.player.setVelocityX(speed);
            this.player.anims.play('walk', true);
            this.player.setFlipX(false);
        } else {
            this.player.setVelocityX(0);
            this.player.anims.play('idle', true);
        }

        if (goJump && this.player.body.blocked.down) {
            this.player.setVelocityY(PhysicsConstants.JUMP_VELOCITY);
            this._audio?.playSfx('jump');
        }

        if (!this.player.body.blocked.down) {
            this.player.anims.play('jump', true);
        }
    }

    // ═══════════════════════════════════════════════════════════
    // TILES ESPECIALES
    // ═══════════════════════════════════════════════════════════

    handleTileEffects() {
        if (this.player.isDead) return;
        const tile = this.layer.getTileAtWorldXY(this.player.x, this.player.y);
        if (!tile) return;
        if (tile.properties.kill) this.killPlayer();
        if (tile.properties.forceY) this.player.setVelocityY(tile.properties.forceY);
    }

    // ═══════════════════════════════════════════════════════════
    // CALLBACKS DE ENEMIGOS
    // ═══════════════════════════════════════════════════════════

    onEnemyContactPlayer(player, enemy) {
        if (!player.isDead) {
            this._audio?.playSfx('hit');
            this._score?.resetCombo();
            this.killPlayer();
        }
    }

    onEnemyKilled(points) {
        // ScoreManager calcula combo y texto flotante
        this._score?.addPoints(points, this.player.x, this.player.y - 30, true);
        StorageManager.saveHighScore(this.player.score);
        this._hud?.update();
    }

    // ═══════════════════════════════════════════════════════════
    // BOMBAS
    // ═══════════════════════════════════════════════════════════

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
            bomb.explosionRadius = tileProps?.explosionRadius ?? PhysicsConstants.EXPLOSION_RADIUS;
            bomb.explosionDelay = tileProps?.explosionDelay ?? 2000;
            bomb.refreshBody();

            bomb.countdownText = this.add.text(cx, cy - 48, '', {
                fontSize: '22px', fontStyle: 'bold',
                color: '#ffff00', stroke: '#000000', strokeThickness: 4
            }).setOrigin(0.5).setDepth(10);

            this._hud?.ignoreOnUICamera(bomb.countdownText);
        });
    }

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

    explodeBomb(bomb) {
        if (bomb.exploded) return;
        bomb.exploded = true;

        const circle = this.add.circle(bomb.x, bomb.y, 20, 0xff6600, 0.85).setDepth(5);
        this._hud?.ignoreOnUICamera(circle);

        this.tweens.add({
            targets: circle,
            scaleX: bomb.explosionRadius / 20,
            scaleY: bomb.explosionRadius / 20,
            alpha: 0,
            duration: 450, ease: 'Power2',
            onComplete: () => circle.destroy()
        });

        this.cameras.main.shake(350, 0.018);
        this._audio?.playSfx('explode');

        const dist = Phaser.Math.Distance.Between(
            bomb.x, bomb.y, this.player.x, this.player.y
        );
        if (dist <= bomb.explosionRadius) this.killPlayer();

        bomb.countdownText?.destroy();
        bomb.destroy();
    }

    // ═══════════════════════════════════════════════════════════
    // PINCHOS
    // ═══════════════════════════════════════════════════════════

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
            spike.body.setCircle(24, 8, 8);

            const props = this.getTileProperties(obj.gid);
            spike.isLethal = props?.kill ?? true;

            this.tweens.add({
                targets: spike, angle: 360,
                duration: 1500, repeat: -1, ease: 'Linear'
            });
        });

        this.physics.add.overlap(
            this.player, this.spikes,
            (player, spike) => {
                if (spike.isLethal && !player.isDead) this.killPlayer();
            },
            null, this
        );
    }

    // ═══════════════════════════════════════════════════════════
    // MONEDAS
    // ═══════════════════════════════════════════════════════════

    createCoins() {
        const coinLayer = this.map.getObjectLayer('Monedas');
        if (!coinLayer) return;

        this.coins = this.physics.add.staticGroup();
        this.totalCoins = coinLayer.objects.length;
        this.collectedCoins = 0;

        const firstgid = this.map.tilesets[0]?.firstgid ?? 1;

        coinLayer.objects.forEach(obj => {
            const frame = (obj.gid ?? 37) - firstgid;
            const cx = obj.x + obj.width / 2;
            const cy = obj.y - obj.height / 2;

            const coin = this.coins.create(cx, cy, 'tiles-sheet', frame);
            coin.setScale(0.8);
            coin.refreshBody();

            this.tweens.add({
                targets: coin, y: cy - 8,
                duration: 800, yoyo: true, repeat: -1,
                ease: 'Sine.easeInOut',
                delay: Phaser.Math.Between(0, 400)
            });

            const props = this.getTileProperties(obj.gid);
            coin.value = props?.valor ?? 10;
        });

        this.physics.add.overlap(this.player, this.coins, this._collectCoin, null, this);
    }

    _collectCoin(player, coin) {
        if (coin.collected) return;
        coin.collected = true;
        this.collectedCoins++;
        coin.body.enable = false;

        const value = coin.value ?? 10;

        this.tweens.add({
            targets: coin, y: coin.y - 30, alpha: 0,
            duration: 300, onComplete: () => coin.destroy()
        });

        this._audio?.playSfx('coin');
        this._score?.addPoints(value, coin.x, coin.y - 10, false);
        this._hud?.update();
    }

    // ═══════════════════════════════════════════════════════════
    // META
    // ═══════════════════════════════════════════════════════════

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

            const props = this.getTileProperties(obj.gid);
            if (props?.nextLevel) {
                goal.targetLevel = 'Level' + props.nextLevel + 'Scene';
            }
        });

        this.physics.add.overlap(this.player, this.goals, this._hitGoal, null, this);
    }

    _hitGoal(player, goal) {
        if (player.isDead) return;

        if (this.collectedCoins >= (this.totalCoins ?? 0)) {
            if (goal.targetLevel) this.nextLevel = goal.targetLevel;
            this.onLevelComplete();
        } else {
            if (goal.warningActive) return;
            goal.warningActive = true;
            const faltan = (this.totalCoins ?? 0) - this.collectedCoins;

            const txt = this.add.text(goal.x, goal.y - 50,
                `¡Faltan ${faltan} monedas!`, {
                fontSize: '18px', fontStyle: 'bold',
                color: '#ff3333', stroke: '#000000', strokeThickness: 4
            }
            ).setOrigin(0.5).setDepth(20);

            this._hud?.ignoreOnUICamera(txt);

            this.tweens.add({
                targets: txt, y: txt.y - 30, alpha: 0,
                duration: 1500,
                onComplete: () => {
                    txt.destroy();
                    goal.warningActive = false;
                }
            });
        }
    }
    // ─────────────────────────────────────────
    // FONDO (Background)
    // ─────────────────────────────────────────
    createBackground() {
        const w = this.scale.width;
        const h = this.scale.height;

        // Colocamos la imagen que cargamos en el centro de la pantalla
        this.bg = this.add.image(w / 2, h / 2, 'fondoEspacio');

        // Lo mandamos al fondo de todo (detrás del mapa)
        this.bg.setDepth(-10);

        // Estiramos la imagen para que cubra toda tu pantalla perfectamente
        this.bg.setDisplaySize(w, h);

        // EFECTO PARALLAX: 0 hace que se quede fija como fondo de pantalla
        this.bg.setScrollFactor(0);
    }
        createBackground2() {
        const w = this.scale.width;
        const h = this.scale.height;

        // Colocamos la imagen que cargamos en el centro de la pantalla
        this.bg = this.add.image(w / 2, h / 2, 'fondo2');

        // Lo mandamos al fondo de todo (detrás del mapa)
        this.bg.setDepth(-10);

        // Estiramos la imagen para que cubra toda tu pantalla perfectamente
        this.bg.setDisplaySize(w, h);

        // EFECTO PARALLAX: 0 hace que se quede fija como fondo de pantalla
        this.bg.setScrollFactor(0);
    }
    // ═══════════════════════════════════════════════════════════
    // IMPULSOR
    // ═══════════════════════════════════════════════════════════

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
            booster.forceY = props?.forceY ?? -700;
            booster.refreshBody();

            this.tweens.add({
                targets: booster, alpha: 0.5,
                duration: 500, yoyo: true, repeat: -1,
                ease: 'Sine.easeInOut'
            });
        });

        this.physics.add.overlap(this.player, this.boosters, this._hitBooster, null, this);
    }

    _hitBooster(player, booster) {
        if (player.onBooster) return;
        player.onBooster = true;

        player.setVelocityY(booster.forceY);
        this.cameras.main.zoomTo(0.6, 500, 'Sine.easeInOut', true);
        this.isZoomedOut = true;

        for (let i = 0; i < 5; i++) {
            const p = this.add.circle(
                booster.x + Phaser.Math.Between(-20, 20), booster.y,
                5, 0xffff00, 0.9
            ).setDepth(8);
            this._hud?.ignoreOnUICamera(p);

            this.tweens.add({
                targets: p, y: p.y - Phaser.Math.Between(40, 80), alpha: 0,
                duration: Phaser.Math.Between(300, 600),
                delay: i * 60,
                onComplete: () => p.destroy()
            });
        }

        this.time.delayedCall(300, () => { player.onBooster = false; });
    }

    // ═══════════════════════════════════════════════════════════
    // CHECKPOINTS
    // ═══════════════════════════════════════════════════════════

    createCheckpoints() {
        const cpLayer = this.map.getObjectLayer('Checkpoints');
        if (!cpLayer) return;

        this.checkpoints = this.physics.add.staticGroup();
        const firstgid = this.map.tilesets[0]?.firstgid ?? 1;

        cpLayer.objects.forEach(obj => {
            const frame = (obj.gid ?? 131) - firstgid;
            const cx = obj.x + obj.width / 2;
            const cy = obj.y - obj.height / 2;
            const props = this.getTileProperties(obj.gid);
            const isGoal = props?.type === 'goal';

            const cp = this.checkpoints.create(cx, cy, 'tiles-sheet', frame);
            cp.isGoal = isGoal;
            cp.spawnX = cx;
            cp.spawnY = cy;
            cp.reached = false;
            cp.refreshBody();

            if (!isGoal) {
                this.tweens.add({
                    targets: cp, scaleX: 0.85,
                    duration: 600, yoyo: true, repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            }
        });

        this.physics.add.overlap(
            this.player, this.checkpoints,
            this._hitCheckpoint, null, this
        );
    }

    _hitCheckpoint(player, cp) {
        if (cp.reached) return;
        cp.reached = true;

        if (cp.isGoal) {
            this.onLevelComplete();
        } else {
            this.spawnX = cp.spawnX;
            this.spawnY = cp.spawnY - 20;

            this.cameras.main.flash(300, 0, 200, 0);
            cp.setTint(0x00ff66);
            this.tweens.killTweensOf(cp);

            const txt = this.add.text(cp.x, cp.y - 50, '✔ Checkpoint!', {
                fontSize: '18px', fontStyle: 'bold',
                color: '#00ff88', stroke: '#000000', strokeThickness: 3
            }).setOrigin(0.5).setDepth(15);

            this._hud?.ignoreOnUICamera(txt);

            this.tweens.add({
                targets: txt, y: txt.y - 40, alpha: 0,
                duration: 1000, onComplete: () => txt.destroy()
            });
        }
    }

    // ═══════════════════════════════════════════════════════════
    // FIN DE NIVEL
    // ═══════════════════════════════════════════════════════════

    onLevelComplete() {
        if (this.player.isDead) return;
        this.player.isDead = true;

        // Bonus de tiempo (parTime definido por cada nivel, default 90s)
        const bonus = this._score?.addTimeBonus(this.parTime ?? 90) ?? 0;
        StorageManager.saveHighScore(this.player.score);

        this._audio?.playSfx('level');
        this.cameras.main.flash(500, 255, 255, 255);
        this.cameras.main.zoomTo(1.3, 800, 'Linear', true);

        const txt = this.add.text(
            this.player.x, this.player.y - 80,
            bonus > 0 ? `¡Nivel Completado! 🎉\n+${bonus} pts bonus tiempo` : '¡Nivel Completado! 🎉',
            {
                fontSize: '28px', fontStyle: 'bold',
                color: '#ffffff', stroke: '#005522', strokeThickness: 5,
                align: 'center'
            }
        ).setOrigin(0.5).setDepth(20);

        this._hud?.ignoreOnUICamera(txt);

        this.time.delayedCall(1800, () => {
            this.cameras.main.fadeOut(600, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start(this.nextLevel ?? 'MenuScene');
            });
        });
    }

    // ═══════════════════════════════════════════════════════════
    // MATAR JUGADOR
    // ═══════════════════════════════════════════════════════════

    killPlayer() {
        if (this.player.isDead) return;
        this.player.isDead = true;
        this.player.lives--;
        this._score?.resetCombo();

        this.cameras.main.flash(400, 255, 0, 0);
        this.player.setTint(0xff0000);
        this._audio?.playSfx('hit');

        this.time.delayedCall(600, () => {
            if (this.player.lives > 0) {
                this.player.setPosition(this.spawnX ?? 100, this.spawnY ?? 300);
                this.player.clearTint();
                this.player.isDead = false;
                this._hud?.update();
            } else {
                StorageManager.saveHighScore(this.player.score);
                this.scene.launch('GameOverScene', {
                    level: this.scene.key,
                    score: this.player.score,
                    highScore: StorageManager.getHighScore()
                });
                this.scene.pause();
            }
        });
    }

    // ═══════════════════════════════════════════════════════════
    // UTILIDADES
    // ═══════════════════════════════════════════════════════════

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
}
