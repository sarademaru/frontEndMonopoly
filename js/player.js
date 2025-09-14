 export default class Jugador {
    constructor(nombre, dineroInicial = 1500) {
        this.nombre = nombre;
        this.dinero = dineroInicial;
        this.posicion = 0;
        this.propiedades = [];
        this.enCarcel = false;
        this.turnosEnCarcel = 0;
        
    }

    mover(casillas, totalCasillas = 40) {
        this.posicion = (this.posicion + casillas) % totalCasillas;
    }

    pagar(cantidad) {
        this.dinero -= cantidad;
    }

    recibir(cantidad) {
        this.dinero += cantidad;
    }

    comprarPropiedad(propiedad) {
        if (this.dinero >= propiedad.precio) {
            this.dinero -= propiedad.precio;
            this.propiedades.push(propiedad);
            propiedad.dueno = this;
            return true;
        }
        return false;
    }
}

// Exportar la clase para su uso en otros archivos
if (typeof module !== 'undefined') {
    module.exports = Jugador;
}
