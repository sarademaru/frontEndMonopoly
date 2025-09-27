// script.js (main entry point)
/**
 * Punto de entrada principal para el juego de Monopoly.
 * Inicializa el juego, la UI y maneja la lógica principal.
 * 
 */

import UI, { inicializarPanel } from "./UI.js";
import Juego from "./game.js";
import { agregarNovedad } from "./utilities.js";
window.agregarNovedad = agregarNovedad;
import { cargarCasillas, dibujarFichas, moverFicha, getBoardData } from "./ui/board.js";
import { inicializarListenersDados } from "./ui/dice.js";
import { actualizarTurno } from "./ui/turno.js";
import { aplicarImpuesto, cobrarRenta, mostrarCarta, mostrarDetalles } from "./utilities/gameUtils.js"; // donde tengas esas funciones
let boardData;
let game;
let ui;

window.onload = () => {
  document.getElementById("pre-menu-modal").style.display = "block";
};


document.getElementById("start-game").addEventListener("click", () => {
  // ...tu lógica de creación de jugadores...
  document.getElementById("pre-menu-modal").style.display = "none";
});

export async function iniciarJuego(jugadores) {
  const propiedades = new Array(40).fill(null);
  game = new Juego(jugadores, propiedades);
  ui = new UI(game);

  // opcional: exponer para depuración en consola
  window.game = game;
  window.ui = ui;

  await cargarCasillas();
  dibujarFichas(jugadores);
  dibujarPanelJugadores(jugadores);
  window.dibujarPanelJugadores = dibujarPanelJugadores;

  inicializarPanel();

  boardData = getBoardData();
  // Exponer boardData para utilidades que lo consultan
  window.boardData = boardData;
  inicializarListenersDados({
    game,
    boardData,
    aplicarImpuesto,
    cobrarRenta,
    mostrarCarta,
    mostrarDetalles
  });
  agregarNovedad(`🎉 El juego ha comenzado con ${jugadores.length} jugadores.`);
  actualizarTurno(game);
}

function aplicarAccionCarta(carta, jugador) {
  if (!carta.action) return;

  // Acción de dinero
  if (carta.action.money) {
  jugador.dinero += carta.action.money; // suma o resta
  const nombreCarta = getNombreCarta(carta.type);

  document.getElementById("resultado").textContent =
    `${jugador.nombre} ${carta.action.money > 0 ? "recibió" : "pagó"} $${Math.abs(carta.action.money)} por carta de ${nombreCarta} 💵`;

  agregarNovedad(`${jugador.nombre} ${carta.action.money > 0 ? "recibió" : "pagó"} $${Math.abs(carta.action.money)} por carta de ${nombreCarta} 💵`);
}

  // Ir a la cárcel
  if (carta.action.goTo && carta.action.goTo.toLowerCase() === "jail") {
    enviarACarcel(jugador);
  }

  // Mover a una posición
  if (carta.action.moveTo !== undefined) {
    jugador.posicion = carta.action.moveTo;
    moverFicha(jugador);
    document.getElementById("resultado").textContent =
      `${jugador.nombre} se mueve a la casilla ${carta.action.moveTo}`;
  }

  //  actualizar panel de jugadores en pantalla
  dibujarPanelJugadores(game.jugadores);
  if (typeof window.dibujarMiniPaneles === 'function') {
    window.dibujarMiniPaneles(game.jugadores);
  }
}

// Traducir tipo de carta a nombre amigable
function getNombreCarta(type) {
  if (!type) return "Carta";
  switch (type.toLowerCase()) {
    case "community_chest":
      return "Cofre de Comunidad";
    case "chance":
      return "Sorpresa";
    default:
      return type;
  }
}

// Exponer para que gameUtils.js pueda invocarla tras mostrarCarta
window.aplicarAccionCarta = aplicarAccionCarta;

// Exponer un abridor de detalles para clicks en casillas fuera del flujo de turno
// Abre el mismo modal pero sin jugador (compra deshabilitada) y con referencia al game actual
window.mostrarDetalles = (casilla) => {
  try {
    const gameRef = window.game || game;
    // jugador = null para que el botón Comprar quede deshabilitado
    // fromLanding = false para no afectar el turno
    mostrarDetalles(casilla, null, gameRef, { fromLanding: false, shouldRepeat: false });
  } catch (e) {
    console.warn("No se pudo abrir detalles de casilla:", e);
  }
};

function dibujarPanelJugadores(jugadores) {
  const panel = document.getElementById("lista-jugadores");
  panel.innerHTML = ""; // limpiar

  jugadores.forEach(j => {
    const div = document.createElement("div");
    div.classList.add("jugador-panel");
    div.id = `panel-${j.nombre}`;

    // URL de bandera con flagsapi
    let flagUrl = "";
    if (j.country) {
      flagUrl = `https://flagsapi.com/${j.country.toUpperCase()}/flat/32.png`;
    }

    div.innerHTML = `
    <h4>
      ${j.token} 
      ${j.nombre.split(" ").map(p => p[0]).join("").toUpperCase()} 
      ${flagUrl ? `<img src="${flagUrl}" alt="Bandera" class="jugador-bandera">` : ""}
    </h4>
    <p>💰 Dinero: <span class="dinero">$${j.dinero}</span></p>
    <p>🏠 Propiedades: <span class="propiedades">${j.propiedades.length}</span></p>
    <p>📉 Hipotecas: <span class="hipotecas">0</span></p>
`;
    panel.appendChild(div);
  });
}
document.getElementById("btn-terminar").addEventListener("click", () => {
  terminarJuego();
});

function terminarJuego() {
  const ranking = game.jugadores.map(j => {
    const patrimonio = j.dinero + (j.propiedades.length * 200);
    return { nombre: j.nombre, pais: j.country, patrimonio };
  }).sort((a, b) => b.patrimonio - a.patrimonio);

  agregarNovedad("🏁 El juego ha terminado. Ranking final:");
  ranking.forEach((j, i) => {
    agregarNovedad(`#${i + 1} ${j.nombre} (${j.pais}) - Patrimonio: $${j.patrimonio}`);
  });

  document.getElementById("btnLanzar").disabled = true;
  document.getElementById("btnManual").disabled = true;
  mostrarResultadosFinales(ranking);
}

function mostrarResultadosFinales(ranking) {
  const modal = document.getElementById("modal-resultados");
  const lista = document.getElementById("ranking-final");
  lista.innerHTML = "";

  ranking.forEach((j, i) => {
    lista.innerHTML += `
      <div class="jugador-ranking">
        <span>🏅 #${i + 1} ${j.nombre}</span>
        <img src="https://flagsapi.com/${j.pais.toUpperCase()}/flat/32.png" alt="Bandera">
        <span>💰 $${j.patrimonio}</span>
      </div>
    `;
  });

  modal.classList.remove("oculto");
}

document.getElementById("cerrar-modal").addEventListener("click", () => {
  document.getElementById("modal-resultados").classList.add("oculto");
});
//Cerrar modal resultados
document.getElementById("modal-resultados").addEventListener("click", (e) => {
  const modalContent = document.querySelector(".modal-contenido");
  if (!modalContent.contains(e.target)) {
    document.getElementById("modal-resultados").classList.add("oculto");
  }
});

// Helper para actualizar estado visual de una propiedad
// Uso: window.actualizarEstadoPropiedad(1, { ownerColor: "#ff0000", houses: 2, hotel: false, ownerName: "Jugador 1" })
window.actualizarEstadoPropiedad = function (id, { ownerColor = null, houses = 0, hotel = false, ownerName = "" } = {}) {
  const estadoEl = document.getElementById(`estado-${id}`);
  const edifEl = document.getElementById(`edif-${id}`);
  if (!estadoEl) return;
  if (!ownerColor) {
    estadoEl.textContent = "Disponible";
    estadoEl.classList.remove("ocupado");
    estadoEl.classList.add("disponible");
    estadoEl.style.backgroundColor = "#ffffff";
    estadoEl.style.color = "#000";
  } else {
    estadoEl.classList.remove("disponible");
    estadoEl.classList.add("ocupado");
    estadoEl.textContent = ownerName ? ownerName : "";
    estadoEl.style.backgroundColor = ownerColor;
    // elegir color de texto legible
    try {
      const rgb = getComputedStyle(document.body).color; // trigger computed style availability
    } catch { }
    estadoEl.style.color = "#fff";
  }
  if (edifEl) {
    if (hotel) {
      edifEl.textContent = "🏨";
    } else if (houses > 0) {
      edifEl.textContent = "🏠".repeat(Math.min(4, houses));
    } else {
      edifEl.textContent = "";
    }
  }
};
