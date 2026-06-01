import Phaser from 'phaser';

/**
 * PreloadScene — v2
 *
 * Carga todos los assets antes de mostrar el menú.
 *
 * AUDIO:
 *   Coloca los archivos en public/assets/audio/
 *   Formatos: .ogg (preferido en web) y .mp3 (fallback)
 *
 *   Assets gratuitos sugeridos:
 *     Música: https://pixabay.com/music/
 *       → busca "8-bit platform", "chiptune adventure"
 *     SFX:    https://opengameart.org
 *       → kenney.nl/assets/category/audio (jump, coin, hit, shoot)
 *
 *   Nombres esperados en public/assets/audio/:
 *     bgm.ogg       → música de fondo (loop)
 *     jump.ogg      → salto del jugador
 *     coin.ogg      → recoger moneda
 *     hit.ogg       → jugador / enemigo recibe daño
 *     shoot.ogg     → disparo
 *     explode.ogg   → explosión de bomba
 *     level.ogg     → nivel completado
 *
 *   Si algún archivo no existe, AudioManager usará el fallback sintético
 *   automáticamente: el juego funciona sin archivos de audio.
 */
export default class PreloadScene extends Phaser.Scene {

    constructor() {
        super('PreloadScene');
    }

    preload() {
        const { width, height } = this.scale;

        // ── Pantalla de carga ─────────────────────────────────
        this.add.rectangle(0, 0, width, height, 0x0d1117).setOrigin(0, 0);

        const barBg = this.add.rectangle(width / 2, height / 2, 400, 22, 0x222222);
        const bar   = this.add.rectangle(width / 2 - 200, height / 2, 0, 22, 0x00cc66)
            .setOrigin(0, 0.5);

        this.add.text(width / 2, height / 2 - 48, '🎮 Cargando…', {
            fontSize: '24px', color: '#ffffff'
        }).setOrigin(0.5);

        const pct = this.add.text(width / 2, height / 2 + 38, '0 %', {
            fontSize: '16px', color: '#888888'
        }).setOrigin(0.5);

        this.load.on('progress', v => {
            bar.width = 400 * v;
            pct.setText(Math.round(v * 100) + ' %');
        });

        // ── Mapas ─────────────────────────────────────────────
        this.load.tilemapTiledJSON('map1', 'assets/maps/mapa1.json');
        this.load.tilemapTiledJSON('map3', 'assets/maps/mapa3.json');

        // ── Tileset ───────────────────────────────────────────
        this.load.image('tiles', 'assets/tiles/spritesheet-tiles-default.png');
        this.load.spritesheet(
            'tiles-sheet',
            'assets/tiles/spritesheet-tiles-default.png',
            { frameWidth: 64, frameHeight: 64, spacing: 1, margin: 0 }
        );

        // ── Personaje ─────────────────────────────────────────
        this.load.atlasXML(
            'characters',
            'assets/player/spritesheet-characters-default.png',
            'assets/player/spritesheet-characters-default.xml'
        );

        // ── Enemigos ──────────────────────────────────────────
        this.load.atlasXML(
            'enemies',
            'assets/enemies/spritesheet-enemies-default.png',
            'assets/enemies/spritesheet-enemies-default.xml'
        );

        // ── Audio (archivos opcionales) ───────────────────────
        // Si no existen, AudioManager usa síntesis por defecto.
        // Agrega los archivos a public/assets/audio/ y se cargarán automáticamente.
        const sfxKeys = ['jump', 'coin', 'hit', 'shoot', 'explode', 'level', 'pause'];

        sfxKeys.forEach(key => {
            // Intentamos .ogg primero (mejor compresión en web)
            // Phaser carga el primer formato que el navegador soporte
            this.load.audio(key, [
                `assets/audio/${key}.ogg`,
                `assets/audio/${key}.mp3`
            ]);
        });

        // Música de fondo (loop largo)
        this.load.audio('bgm', [
            'assets/audio/bgm.ogg',
            'assets/audio/bgm.mp3'
        ]);

        // Suprime errores de archivos de audio faltantes
        this.load.on('loaderror', (file) => {
            if (file.type === 'audio') {
                // Silencioso: AudioManager hará fallback sintético
                console.info(`[Audio] "${file.key}" no encontrado → fallback sintético`);
            }
        });
    }

    create() {
        this.scene.start('MenuScene');
    }
}
