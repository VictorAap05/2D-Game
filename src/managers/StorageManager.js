/**
 * StorageManager
 * Gestiona la persistencia de datos en localStorage:
 *   - High score
 *   - Nivel alcanzado
 *   - Configuración de audio (mute)
 */
export default class StorageManager {

    static KEYS = {
        HIGH_SCORE:    'platformer_highscore',
        LEVEL_REACHED: 'platformer_level',
        MUTED:         'platformer_muted'
    };

    // ─── HIGH SCORE ───────────────────────────────────────────
    static getHighScore() {
        return parseInt(localStorage.getItem(this.KEYS.HIGH_SCORE) ?? '0', 10);
    }

    static saveHighScore(score) {
        const current = this.getHighScore();
        if (score > current) {
            localStorage.setItem(this.KEYS.HIGH_SCORE, String(score));
            return true; // nuevo récord
        }
        return false;
    }

    // ─── NIVEL ALCANZADO ──────────────────────────────────────
    static getLevelReached() {
        return parseInt(localStorage.getItem(this.KEYS.LEVEL_REACHED) ?? '1', 10);
    }

    static saveLevelReached(level) {
        const current = this.getLevelReached();
        if (level > current) {
            localStorage.setItem(this.KEYS.LEVEL_REACHED, String(level));
        }
    }

    // ─── AUDIO ────────────────────────────────────────────────
    static isMuted() {
        return localStorage.getItem(this.KEYS.MUTED) === 'true';
    }

    static saveMuted(muted) {
        localStorage.setItem(this.KEYS.MUTED, String(muted));
    }

    // ─── UTILIDADES ───────────────────────────────────────────
    static reset() {
        Object.values(this.KEYS).forEach(k => localStorage.removeItem(k));
    }
}
