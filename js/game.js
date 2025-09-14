// Clase Juego
class Juego {
    constructor(jugadores, propiedades, totalCasillas = 40) {
        this.jugadores = jugadores;
        this.propiedades = propiedades;
        this.turnoActual = 0;
        this.totalCasillas = totalCasillas;
        this.terminado = false;
    }

    getJugadorActual() {
        return this.jugadores[this.turnoActual];
    }

    siguienteTurno() {
        this.turnoActual = (this.turnoActual + 1) % this.jugadores.length;
    }

    moverJugadorActual(casillas) {
        const jugador = this.getJugadorActual();
        jugador.mover(casillas, this.totalCasillas);
        // Aquí se puede agregar lógica para acciones tras caer en una casilla
    }

    comprarPropiedadActual() {
        const jugador = this.getJugadorActual();
        const propiedad = this.propiedades[jugador.posicion];
        if (propiedad && !propiedad.dueno) {
            return jugador.comprarPropiedad(propiedad);
        }
        return false;
    }
    // Tirada de dados aleatoria
    tirarDadosAleatorio() {
        const dado1 = Math.floor(Math.random() * 6) + 1;
        const dado2 = Math.floor(Math.random() * 6) + 1;
        return {
            dado1,
            dado2,
            suma: dado1 + dado2
        };
    }

    // Tirada de dados manual (para pruebas o modo debug)
    tirarDadosManual(dado1, dado2) {
        // Validar que los dados estén en el rango 1-6
        if (
            Number.isInteger(dado1) && Number.isInteger(dado2) &&
            dado1 >= 1 && dado1 <= 6 &&
            dado2 >= 1 && dado2 <= 6
        ) {
            return {
                dado1,
                dado2,
                suma: dado1 + dado2
            };
        } else {
            throw new Error('Los valores de los dados deben estar entre 1 y 6.');
        }
    }
}

// Exportar la clase para su uso en otros archivos
if (typeof module !== 'undefined') {
    module.exports = Juego;
}
