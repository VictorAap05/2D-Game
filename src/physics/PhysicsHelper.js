/**
 * PhysicsHelper
 * Utilidades de física reutilizables entre escenas.
 *
 * Este módulo existía vacío (solo .gitkeep). Ahora centraliza:
 *  - Constantes de física del juego
 *  - Creación de cuerpos físicos especiales
 *  - Helpers de detección de colisiones/proximidad
 *
 * Uso:
 *   import { PhysicsConstants, PhysicsHelper } from '../physics/PhysicsHelper.js';
 */

// ═══════════════════════════════════════════════════════════════
// CONSTANTES GLOBALES DE FÍSICA
// ═══════════════════════════════════════════════════════════════

export const PhysicsConstants = {
    /** Gravedad global del juego (coindicde con arcade.gravity.y en main.js) */
    GRAVITY_Y:       900,

    /** Velocidad horizontal del jugador */
    PLAYER_SPEED:    200,

    /** Velocidad de salto del jugador */
    JUMP_VELOCITY:  -600,

    /** Sesgo de tiles para prevenir "tunneling" a alta velocidad */
    TILE_BIAS:        64,

    /** Velocidad máxima del jugador (X e Y) */
    MAX_VELOCITY:    800,

    /** Velocidad de los proyectiles */
    BULLET_SPEED:    500,

    /** Radio visual de explosión por defecto (bombas) */
    EXPLOSION_RADIUS: 150,
};

// ═══════════════════════════════════════════════════════════════
// HELPERS DE FÍSICA
// ═══════════════════════════════════════════════════════════════

export class PhysicsHelper {

    /**
     * Retorna true si dos objetos están a menos de `distance` píxeles.
     * @param {Phaser.GameObjects.GameObject} a
     * @param {Phaser.GameObjects.GameObject} b
     * @param {number} distance
     */
    static inRange(a, b, distance) {
        return Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y) <= distance;
    }

    /**
     * Empuja al jugador en dirección opuesta a un objeto (knockback).
     * @param {Phaser.Physics.Arcade.Sprite} player
     * @param {Phaser.GameObjects.GameObject} source - objeto que origina el empuje
     * @param {number} force - fuerza del empuje en píxeles/s
     */
    static knockback(player, source, force = 350) {
        const dir = player.x > source.x ? 1 : -1;
        player.setVelocityX(dir * force);
        player.setVelocityY(-force * 0.5);
    }

    /**
     * Crea una zona de trigger rectangular con overlap.
     * @param {Phaser.Scene} scene
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     * @param {Phaser.Physics.Arcade.Sprite} target - objeto que activa el trigger
     * @param {Function} callback
     * @returns {Phaser.GameObjects.Zone}
     */
    static createTrigger(scene, x, y, w, h, target, callback) {
        const zone = scene.add.zone(x, y, w, h);
        scene.physics.add.existing(zone, true); // cuerpo estático
        scene.physics.add.overlap(target, zone, callback);
        return zone;
    }

    /**
     * Aplica una sacudida de cámara proporcional a la distancia de la fuente.
     * @param {Phaser.Scene} scene
     * @param {Phaser.GameObjects.GameObject} player
     * @param {Phaser.GameObjects.GameObject} source
     * @param {number} maxRadius  - distancia máxima donde se siente la sacudida
     * @param {number} intensity  - intensidad máxima (0..1)
     */
    static shakeByDistance(scene, player, source, maxRadius = 400, intensity = 0.018) {
        const dist   = Phaser.Math.Distance.Between(player.x, player.y, source.x, source.y);
        const factor = Math.max(0, 1 - dist / maxRadius);
        if (factor > 0) {
            scene.cameras.main.shake(350 * factor, intensity * factor);
        }
    }

    /**
     * Convierte coordenadas de tile a coordenadas de mundo (centro del tile).
     * @param {Phaser.Tilemaps.Tilemap} map
     * @param {number} tileX
     * @param {number} tileY
     * @returns {{ x: number, y: number }}
     */
    static tileToWorld(map, tileX, tileY) {
        return {
            x: tileX * map.tileWidth  + map.tileWidth  / 2,
            y: tileY * map.tileHeight + map.tileHeight / 2
        };
    }

    /**
     * Verifica si un sprite está en el suelo (usando Arcade body.blocked.down).
     * @param {Phaser.Physics.Arcade.Sprite} sprite
     * @returns {boolean}
     */
    static isGrounded(sprite) {
        return sprite.body?.blocked?.down ?? false;
    }
}
