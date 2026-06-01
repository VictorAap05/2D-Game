/**
 * ProjectileManager
 * Gestiona la creación y ciclo de vida de los proyectiles (balas).
 */
export default class ProjectileManager {

    static COOLDOWN_MS = 300;
    static SPEED       = 500;
    static LIFETIME_MS = 1000;
    static RADIUS      = 6;
    static COLOR       = 0xffaa00;

    /**
     * @param {Phaser.Scene} scene
     * @param {Phaser.Tilemaps.TilemapLayer} groundLayer - para destruir balas en paredes
     * @param {AudioManager} audio
     */
    constructor(scene, groundLayer, audio) {
        this.scene       = scene;
        this.groundLayer = groundLayer;
        this.audio       = audio;
        this._lastFired  = 0;

        this.group = this.scene.physics.add.group({
            allowGravity: false,
            immovable: true
        });

        // Destruir bala al chocar con el piso/paredes
        this.scene.physics.add.collider(
            this.group,
            this.groundLayer,
            (bullet) => bullet.destroy()
        );
    }

    // ─── DISPARAR ────────────────────────────────────────────

    /**
     * @param {Phaser.Physics.Arcade.Sprite} player
     */
    shoot(player) {
        const now = this.scene.time.now;
        if (now < this._lastFired) return;
        this._lastFired = now + ProjectileManager.COOLDOWN_MS;

        const bullet = this.scene.add.circle(
            player.x, player.y,
            ProjectileManager.RADIUS,
            ProjectileManager.COLOR
        ).setDepth(15);

        this.scene.physics.add.existing(bullet);
        bullet.body.allowGravity = false;
        this.group.add(bullet);

        const dir = player.flipX ? -1 : 1;
        bullet.body.setVelocityX(ProjectileManager.SPEED * dir);

        this.scene.time.delayedCall(ProjectileManager.LIFETIME_MS, () => {
            if (bullet.active) bullet.destroy();
        });

        if (this.audio) this.audio.playSfx('shoot');
    }

    getGroup() { return this.group; }
}
