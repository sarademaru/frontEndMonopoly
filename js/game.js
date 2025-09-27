// ============================
// Clase Juego 
// ============================
export default class Juego {
    constructor(jugadores, propiedades, totalCasillas = 40) {
        this.jugadores = jugadores;
        this.propiedades = propiedades;
        this.turnoActual = 0;
        this.totalCasillas = totalCasillas;
        this.terminado = false;

        // Estado de los dados
        this.dice = { dice1: 0, dice2: 0 };
        this.doublesCount = 0;
    }

    // ----------------------------
    // Métodos básicos del juego
    // ----------------------------

    getJugadorActual() {
        return this.jugadores[this.turnoActual];
    }

    siguienteTurno() {
        this.turnoActual = (this.turnoActual + 1) % this.jugadores.length;
    }

    moverJugadorActual(pasos) {
    const jugador = this.getJugadorActual();
    let nuevaPosicion = jugador.posicion + pasos;

    // Si pasa por la salida cobra $200
    if (nuevaPosicion >= this.totalCasillas) {
        nuevaPosicion = nuevaPosicion % this.totalCasillas;
        jugador.dinero += 200;
        document.getElementById("resultado").textContent =
        `${jugador.nombre} pasó por la salida y recibe $200 🎉`

        // Mostrar en novedades
        if (typeof window.agregarNovedad === "function") {
            window.agregarNovedad(`${jugador.nombre} pasó por la salida y recibe $200 🎉`);
        }

        // Refrescar paneles
        if (typeof window.dibujarPanelJugadores === "function") {
            window.dibujarPanelJugadores(this.jugadores);
        }
        if (typeof window.dibujarMiniPaneles === "function") {
            window.dibujarMiniPaneles(this.jugadores);
        }
    }

    jugador.posicion = nuevaPosicion;
    }

    comprarPropiedadActual() {
        const jugador = this.getJugadorActual();
        const propiedad = this.propiedades[jugador.posicion];

        if (propiedad && !propiedad.dueno) {
            return jugador.comprarPropiedad(propiedad);
        }
        return false;
    }

    // ----------------------------
    // Lanzamiento de dados
    // ----------------------------

    /**
     * Tirada aleatoria de dados
     */
    tirarDadosAleatorio() {
        const dado1 = Math.floor(Math.random() * 6) + 1;
        const dado2 = Math.floor(Math.random() * 6) + 1;

        return { dado1, dado2, suma: dado1 + dado2 };
    }

    /**
     * Tirada manual de dados (para debug o pruebas)
     */
    tirarDadosManual(dado1, dado2) {
        if (
            Number.isInteger(dado1) && Number.isInteger(dado2) &&
            dado1 >= 1 && dado1 <= 6 &&
            dado2 >= 1 && dado2 <= 6
        ) {
            return { dado1, dado2, suma: dado1 + dado2 };
        } else {
            throw new Error("Los valores de los dados deben estar entre 1 y 6.");
        }
    }
    /**
     * Lanza los dados con control de dobles
     */
    rollDice() {
        this.dice.dice1 = Math.floor(Math.random() * 6) + 1;
        this.dice.dice2 = Math.floor(Math.random() * 6) + 1;

        const isDouble = this.dice.dice1 === this.dice.dice2;
        if (isDouble) {
            this.doublesCount++;
        } else {
            this.doublesCount = 0;
        }

        return {
            dice1: this.dice.dice1,
            dice2: this.dice.dice2,
            total: this.dice.dice1 + this.dice.dice2,
            isDouble,
            doublesCount: this.doublesCount
        };
    }
}
