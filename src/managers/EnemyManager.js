import Enemy from '../objects/Enemy.js';

export default class EnemyManager {

    constructor(scene, map, player, projectiles, groundLayer, audio) {
        this.scene       = scene;
        this.map         = map;
        this.player      = player;
        this.projectiles = projectiles;
        this.groundLayer = groundLayer;
        this.audio       = audio;
        this.group       = null;
        this._collidersRegistered = false;
    }

    // ═══════════════════════════════════════════════════════════
    // CREACIÓN
    // ═══════════════════════════════════════════════════════════

    create() {
        const enemyLayer = this.map.getObjectLayer('Enemigos');
        if (!enemyLayer || enemyLayer.objects.length === 0) return;

        this.group = this.scene.physics.add.group();

        // Tipos que usan frames REALES del atlas 'enemies' de Kenney
        // (verificados contra spritesheet-enemies-default.xml)
        const ENEMY_TYPES = [
            { walkA: 'slime_normal_walk_a', walkB: 'slime_normal_walk_b', rest: 'slime_normal_rest', speed: 60,  points: 40  },
            { walkA: 'ladybug_walk_a',      walkB: 'ladybug_walk_b',      rest: 'ladybug_rest',      speed: 85,  points: 60  },
            { walkA: 'mouse_walk_a',        walkB: 'mouse_walk_b',        rest: 'mouse_rest',        speed: 110, points: 80  },
            { walkA: 'snail_walk_a',        walkB: 'snail_walk_b',        rest: 'snail_rest',        speed: 45,  points: 30  },
            { walkA: 'bee_fly_a',           walkB: 'bee_fly_b',           rest: 'bee_fly_a',         speed: 70,  points: 100, flying: true },
        ];

        enemyLayer.objects.forEach((obj, i) => {
            // Centro horizontal del objeto en el mapa
            const cx   = obj.x + obj.width  / 2;
            // Posición vertical corregida: buscamos el suelo real debajo
            const rawY = obj.y - obj.height / 2 - 4;
            const cy   = this._findGroundY(cx, rawY);

            const type = ENEMY_TYPES[i % ENEMY_TYPES.length];

            const enemy = new Enemy(
                this.scene, cx, cy,
                'enemies', type.rest,
                {
                    speed:       type.speed,
                    points:      type.points,
                    walkA:       type.walkA,
                    walkB:       type.walkB,
                    flying:      type.flying ?? false,
                    groundLayer: this.groundLayer
                }
            );

            this.group.add(enemy);
        });

        this._registerColliders();
    }

    /**
     * Busca el Y correcto de spawn: el tile de suelo más cercano por
     * debajo de `rawY` en la columna `worldX`.
     * Si no hay suelo cercano, devuelve rawY (el enemigo caerá y si no
     * hay plataforma quedará fuera de pantalla, que es el comportamiento
     * esperado cuando el diseñador puso el objeto mal).
     */
    _findGroundY(worldX, rawY) {
        if (!this.groundLayer) return rawY;

        const TW = this.map.tileWidth;
        const TH = this.map.tileHeight;
        const tx = Math.floor(worldX / TW);

        // Buscar hasta 15 tiles hacia abajo
        for (let dy = 0; dy < 15; dy++) {
            const ty   = Math.floor(rawY / TH) + dy;
            const tile = this.groundLayer.getTileAt(tx, ty);
            if (tile && tile.properties?.collides) {
                // Colocar al enemigo justo encima del tile de suelo
                return ty * TH - 32; // 32 = mitad aproximada del sprite
            }
        }
        return rawY;
    }

    // ═══════════════════════════════════════════════════════════
    // COLISIONES
    // ═══════════════════════════════════════════════════════════

    _registerColliders() {
        if (!this.group || this._collidersRegistered) return;
        this._collidersRegistered = true;

        // Enemigos terrestres colisionan con el piso
        this.scene.physics.add.collider(this.group, this.groundLayer);

        // Jugador toca enemigo
        this.scene.physics.add.overlap(
            this.player, this.group,
            this._onPlayerHit, null, this
        );

        // Proyectil mata enemigo
        if (this.projectiles) {
            this.scene.physics.add.overlap(
                this.projectiles, this.group,
                this._onProjectileHit, null, this
            );
        }
    }

    _onPlayerHit(player, enemy) {
        if (player.isDead || enemy.isDead) return;
        this.scene.onEnemyContactPlayer(player, enemy);
    }

    _onProjectileHit(projectile, enemy) {
        if (enemy.isDead) return;
        projectile.destroy();
        const points = enemy.points ?? 50;
        enemy.die(() => this.scene.onEnemyKilled(points));
        this.audio?.playSfx('hit');
    }

    // ═══════════════════════════════════════════════════════════
    // UPDATE / UTILIDADES
    // ═══════════════════════════════════════════════════════════

    update() {
        this.group?.getChildren().forEach(e => e.update?.());
    }

    getGroup()      { return this.group; }
    getEnemyCount() { return this.group?.getChildren().length ?? 0; }
    getAliveCount() { return this.group?.getChildren().filter(e => !e.isDead).length ?? 0; }
}