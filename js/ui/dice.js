/**
 *  DICE.JS
 * Manejo de dados, tiradas, cárcel, cartas, impuestos
 */

import { moverFicha } from "./board.js";
import { actualizarTurno } from "./turno.js";
import { mostrarAccionCarcel } from "./paneles.js";

// --------------------------------------
// Inicializar listeners de los botones
// --------------------------------------
export function inicializarListenersDados({
  game,
  boardData,
  aplicarImpuesto,
  cobrarRenta,
  mostrarCarta,
  mostrarDetalles
}) {
  const dice1 = document.getElementById("dice1");
  const dice2 = document.getElementById("dice2");
  const resultadoTexto = document.getElementById("resultado");

  function enviarACarcel(jugador) {
    const POSICION_CARCEL = 10; // id de cárcel 
    jugador.posicion = POSICION_CARCEL;
    jugador.enCarcel = true;
    jugador.turnosEnCarcel = 0;
    moverFicha(jugador);
    resultadoTexto.textContent = `${jugador.nombre} fue enviado a la cárcel 🚔`;
    mostrarAccionCarcel(jugador, game);
  }

  // -------------------------
  // Función central para procesar tiradas
  // -------------------------
  function procesarResultado(jugador, resultado) {
    // Mostrar valores en los dados
    dice1.textContent = resultado.dice1 ?? resultado.dado1;
    dice2.textContent = resultado.dice2 ?? resultado.dado2;

    const total = resultado.total ?? resultado.suma;
    const isDouble = resultado.isDouble ?? (resultado.dado1 === resultado.dado2);
    const doublesCount = resultado.doublesCount ?? jugador.doublesCount ?? 0;

    resultadoTexto.textContent =
      `${jugador.nombre} sacó ${dice1.textContent} y ${dice2.textContent} (total: ${total})`;

    // carcel
    if (jugador.enCarcel) {
      if (isDouble) {
        jugador.enCarcel = false;
        jugador.turnosEnCarcel = 0;
        resultadoTexto.textContent +=
          ` 🎉 ¡Pares! ${jugador.nombre} sale de la cárcel y avanza ${total} casillas.`;
        game.moverJugadorActual(total);
        moverFicha(jugador);
      } else {
        jugador.turnosEnCarcel++;
        if (jugador.turnosEnCarcel >= 3) {
          jugador.enCarcel = false;
          jugador.turnosEnCarcel = 0;
          jugador.dinero -= 50;
          resultadoTexto.textContent +=
            ` ❌ No sacó pares en 3 turnos. Paga $50 y sale de la cárcel.`;
        } else {
          resultadoTexto.textContent +=
            ` ❌ No sacó pares. Turno perdido en la cárcel (${jugador.turnosEnCarcel}/3).`;
          game.siguienteTurno();
          actualizarTurno(game);
          return;
        }
      }
    } else {
      // Avanzar al nuevo lugar
      game.moverJugadorActual(total);
      moverFicha(jugador);

      // Revisar la casilla
      const casilla = boardData.bottom
        .concat(boardData.left, boardData.top, boardData.right)
        .find(c => c.id === jugador.posicion);

      if (casilla?.action?.goTo?.toLowerCase() === "jail") {
        enviarACarcel(jugador);
        return;
      }

      if (casilla?.type === "chance") {
        mostrarCarta("chance", jugador);
      } else if (casilla?.type === "community_chest") {
        mostrarCarta("community_chest", jugador);
      } else if (casilla?.type === "tax") {
        aplicarImpuesto(jugador, casilla);
      } else if (["property", "railroad", "utility"].includes(casilla?.type)) {
        if (casilla.owner && casilla.owner !== jugador.nombre && !casilla.hipotecada) {
          cobrarRenta(jugador, casilla);
        } else {
          // Propiedad libre o propia → abrir modal de compra/gestión
          mostrarDetalles(casilla, jugador, game, {
            fromLanding: true,
            shouldRepeat: isDouble && doublesCount < 3
          });
          return;
        }
      }

      // pares
      if (isDouble) {
        if (doublesCount >= 2) {
          enviarACarcel(jugador);
          return;
        }
        resultadoTexto.textContent += " 🎉 ¡Pares! repite turno";
        return; // No pasar turno aún
      }
    }

    // Si no hubo pares se pasa al siguiente turno
    game.siguienteTurno();
    actualizarTurno(game);
  }

  // -------------------------
  // Tirada ALEATORIA
  // -------------------------
  document.getElementById("btnLanzar").onclick = () => {
    dice1.classList.add("rolling");
    dice2.classList.add("rolling");

    setTimeout(() => {
      const jugador = game.getJugadorActual();
      const resultado = game.rollDice();
      procesarResultado(jugador, resultado);

      dice1.classList.remove("rolling");
      dice2.classList.remove("rolling");
    }, 500);
  };

  // -------------------------
  // Tirada MANUAL
  // -------------------------
  document.getElementById("btnManual").onclick = () => {
    const dado1 = parseInt(document.getElementById("inputDado1").value, 10);
    const dado2 = parseInt(document.getElementById("inputDado2").value, 10);

    dice1.classList.add("rolling");
    dice2.classList.add("rolling");

    setTimeout(() => {
      const jugador = game.getJugadorActual();
      const resultado = game.tirarDadosManual(dado1, dado2);
      procesarResultado(jugador, resultado);

      dice1.classList.remove("rolling");
      dice2.classList.remove("rolling");
    }, 500);
  };
}
