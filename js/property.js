// Clase Propiedad
// Nota: no se requiere importar nada aquí
export default class Propiedad {
    constructor(nombre, precio, alquiler) {
        this.nombre = nombre;
        this.precio = precio;
        this.alquiler = alquiler;
        this.dueno = null;

        this.houses = 0;        // Número de casas
        this.hotel = false;     // true si tiene hotel
        this.hipotecada = false; // true si está hipotecada
    }
}
// Si necesitas utilidades relacionadas con propiedades, impórtalas donde se usen.