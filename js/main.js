// Función para inicializar fichas en la posición inicial (casilla 0)
function inicializarFichas(jugadores) {
    jugadores.forEach(jugador => {
        const ficha = document.getElementById(`ficha-${jugador.nombre}`);
        const casillaInicial = document.getElementById('casilla-0');
        casillaInicial.appendChild(ficha);
    });
}

// Función para mover la ficha de un jugador a su nueva posición
function moverFicha(jugador) {
    const ficha = document.getElementById(`ficha-${jugador.nombre}`);
    const nuevaCasilla = document.getElementById(`casilla-${jugador.posicion}`);
    if (ficha && nuevaCasilla) {
        nuevaCasilla.appendChild(ficha);
    }
}