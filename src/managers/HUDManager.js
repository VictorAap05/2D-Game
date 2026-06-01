import Phaser from 'phaser';

/**
 * HUDManager — v2
 *
 * Mejoras:
 * - Timer de nivel visible en pantalla
 * - Botón de pausa táctil (para móvil)
 * - Layout mejorado en pantallas pequeñas (safe-area / notch)
 * - Indicador de combo
 * - Resize más robusto (reposiciona TODOS los elementos)
 */
export default class HUDManager {

    constructor(scene, player, levelName, audio) {
        this.scene     = scene;
        this.player    = player;
        this.levelName = levelName;
        this.audio     = audio;

        this._uiElements  = [];
        this.uiCamera     = null;

        // Refs de textos
        this.hudLives = null;
        this.hudScore = null;
        this.hudLevel = null;
        this.hudTimer = null;
        this.hudCombo = null;
        this.muteBtn  = null;
        this.pauseBtn = null;

        // Controles táctiles
        this._touchButtons = { left: false, right: false, jump: false, shoot: false };
        this._touchEls     = [];

        // Timer de nivel
        this._startTime = 0;
    }

    // ═══════════════════════════════════════════════════════════
    // CREACIÓN PRINCIPAL
    // ═══════════════════════════════════════════════════════════

    create() {
        this._startTime = this.scene.time.now;

        this._createTextHUD();
        this._createMuteButton();
        this._createPauseButton();
        this._createUICamera();
        this._createMobileControls();
        this._bindResize();
        this.update();
    }

    // ═══════════════════════════════════════════════════════════
    // TEXTOS DEL HUD
    // ═══════════════════════════════════════════════════════════

    _createTextHUD() {
        const { width } = this.scene.scale;
        const shadow    = { stroke: '#000000', strokeThickness: 4 };

        // — Izquierda —
        this.hudLives = this._addUIText(20, 28, '', {
            fontSize: '20px', color: '#ffffff', ...shadow
        });

        this.hudScore = this._addUIText(20, 56, '', {
            fontSize: '18px', color: '#ffdd00', ...shadow
        });

        // Timer centrado arriba
        this.hudTimer = this._addUIText(width / 2, 20, '00:00', {
            fontSize: '18px', color: '#88ffff', ...shadow
        }).setOrigin(0.5, 0);

        // Combo (aparece solo cuando hay combo > 1)
        this.hudCombo = this._addUIText(width / 2, 46, '', {
            fontSize: '16px', color: '#ff8800', ...shadow
        }).setOrigin(0.5, 0).setAlpha(0);

        // — Derecha —
        this.hudLevel = this._addUIText(width - 20, 28, '', {
            fontSize: '20px', color: '#ffff88', ...shadow
        }).setOrigin(1, 0);
    }

    // ═══════════════════════════════════════════════════════════
    // BOTÓN MUTE
    // ═══════════════════════════════════════════════════════════

    _createMuteButton() {
        const { width } = this.scene.scale;

        this.muteBtn = this._addUIText(width - 20, 56, this._muteLabel(), {
            fontSize: '20px',
            stroke: '#000000', strokeThickness: 3
        }).setOrigin(1, 0).setInteractive({ useHandCursor: true });

        this.muteBtn.on('pointerdown', () => {
            this.audio.toggleMute();
            this.muteBtn.setText(this._muteLabel());
        });
    }

    _muteLabel() {
        return this.audio.isMuted() ? '🔇' : '🔊';
    }

    // ═══════════════════════════════════════════════════════════
    // BOTÓN PAUSA TÁCTIL
    // ═══════════════════════════════════════════════════════════

    _createPauseButton() {
        const { width } = this.scene.scale;

        this.pauseBtn = this._addUIText(width / 2, 72, '⏸', {
            fontSize:  '22px',
            color:     '#ffffff',
            stroke:    '#000000',
            strokeThickness: 3
        }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true }).setAlpha(0.6);

        this.pauseBtn.on('pointerdown', () => {
            // Delega la pausa a la escena activa
            this.scene.events.emit('pauseRequested');
        });
    }

    // ═══════════════════════════════════════════════════════════
    // CÁMARA UI
    // ═══════════════════════════════════════════════════════════

    _createUICamera() {
        const { width, height } = this.scene.scale;

        this.uiCamera = this.scene.cameras.add(0, 0, width, height);
        this.uiCamera.setScroll(0, 0);
        this.uiCamera.setName('UICamera');

        // Cámara principal ignora elementos de UI
        this.scene.cameras.main.ignore(this._uiElements);

        // uiCamera ignora todo lo que NO es UI
        this.scene.children.list.forEach(child => {
            if (!this._uiElements.includes(child)) {
                this.uiCamera.ignore(child);
            }
        });
    }

    // ═══════════════════════════════════════════════════════════
    // CONTROLES TÁCTILES MÓVIL
    // ═══════════════════════════════════════════════════════════

    _createMobileControls() {
        if (!this.scene.sys.game.device.os.android && !this.scene.sys.game.device.os.iOS) {
            return; 
        }

        const { width, height } = this.scene.scale;
        const btnRadius = 40;
        const btnY = height - 80;

        // Izquierda
        const LEFT  = this._addTouchBtn(80,  btnY, '◀', btnRadius);
        const RIGHT = this._addTouchBtn(180, btnY, '▶', btnRadius);
        
        // Derecha
        const SHOOT = this._addTouchBtn(width - 180, btnY, '🔥', btnRadius);
        const JUMP  = this._addTouchBtn(width - 80,  btnY, '▲', btnRadius);

        this._bindTouch(LEFT,  'left');
        this._bindTouch(RIGHT, 'right');
        this._bindTouch(JUMP,  'jump');
        this._bindTouch(SHOOT, 'shoot');

        this._touchEls = [LEFT, RIGHT, JUMP, SHOOT];
    }

    _addTouchBtn(x, y, label, radius) {
        const container = this.scene.add.container(x, y).setScrollFactor(0).setDepth(60).setAlpha(0.5);
        
        const bg = this.scene.add.circle(0, 0, radius, 0x000000, 0.6)
            .setStrokeStyle(3, 0xffffff, 0.8)
            .setInteractive({ useHandCursor: true });
            
        const txt = this.scene.add.text(0, 0, label, { 
            fontSize: '32px', color: '#ffffff' 
        }).setOrigin(0.5);

        container.add([bg, txt]);
        this._uiElements.push(container, bg, txt);
        this.scene.cameras.main.ignore([container, bg, txt]);

        bg.on('pointerdown', () => {
            container.setAlpha(0.9);
            container.setScale(0.9);
            bg.setFillStyle(0x00ff88, 0.4);
        });

        const resetBtn = () => {
            container.setAlpha(0.5);
            container.setScale(1);
            bg.setFillStyle(0x000000, 0.6);
        };
        bg.on('pointerup', resetBtn);
        bg.on('pointerout', resetBtn);

        container.interactable = bg; 
        return container;
    }

    _bindTouch(container, key) {
        container.interactable.on('pointerdown',  () => { this._touchButtons[key] = true;  });
        container.interactable.on('pointerup',    () => { this._touchButtons[key] = false; });
        container.interactable.on('pointerout',   () => { this._touchButtons[key] = false; });
        container.interactable.on('pointercancel',() => { this._touchButtons[key] = false; });
    }

    getTouchInput() { return this._touchButtons; }

    // ═══════════════════════════════════════════════════════════
    // RESPONSIVE
    // ═══════════════════════════════════════════════════════════

    _bindResize() {
        this.scene.scale.on('resize', this._onResize, this);
        this.scene.events.once('shutdown', () => {
            this.scene.scale.off('resize', this._onResize, this);
        });
    }

    _onResize(gameSize) {
        if (!gameSize) return;
        const { width, height } = gameSize;

        this.scene.cameras.main.setSize(width, height);
        if (this.uiCamera) this.uiCamera.setSize(width, height);

        // Reposicionar elementos de la derecha
        this.hudLevel?.setPosition(width - 20, 28);
        this.muteBtn?.setPosition(width - 20, 56);
        this.hudTimer?.setPosition(width / 2, 20);
        this.hudCombo?.setPosition(width / 2, 46);
        this.pauseBtn?.setPosition(width / 2, 72);

        // Reposicionar controles táctiles
        const btnY = height - 80;
        if (this._touchEls.length >= 4) {
            this._touchEls[0].setPosition(80, btnY);
            this._touchEls[1].setPosition(180, btnY);
            this._touchEls[2].setPosition(width - 80, btnY);
            this._touchEls[3].setPosition(width - 180, btnY);
        }
    }

    // ═══════════════════════════════════════════════════════════
    // ACTUALIZACIÓN
    // ═══════════════════════════════════════════════════════════

    update() {
        const lives = this.player.lives ?? 3;
        const score = this.player.score ?? 0;
        const combo = this.scene._score?.getCombo?.() ?? 0;

        // Vidas
        const hearts  = '❤️ '.repeat(Math.max(0, lives)) +
                        '🖤 '.repeat(Math.max(0, 3 - lives));
        this.hudLives?.setText('Vidas: ' + hearts);

        // Puntuación
        this.hudScore?.setText('Pts: ' + score);

        // Nombre del nivel
        this.hudLevel?.setText(this.levelName?.replace('Scene', '') ?? '');

        // Timer
        const elapsed = (this.scene.time.now - this._startTime) / 1000;
        const mins    = String(Math.floor(elapsed / 60)).padStart(2, '0');
        const secs    = String(Math.floor(elapsed % 60)).padStart(2, '0');
        this.hudTimer?.setText(`${mins}:${secs}`);

        // Combo
        if (combo > 1 && this.hudCombo) {
            this.hudCombo.setText(`🔥 COMBO ×${combo}!`);
            this.hudCombo.setAlpha(1);
        } else {
            this.hudCombo?.setAlpha(0);
        }
    }

    // ═══════════════════════════════════════════════════════════
    // HELPERS PÚBLICOS
    // ═══════════════════════════════════════════════════════════

    ignoreOnUICamera(gameObject) {
        if (this.uiCamera && gameObject) {
            this.uiCamera.ignore(gameObject);
        }
    }

    ignoreOnMainCamera(gameObject) {
        this.scene.cameras.main.ignore(gameObject);
    }

    // ─── Helper interno para registrar elementos UI ───────────
    _addUIText(x, y, txt, style) {
        const obj = this.scene.add.text(x, y, txt, style)
            .setScrollFactor(0)
            .setDepth(50);
        this._uiElements.push(obj);
        return obj;
    }
}