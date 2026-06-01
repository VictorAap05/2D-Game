import StorageManager from './StorageManager.js';

/**
 * AudioManager — v2
 * Centraliza música de fondo, efectos de sonido y control de mute.
 *
 * Mejoras respecto a v1:
 *  - Soporte real de archivos .ogg/.mp3 (cargados en PreloadScene)
 *  - Fallback sintético mejorado si los archivos no existen
 *  - Fix para iOS/Android: el AudioContext se reanuda en el primer
 *    gesto del usuario (requisito de autoplay policy)
 *  - Un solo AudioContext reutilizable para todos los SFX (evita
 *    crear/destruir miles de contextos)
 *  - Volumen configurable por tipo
 */
export default class AudioManager {

    constructor(scene) {
        this.scene  = scene;
        this.muted  = StorageManager.isMuted();
        this._music = null;

        // ─── Contexto Web Audio compartido ───────────────────
        // Un solo contexto para toda la vida del manager
        this._ctx       = null;
        this._gainMaster = null;
        this._initCtx();

        // Fix mobile: reanudar contexto en primer gesto
        this._resumeOnGesture();
    }

    // ═══════════════════════════════════════════════════════════
    // INIT WEB AUDIO
    // ═══════════════════════════════════════════════════════════

    _initCtx() {
        try {
            this._ctx        = new (window.AudioContext || window.webkitAudioContext)();
            this._gainMaster = this._ctx.createGain();
            this._gainMaster.gain.setValueAtTime(this.muted ? 0 : 1, this._ctx.currentTime);
            this._gainMaster.connect(this._ctx.destination);
        } catch (e) {
            this._ctx = null;
        }
    }

    /**
     * iOS y Android bloquean el AudioContext hasta que el usuario
     * interactúa. Este handler lo reanuda en el primer toque/clic.
     */
    _resumeOnGesture() {
        const resume = () => {
            if (this._ctx && this._ctx.state === 'suspended') {
                this._ctx.resume().catch(() => {});
            }
            // También reanuda el sistema de audio de Phaser
            if (this.scene.sound.context?.state === 'suspended') {
                this.scene.sound.context.resume().catch(() => {});
            }
            window.removeEventListener('touchstart', resume, true);
            window.removeEventListener('touchend',   resume, true);
            window.removeEventListener('click',      resume, true);
            window.removeEventListener('keydown',    resume, true);
        };

        window.addEventListener('touchstart', resume, { once: true, capture: true });
        window.addEventListener('touchend',   resume, { once: true, capture: true });
        window.addEventListener('click',      resume, { once: true, capture: true });
        window.addEventListener('keydown',    resume, { once: true, capture: true });
    }

    // ═══════════════════════════════════════════════════════════
    // MÚSICA DE FONDO
    // ═══════════════════════════════════════════════════════════

    /**
     * Reproduce música de fondo.
     * Si Phaser tiene el key cargado, lo usa; sino usa oscilador sintético.
     * @param {string} key - key del audio registrado en PreloadScene ('bgm')
     */
    playMusic(key = 'bgm') {
        this._stopMusic();

        if (this.scene.cache.audio.has(key)) {
            this._music = this.scene.sound.add(key, {
                loop:   true,
                volume: this.muted ? 0 : 0.35
            });
            this._music.play();
        } else {
            this._startSyntheticMusic();
        }
    }

    _stopMusic() {
        if (this._music) {
            try { this._music.stop(); } catch (_) {}
            this._music.destroy();
            this._music = null;
        }
        this._stopSyntheticMusic();
    }

    // ─── Música sintética (placeholder si no hay .ogg/.mp3) ──

    _startSyntheticMusic() {
        if (this.muted || !this._ctx) return;

        // Escala pentatónica en Do (Da un sabor más "aventurero")
        const notes   = [261.63, 293.66, 329.63, 392.00, 440.00, 392.00, 329.63, 293.66];
        let   noteIdx = 0;

        const playNote = () => {
            if (!this._ctx || this.muted) return;

            const gainNote = this._ctx.createGain();
            gainNote.gain.setValueAtTime(0.04, this._ctx.currentTime);
            gainNote.gain.exponentialRampToValueAtTime(0.001, this._ctx.currentTime + 0.42);
            gainNote.connect(this._gainMaster);

            const osc      = this._ctx.createOscillator();
            osc.type       = 'triangle';
            osc.frequency.setValueAtTime(notes[noteIdx % notes.length], this._ctx.currentTime);
            osc.connect(gainNote);
            osc.start();
            osc.stop(this._ctx.currentTime + 0.45);

            noteIdx++;
            this._musicTimer = this.scene.time.delayedCall(480, playNote);
        };

        playNote();
    }

    _stopSyntheticMusic() {
        if (this._musicTimer) {
            this._musicTimer.remove(false);
            this._musicTimer = null;
        }
    }

    // ═══════════════════════════════════════════════════════════
    // EFECTOS DE SONIDO
    // ═══════════════════════════════════════════════════════════

    /**
     * Reproduce un SFX. Si existe en Phaser lo usa; sino genera pitido.
     * @param {string} key - 'jump' | 'coin' | 'hit' | 'shoot' | 'explode' | 'level'
     */
    playSfx(key) {
        if (this.muted) return;

        // Intentar con Phaser (archivo .ogg/.mp3 real)
        if (this.scene.cache.audio.has(key)) {
            this.scene.sound.play(key, { volume: 0.55 });
            return;
        }

        // Fallback sintético
        this._playSyntheticSfx(key);
    }

    _playSyntheticSfx(key) {
        if (!this._ctx) return;

        const presets = {
            jump:    { freq: 420,  type: 'sine',     dur: 0.13, slide:  1.6  },
            coin:    { freq: 900,  type: 'sine',     dur: 0.18, slide:  1.2  },
            hit:     { freq: 160,  type: 'sawtooth', dur: 0.22, slide:  0.4  },
            shoot:   { freq: 700,  type: 'square',   dur: 0.07, slide:  0.8  },
            explode: { freq: 80,   type: 'sawtooth', dur: 0.40, slide:  0.3  },
            level:   { freq: 523,  type: 'sine',     dur: 0.55, slide:  1.5  },
            pause:   { freq: 350,  type: 'sine',     dur: 0.10, slide:  0.85 }
        };

        const p = presets[key] ?? { freq: 440, type: 'sine', dur: 0.15, slide: 1 };

        try {
            const gain = this._ctx.createGain();
            gain.gain.setValueAtTime(0.25, this._ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this._ctx.currentTime + p.dur);
            gain.connect(this._gainMaster);

            const osc = this._ctx.createOscillator();
            osc.type  = p.type;
            osc.frequency.setValueAtTime(p.freq, this._ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(
                p.freq * p.slide,
                this._ctx.currentTime + p.dur
            );
            osc.connect(gain);
            osc.start();
            osc.stop(this._ctx.currentTime + p.dur);
        } catch (_) {}
    }

    // ═══════════════════════════════════════════════════════════
    // MUTE / UNMUTE
    // ═══════════════════════════════════════════════════════════

    toggleMute() {
        this.muted = !this.muted;
        StorageManager.saveMuted(this.muted);

        // Control de volumen en Phaser
        if (this._music) {
            this._music.setVolume(this.muted ? 0 : 0.35);
        }

        // Control de volumen en Web Audio (SFX sintéticos + música sintética)
        if (this._gainMaster && this._ctx) {
            this._gainMaster.gain.setTargetAtTime(
                this.muted ? 0 : 1,
                this._ctx.currentTime,
                0.05
            );
        }

        // Si desmutamos y la música sintética estaba parada, reanudarla
        if (!this.muted && !this._music && !this._musicTimer) {
            this._startSyntheticMusic();
        }

        return this.muted;
    }

    isMuted() { return this.muted; }

    // ═══════════════════════════════════════════════════════════
    // LIMPIEZA
    // ═══════════════════════════════════════════════════════════

    destroy() {
        this._stopMusic();
        try { this._ctx?.close(); } catch (_) {}
        this._ctx = null;
    }
}
