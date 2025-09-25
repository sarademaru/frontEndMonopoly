// Clase Propiedad
import { agregarNovedad } from "./utilities.js";
class Propiedad {
    constructor(nombre, precio, alquiler) {
        this.nombre = nombre;
        this.precio = precio;
        this.alquiler = alquiler;
        this.dueno = null;
    }
}