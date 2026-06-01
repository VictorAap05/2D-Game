import BaseScene from './BaseScene';

export default class Level2Scene extends BaseScene {

    constructor() {
        super('Level2Scene');
        this.mapKey    = 'map2';
        this.levelName = 'Level2Scene';
        this.levelNum  = 2; 
        this.nextLevel = 'MenuScene';   
        this.spawnX    = 100;
        this.spawnY    = 300;
    }

    create() {
        // 1. Creamos el fondo espacial PRIMERO para que quede detrás de todo
        this.createBackground2();

        // 2. Llamamos al padre (carga el mapa, HUD, enemigos, balas, etc.)
        super.create();
        
        // 3. Animación de entrada
        this.cameras.main.fadeIn(500, 0, 0, 0);
    }

    update() {
        // Ejecuta toda la lógica del juego (movimiento, enemigos, etc.)
        super.update();

        // ─── TRUCO ANTI-ZOOM PARA EL FONDO ───
        if (this.bg) {
            const currentZoom = this.cameras.main.zoom;
            
            // Aumentamos el tamaño de la imagen inversamente al zoom de la cámara
            // Esto anula el efecto de alejamiento haciendo que se vea perfectamente estático.
            this.bg.setDisplaySize(
                this.scale.width / currentZoom, 
                this.scale.height / currentZoom
            );
        }
    }
}