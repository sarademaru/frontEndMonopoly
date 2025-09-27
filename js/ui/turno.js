import { mostrarAccionCarcel } from "./paneles.js";

export function actualizarTurno(game) {
  const jugador = game.getJugadorActual();
  const turnoDiv = document.getElementById("turno-actual");
  turnoDiv.textContent = `🎲 Turno de: ${jugador.nombre} ${jugador.token}`;

  // Limpiar acciones de turno anterior
  const accionesDiv = document.querySelector(".acciones-botones");
  if (accionesDiv) {
    accionesDiv.innerHTML = "";
  }

  //Si este jugador está en la cárcel, mostrar botón de pagar
  if (jugador.enCarcel) {
    mostrarAccionCarcel(jugador, game);
  }
}

