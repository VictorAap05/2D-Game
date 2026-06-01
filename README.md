# 🎮 Aventura Plataforma 2D

Un emocionante juego de plataformas en 2D desarrollado enteramente con **Phaser 3** y **JavaScript moderno (ES6)**. Esquiva trampas, usa impulsores, destruye enemigos y recolecta monedas en tu carrera contrarreloj hacia la meta.

## ✨ Características Principales

- **Arquitectura Orientada a Objetos:** Escenas modulares usando herencia (`BaseScene`) y sistemas independientes (Managers para HUD, Enemigos, Audio y Proyectiles).
- **Múltiples Niveles:** Diseño de mapas escalables creados mediante JSON (exportables desde Tiled).
- **Controles Híbridos:** - Soporte completo para teclado en escritorio (WASD / Flechas / Espacio).
  - Interfaz táctil ergonómica y responsiva con botones circulares para dispositivos móviles.
- **Físicas Avanzadas:** Plataformas flotantes, bombas con radio de explosión, pinchos y resortes propulsores (`boosters`).
- **Persistencia de Datos:** Guardado automático de nivel máximo alcanzado y puntuación más alta (`High Score`) usando `localStorage`.

## 🛠️ Tecnologías Utilizadas

- [Phaser 3](https://phaser.io/) - Motor de físicas y renderizado del juego.
- [Vite](https://vitejs.dev/) - Empaquetador web ultrarrápido para el entorno de desarrollo.
- **JavaScript (ES6)** - Lógica del juego estructurada en módulos.

## 🕹️ Controles

| Acción | Teclado (PC) | Táctil (Móvil) |
| :--- | :--- | :--- |
| **Mover Izquierda** | `Flecha Izquierda` o `A` | Botón ◀ (Inferior Izquierdo) |
| **Mover Derecha** | `Flecha Derecha` o `D` | Botón ▶ (Inferior Izquierdo) |
| **Saltar** | `Flecha Arriba` o `W` | Botón ▲ (Inferior Derecho) |
| **Disparar** | `Barra Espaciadora` | Botón 🔥 (Inferior Derecho) |
| **Pausa** | `ESC` | Botón ⏸ (Centro Arriba) |

## 🚀 Cómo Ejecutar el Juego
1. Clona este repositorio:
   ```bash
   git clone https://github.com/VictorAap05/2D-Game

    cd 2D-Game
    ```
2. Instala las dependencias:    
   ```bash
   npm install
   ```
3. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```
4. Abre tu navegador y navega a `http://localhost:5173` para jugar.

## 🎨 Diseño de Niveles
Los niveles están diseñados usando **Tiled Map Editor** y exportados como archivos JSON. Cada mapa define la disposición de plataformas, enemigos, trampas y objetos interactivos. Puedes crear tus propios niveles editando los archivos JSON o usando Tiled para un diseño visual más intuitivo.
