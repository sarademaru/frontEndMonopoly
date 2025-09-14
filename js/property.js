// Clase Propiedad
class Propiedad {
    constructor(nombre, precio, alquiler) {
        this.nombre = nombre;
        this.precio = precio;
        this.alquiler = alquiler;
        this.dueno = null;
    }

    cobrarAlquiler(jugador) {
        if (this.dueno && this.dueno !== jugador) {
            jugador.pagar(this.alquiler);
            this.dueno.recibir(this.alquiler);
        }
    }
}

// Exportar la clase para su uso en otros archivos
if (typeof module !== 'undefined') {
    module.exports = Propiedad;
}
