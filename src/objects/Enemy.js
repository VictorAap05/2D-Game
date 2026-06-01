import Phaser from 'phaser';

export default class Enemy extends Phaser.Physics.Arcade.Sprite {

    /**
     * @param {Phaser.Scene} scene
     * @param {number} x
     * @param {number} y
     * @param {string} texture
     * @param {string} frame
     * @param {object} config
     * @param {number}  [config.speed=80]
     * @param {number}  [config.points=50]
     * @param {string}  [config.walkA]
     * @param {string}  [config.walkB]
     * @param {boolean} [config.flying=false]
     * @param {number}  [config.scale=1]
     * @param {Phaser.Tilemaps.TilemapLayer} [config.groundLayer]
     */
    constructor(scene, x, y, texture, frame, config = {}) {
        super(scene, x, y, texture, frame);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        // ── Config ────────────────────────────────────────────
        this.speed        = config.speed  ?? 80;
        this.points       = config.points ?? 50;
        this._walkA       = config.walkA  ?? null;
        this._walkB       = config.walkB  ?? null;
        this._flying      = config.flying ?? false;
        this._groundLayer = config.groundLayer ?? null;
        this.isDead       = false;

        // ── Dirección inicial (alternamos para variedad) ───────
        this._dir = (Math.random() < 0.5) ? 1 : -1;

        // ── Visual ────────────────────────────────────────────
        const sc = config.scale ?? 1;
        this.setScale(sc);
        this.setDepth(9);

        // ── Física ────────────────────────────────────────────
        this.setCollideWorldBounds(true);
        // NO setBounceX — controlamos la dirección manualmente

        if (this._flying) {
            this.body.allowGravity = false;
            this.setVelocityX(this.speed * this._dir);
            // Oscilación vertical con tween
            scene.tweens.add({
                targets:  this,
                y:        y + 40,
                duration: 1400 + Phaser.Math.Between(0, 400),
                yoyo:     true,
                repeat:   -1,
                ease:     'Sine.easeInOut'
            });
        } else {
            // Terrestres: empezar a caminar inmediatamente
            this.setVelocityX(this.speed * this._dir);
        }

        // ── Animación de caminata ─────────────────────────────
        this._createWalkAnim(scene, texture);
    }

    // ═══════════════════════════════════════════════════════════
    // ANIMACIONES
    // ═══════════════════════════════════════════════════════════

    _createWalkAnim(scene, texture) {
        const key = `enemy_walk_${this._walkA ?? 'default'}`;

        if (scene.anims.exists(key)) {
            this._animKey = key;
            return;
        }

        if (this._walkA && this._walkB) {
            scene.anims.create({
                key,
                frames: [
                    { key: texture, frame: this._walkA },
                    { key: texture, frame: this._walkB }
                ],
                frameRate: 6,
                repeat:    -1
            });
            this._animKey = key;
        } else {
            this._animKey = null;
        }
    }

    // ═══════════════════════════════════════════════════════════
    // UPDATE
    // ═══════════════════════════════════════════════════════════

    update() {
        if (this.isDead || !this.active || !this.body) return;

        // ── Inversión de dirección ────────────────────────────
        // 1) Toca pared del mundo o tile sólido lateral
        if (this.body.blocked.right) {
            this._dir = -1;
            this.setVelocityX(this.speed * this._dir);
        } else if (this.body.blocked.left) {
            this._dir = 1;
            this.setVelocityX(this.speed * this._dir);
        }

        // 2) Detección de borde de plataforma (terrestres)
        if (!this._flying) {
            this._checkEdge();
        }

        // Asegurar velocidad correcta (puede bajar a 0 si se queda quieto)
        if (Math.abs(this.body.velocity.x) < this.speed * 0.5) {
            this.setVelocityX(this.speed * this._dir);
        }

        // ── Flip sprite ───────────────────────────────────────
        this.setFlipX(this._dir > 0);

        // ── Animación ─────────────────────────────────────────
        if (this._animKey) this.anims.play(this._animKey, true);
    }

    /**
     * Detecta si hay suelo delante. Si no lo hay, invierte la dirección.
     * El sensor se coloca al frente y justo debajo del pie del sprite.
     */
    _checkEdge() {
        if (!this._groundLayer) return;

        const halfW  = (this.width  * this.scaleX) / 2;
        const halfH  = (this.height * this.scaleY) / 2;

        // Punto delante del pie
        const checkX = this.x + this._dir * (halfW + 4);
        const checkY = this.y + halfH + 8;   // justo debajo del pie

        const tile = this._groundLayer.getTileAtWorldXY(checkX, checkY);

        if (!tile || !tile.properties?.collides) {
            this._dir *= -1;
            this.setVelocityX(this.speed * this._dir);
        }
    }

    // ═══════════════════════════════════════════════════════════
    // MUERTE
    // ═══════════════════════════════════════════════════════════

    die(onComplete) {
        if (this.isDead) return;
        this.isDead      = true;
        this.body.enable = false;

        this.scene.tweens.add({
            targets:  this,
            alpha:    0,
            scaleX:   0,
            scaleY:   0,
            y:        this.y - 24,
            duration: 300,
            ease:     'Power2',
            onComplete: () => {
                this.destroy();
                onComplete?.();
            }
        });
    }
}
