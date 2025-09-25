// js/novedades.js
export function agregarNovedad(mensaje) {
  const log = document.getElementById("log-novedades");
  if (!log) return;

  const p = document.createElement("p");
  p.textContent = mensaje;

  if (log.children.length >= 20) {
    log.removeChild(log.firstChild);
  }

  log.appendChild(p);
  log.scrollTop = log.scrollHeight;
}
