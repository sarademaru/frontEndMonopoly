export function actualizarTurno(game) {
  const jugador = game.getJugadorActual();
  const turnoDiv = document.getElementById("turno-actual");
  turnoDiv.textContent = `🎲 Turno de: ${jugador.nombre} ${jugador.token}`;
}
