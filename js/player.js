export default class Jugador {
  constructor(nombre, dineroInicial = 1500, token = "🔴") {
    this.nombre = nombre;
    this.dinero = dineroInicial;
    this.posicion = 0;
    this.propiedades = [];
    this.enCarcel = false;
    this.turnosEnCarcel = 0;
    this.token = token; // <-- nuevo campo
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
  // Soporta "precio" y "price"
  const precio = propiedad.precio ?? propiedad.price;

  if (this.dinero >= precio) {
    this.dinero -= precio;
    this.propiedades.push(propiedad);
    propiedad.owner = this; // puedes guardar referencia al jugador
    return true;
  }
  return false;
}

}

// Exportar la clase para su uso en otros archivos
if (typeof module !== 'undefined') {
    module.exports = Jugador;
}
