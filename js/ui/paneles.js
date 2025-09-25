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
