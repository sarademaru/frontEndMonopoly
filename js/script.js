// script.js (main entry point)
/**
 * Punto de entrada principal para el juego de Monopoly.
 * Inicializa el juego, la UI y maneja la lógica principal.
 */

import UI, { inicializarPanel } from "./UI.js";
import Juego from "./game.js";
import { agregarNovedad } from "./utilities.js";
window.agregarNovedad = agregarNovedad;
import { cargarCasillas, dibujarFichas, moverFicha, getBoardData } from "./ui/board.js";
import { inicializarListenersDados } from "./ui/dice.js";
import { actualizarTurno } from "./ui/turno.js";
import { aplicarImpuesto, cobrarRenta, mostrarCarta, mostrarDetalles } from "./utilities/gameUtils.js";
import { calcularPatrimonio } from "./utilities/gameUtils.js";

// =============================
// CONFIGURACIÓN DEL BACKEND
// =============================
const API_BASE = "http://127.0.0.1:5000";

let boardData;
let game;
let ui;



document.getElementById("start-game").addEventListener("click", () => {
  document.getElementById("pre-menu-modal").style.display = "none";
});

export async function iniciarJuego(jugadores) {
  const propiedades = new Array(40).fill(null);
  game = new Juego(jugadores, propiedades);
  ui = new UI(game);

  window.game = game;
  window.ui = ui;

  await cargarCasillas();
  dibujarFichas(jugadores);
  dibujarPanelJugadores(jugadores);
  window.dibujarPanelJugadores = dibujarPanelJugadores;

  inicializarPanel();

  boardData = getBoardData();
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

// -------------------------
// Acciones de cartas
// -------------------------
function aplicarAccionCarta(carta, jugador) {
  if (!carta.action) return;

  if (carta.action.money) {
    jugador.dinero += carta.action.money;
    const nombreCarta = getNombreCarta(carta.type);

    document.getElementById("resultado").textContent =
      `${jugador.nombre} ${carta.action.money > 0 ? "recibió" : "pagó"} $${Math.abs(carta.action.money)} por carta de ${nombreCarta} 💵`;

    agregarNovedad(`${jugador.nombre} ${carta.action.money > 0 ? "recibió" : "pagó"} $${Math.abs(carta.action.money)} por carta de ${nombreCarta} 💵`);
  }

  if (carta.action.goTo && carta.action.goTo.toLowerCase() === "jail") {
    enviarACarcel(jugador);
  }

  if (carta.action.moveTo !== undefined) {
    jugador.posicion = carta.action.moveTo;
    moverFicha(jugador);
    document.getElementById("resultado").textContent =
      `${jugador.nombre} se mueve a la casilla ${carta.action.moveTo}`;
  }

  dibujarPanelJugadores(game.jugadores);
  if (typeof window.dibujarMiniPaneles === "function") {
    window.dibujarMiniPaneles(game.jugadores);
  }
}

function getNombreCarta(type) {
  if (!type) return "Carta";
  switch (type.toLowerCase()) {
    case "community_chest": return "Cofre de Comunidad";
    case "chance": return "Sorpresa";
    default: return type;
  }
}

window.aplicarAccionCarta = aplicarAccionCarta;

// -------------------------
// Panel lateral jugadores
// -------------------------
function dibujarPanelJugadores(jugadores) {
  const panel = document.getElementById("lista-jugadores");
  panel.innerHTML = "";

  jugadores.forEach(j => {
    const div = document.createElement("div");
    div.classList.add("jugador-panel");
    div.id = `panel-${j.nombre}`;

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

// -------------------------
// Ranking local (partida)
// -------------------------
document.getElementById("btn-terminar").addEventListener("click", () => {
  terminarJuego();
});

let _scoresEnviados = false;  // evita doble click

async function terminarJuego() {
  window.juegoTerminado = true;

  const ranking = game.jugadores.map(j => {
    return {
      nombre: j.nombre,
      pais: j.country,
      patrimonio: calcularPatrimonio(j)
    };
  }).sort((a, b) => b.patrimonio - a.patrimonio);

  // 🔴 Enviar cada jugador al backend de forma secuencial
  for (const j of ranking) {
    console.log("Enviando jugador:", j);

    if (j.nombre && j.pais) {
      try {
        await fetch(`${API_BASE}/score-recorder`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nick_name: j.nombre,
            score: j.patrimonio,
            country_code: j.pais
          })
        });
      } catch (err) {
        console.error("Error enviando score:", err);
      }
    } else {
      console.warn("Jugador ignorado porque falta nombre o país:", j);
    }
  }

  // Bloquear los dados
  document.getElementById("btnLanzar").disabled = true;
  document.getElementById("btnManual").disabled = true;

  mostrarResultadosFinales(ranking);
}




function mostrarResultadosFinales(ranking) {
  const modal = document.getElementById("modal-resultados");
  const lista = document.getElementById("ranking-final");
  lista.innerHTML = "";

  ranking.forEach((j, i) => {
    let medalla = "";
    if (i === 0) medalla = "🥇";
    else if (i === 1) medalla = "🥈";
    else if (i === 2) medalla = "🥉";
    else if (i === ranking.length - 1) medalla = "🪵";

    lista.innerHTML += `
      <div class="jugador-ranking">
        <span>${medalla} #${i + 1} ${j.nombre}</span>
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

// -------------------------
// Ranking global
// -------------------------
function mostrarRankingGlobal(jugadores) {
  const lista = document.getElementById("ranking-global-list");
  lista.innerHTML = "";

  jugadores.forEach((j, i) => {
    let medalla = "🎖️";
    if (i === 0) medalla = "🥇";
    else if (i === 1) medalla = "🥈";
    else if (i === 2) medalla = "🥉";
    else if (i === jugadores.length - 1) medalla = "🪵";

    lista.innerHTML += `
      <div class="jugador-ranking">
        <span>${medalla} #${i + 1} ${j.nick_name}</span>
        <img src="https://flagsapi.com/${j.country_code.toUpperCase()}/flat/32.png" alt="Bandera">
        <span>💰 ${j.score}</span>
      </div>
    `;
  });

  document.getElementById("modal-ranking-global").classList.remove("oculto");
}

document.getElementById("btn-ranking-global").addEventListener("click", async () => {
  try {
    const res = await fetch(`${API_BASE}/ranking`);
    if (!res.ok) throw new Error("Error al obtener ranking global");

    const data = await res.json();
    const top10 = data.slice(0, 10);

    mostrarRankingGlobal(top10);
  } catch (err) {
    console.error("Error obteniendo ranking global:", err);
    alert("⚠️ No se pudo obtener el ranking global. Revisa que el backend en Flask esté corriendo en " + API_BASE);
  }
});

document.getElementById("cerrar-ranking-global").addEventListener("click", () => {
  document.getElementById("modal-ranking-global").classList.add("oculto");
});

// -------------------------
// Helper propiedades
// -------------------------
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
