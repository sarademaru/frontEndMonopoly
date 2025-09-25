// Clase Propiedad
// Nota: no se requiere importar nada aquí
export default class Propiedad {
    constructor(nombre, precio, alquiler) {
        this.nombre = nombre;
        this.precio = precio;
        this.alquiler = alquiler;
        this.dueno = null;
    }
}
// Si necesitas utilidades relacionadas con propiedades, impórtalas donde se usen.