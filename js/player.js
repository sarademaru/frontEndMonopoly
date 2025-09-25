export default class Jugador {
  constructor(nombre, dineroInicial = 1500, token = "🔴") {
    this.nombre = nombre;
    this.dinero = dineroInicial;
    this.posicion = 0;
    this.propiedades = [];
    this.enCarcel = false;
    this.turnosEnCarcel = 0;
    this.token = token; // <-- nuevo campo
    this.hipotecas = [];
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

    if (this.dinero >= precio && !propiedad.owner) {
      this.dinero -= precio;
      this.propiedades.push(propiedad);
      propiedad.owner = this.nombre; // puedes guardar referencia al jugador
      return true;
    }
    return false;
  }

  hipotecarPropiedad(propiedad) {
  console.log("hipotecarPropiedad llamado ->", propiedad?.id, propiedad?.name, "mortgage(raw):", propiedad?.mortgage);
  const mort = Number(propiedad?.mortgage ?? propiedad?.mortgage ?? 0);
  console.log("mort coerced:", mort);
  console.log("owner:", propiedad.owner, "jugador.nombre:", this.nombre, "hipotecada?", propiedad.hipotecada);
  if (propiedad.owner !== this.nombre || propiedad.hipotecada) return false;
  this.dinero += propiedad.mortgage;
  propiedad.hipotecada = true;
  this.hipotecas.push(propiedad);
  return true;
}

deshipotecarPropiedad(propiedad) {
  if (propiedad.owner !== this.nombre || !propiedad.hipotecada) return false;
  const costo = Math.ceil(propiedad.mortgage * 1.1);
  if (this.dinero >= costo) {
    this.dinero -= costo;
    propiedad.hipotecada = false;
    this.hipotecas = this.hipotecas.filter(p => p.id !== propiedad.id);
    return true;
  }
  return false;
}


}

// Exportar la clase para su uso en otros archivos
if (typeof module !== 'undefined') {
  module.exports = Jugador;
}
