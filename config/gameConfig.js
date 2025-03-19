export const GAME_CONFIG = {
    // Dimensiones del juego
    DEFAULT_WIDTH: 10,
    DEFAULT_HEIGHT: 20,
    DEFAULT_BLOCK_SIZE: 30,

    // Configuración de niveles
    POINTS_BASE: 1000,        // Puntos base para el primer nivel
    POINTS_MULTIPLIER: 1.5,   // Multiplicador de puntos por nivel
    MAX_LEVEL: 15,           // Nivel máximo alcanzable

    // Configuración de velocidad
    INITIAL_SPEED: 500,       // Velocidad inicial (ms)
    SPEED_MULTIPLIER: 0.90,   // Reducción de tiempo por nivel (más rápido)
    SPEED_MIN: 50,           // Velocidad máxima (tiempo mínimo entre caídas)

    // Sistema de puntuación
    TICK_POINTS: 10,         // Puntos por cada tick del juego
    LINE_POINTS: {           // Puntos por líneas eliminadas
        1: 200,             // Una línea
        2: 1000,             // Dos líneas simultáneas
        3: 2500,             // Tres líneas simultáneas
        4: 5000            // Cuatro líneas simultáneas
    },

    // Mecánica de juego
    GRAVITY_SWITCH: {
        MIN_PIECES: 8,    // Mínimo de piezas antes del cambio
        MAX_PIECES: 18     // Máximo de piezas antes del cambio
    }
}; 