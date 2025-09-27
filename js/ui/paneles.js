export function actualizarPanelJugadores(jugadores) {
  if (!Array.isArray(jugadores)) return;
  jugadores.forEach(j => {
    const div = document.getElementById(`panel-${j.nombre}`);
    if (!div) return;

    // Dinero
    const dineroEl = div.querySelector(".dinero");
    dineroEl.textContent = `$${j.dinero}`;
    dineroEl.classList.toggle("negativo", j.dinero < 0); // se pone rojo si está en negativo

    // Propiedades
    div.querySelector(".propiedades").textContent = j.propiedades.length;

    // Hipotecas
    if (div.querySelector(".hipotecas")) {
      div.querySelector(".hipotecas").textContent = j.hipotecas?.length || 0;
    }
  });
}

export function actualizarMiniPaneles(jugadores) {
  if (!Array.isArray(jugadores)) return;
  jugadores.forEach((j) => {
    const div = document.getElementById(`panel-mini-${j.nombre.replace(/\s+/g, "_")}`);
    if (!div) return;

    div.querySelector(".dinero").textContent = `$${j.dinero}`;
    div.querySelector(".propiedades").textContent = j.propiedades?.length || 0;
    div.querySelector(".hipotecas").textContent = j.hipotecas?.length || 0;
  });
}

export function mostrarAccionCarcel(jugador, game) {
  const accionesDiv = document.querySelector(".acciones-botones");
  if (!accionesDiv) return;

  accionesDiv.innerHTML = ""; // limpiar por si quedó algo antes

  // Solo mostrar si es el turno de este jugador y está en cárcel
  if (jugador.enCarcel) {
    const pagarBtn = document.createElement("button");
    pagarBtn.textContent = "Pagar $50 para salir";
    pagarBtn.className = "btn btn-peligro";

    pagarBtn.onclick = () => {
      if (jugador.dinero >= 50) {
        jugador.dinero -= 50;
        jugador.enCarcel = false;
        jugador.turnosEnCarcel = 0;

        document.getElementById("resultado").textContent =
          `${jugador.nombre} pagó $50 y salió de la cárcel.`;

        // refrescar interfaz de dinero
        actualizarPanelJugadores(game.jugadores);
        actualizarMiniPaneles(game.jugadores);

        // limpiar acciones y seguir turno
        accionesDiv.innerHTML = "";
      } else {
        alert(`${jugador.nombre} no tiene suficiente dinero para pagar la multa.`);
      }
    };

    accionesDiv.appendChild(pagarBtn);
  }
}


