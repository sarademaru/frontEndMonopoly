/**
 *  DICE.JS
 *Manejo de dados, tiradas, cárcel, cartas, impuestos 
 * 
 */
import { moverFicha } from "./board.js";
import { actualizarTurno } from "./turno.js";
import { mostrarAccionCarcel } from "./paneles.js";

// ...para que los dados sirvan despues de dar "iniciar juego"...
export function inicializarListenersDados({ game,
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
    const POSICION_CARCEL = 10; // id de cárcel en tu JSON
    jugador.posicion = POSICION_CARCEL;
    jugador.enCarcel = true;
    jugador.turnosEnCarcel = 0;
    moverFicha(jugador);
    resultadoTexto.textContent = `${jugador.nombre} fue enviado a la cárcel 🚔`;
    mostrarAccionCarcel(jugador, game);
  }

  // -------------------------
  // Tirada ALEATORIA
  // -------------------------
  document.getElementById("btnLanzar").onclick = () => {
    dice1.classList.add("rolling");
    dice2.classList.add("rolling");

    setTimeout(() => {
      const jugador = game.getJugadorActual();

      if (jugador.enCarcel) {
        mostrarAccionCarcel(jugador, game);
        const resultado = game.rollDice();
        dice1.textContent = resultado.dice1;
        dice2.textContent = resultado.dice2;

        if (resultado.isDouble) {
          jugador.enCarcel = false;
          jugador.turnosEnCarcel = 0;
          resultadoTexto.textContent =
            `${jugador.nombre} sacó doble 🎉 y sale de la cárcel. Avanza ${resultado.total} casillas.`;
          game.moverJugadorActual(resultado.total);
          moverFicha(jugador);

        } else {
          jugador.turnosEnCarcel++;
          if (jugador.turnosEnCarcel >= 3) {
            jugador.enCarcel = false;
            jugador.turnosEnCarcel = 0;
            jugador.dinero -= 50;
            resultadoTexto.textContent =
              `${jugador.nombre} no sacó doble en 3 turnos. Paga $50 y sale de la cárcel.`;
          } else {
            resultadoTexto.textContent =
              `${jugador.nombre} no sacó doble. Turno perdido en la cárcel (${jugador.turnosEnCarcel}/3).`;
          }
          game.siguienteTurno();
          actualizarTurno(game);
          dice1.classList.remove("rolling");
          dice2.classList.remove("rolling");
          return;
        }
      } else {
        const resultado = game.rollDice();
        dice1.textContent = resultado.dice1;
        dice2.textContent = resultado.dice2;
        resultadoTexto.textContent =
          `${jugador.nombre} sacó ${resultado.dice1} y ${resultado.dice2} (total: ${resultado.total})`;

        game.moverJugadorActual(resultado.total);
        moverFicha(jugador);

        const casilla = boardData.bottom
          .concat(boardData.left, boardData.top, boardData.right)
          .find(c => c.id === jugador.posicion);

        if (casilla && casilla.action && casilla.action.goTo && casilla.action.goTo.toLowerCase() === "jail") {
          enviarACarcel(jugador);
          return;
        }

        if (casilla && casilla.type === "chance") {
          mostrarCarta("chance", jugador);
        }
        else if (casilla && casilla.type === "community_chest") {
          mostrarCarta("community_chest", jugador);
        }
        else if (["property", "railroad", "utility"].includes(casilla.type)) {
          if (casilla.owner && casilla.owner !== jugador.nombre && !casilla.hipotecada) {
            cobrarRenta(jugador, casilla);
          }
        }
        else if (casilla.type === "tax") {
          aplicarImpuesto(jugador, casilla);
        }

        if (casilla && ["property", "railroad", "utility"].includes(casilla.type)) {
          if (!casilla.owner) {
            const shouldRepeat = (typeof resultado !== "undefined") ?
              ((resultado.isDouble) ? (resultado.doublesCount < 3) : (resultado.dado1 && resultado.dado2 && resultado.dado1 === resultado.dado2))
              : false;

            mostrarDetalles(casilla, jugador, game, { fromLanding: true, shouldRepeat });
            return;
          } else if (casilla.owner === jugador.nombre && casilla.type === "property") {
            // Si es su propia propiedad, abrir modal de gestión (casas/hotel)
            mostrarDetalles(casilla, jugador, game, { fromLanding: true, shouldRepeat: false });
            return;
          }
        }

        if (resultado.isDouble && resultado.doublesCount < 3) {
          resultadoTexto.textContent += " 🎉 ¡Doble! repite turno";
        } else {
          game.siguienteTurno();
        }
      }

      actualizarTurno(game);
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
      try {
        const jugador = game.getJugadorActual();

        if (jugador.enCarcel) {
          mostrarAccionCarcel(jugador, game);
          const resultado = game.tirarDadosManual(dado1, dado2);
          dice1.textContent = resultado.dado1;
          dice2.textContent = resultado.dado2;

          if (resultado.dado1 === resultado.dado2) {
            jugador.enCarcel = false;
            jugador.turnosEnCarcel = 0;
            resultadoTexto.textContent =
              `${jugador.nombre} sacó doble 🎉 y sale de la cárcel. Avanza ${resultado.suma} casillas.`;
            game.moverJugadorActual(resultado.suma);
            moverFicha(jugador);
          } else {
            jugador.turnosEnCarcel++;
            if (jugador.turnosEnCarcel >= 3) {
              jugador.enCarcel = false;
              jugador.turnosEnCarcel = 0;
              jugador.dinero -= 50;
              resultadoTexto.textContent =
                `${jugador.nombre} no sacó doble en 3 turnos. Paga $50 y sale de la cárcel.`;
            } else {
              resultadoTexto.textContent =
                `${jugador.nombre} no sacó doble. Turno perdido en la cárcel (${jugador.turnosEnCarcel}/3).`;
            }
            game.siguienteTurno();
            actualizarTurno(game);
            dice1.classList.remove("rolling");
            dice2.classList.remove("rolling");
            return;
          }
        } else {
          const resultado = game.tirarDadosManual(dado1, dado2);
          dice1.textContent = resultado.dado1;
          dice2.textContent = resultado.dado2;
          resultadoTexto.textContent =
            `${jugador.nombre} sacó ${resultado.dado1} y ${resultado.dado2} (total: ${resultado.suma})`;

          game.moverJugadorActual(resultado.suma);
          moverFicha(jugador);

          const casilla = boardData.bottom
            .concat(boardData.left, boardData.top, boardData.right)
            .find(c => c.id === jugador.posicion);

          if (casilla && casilla.action && casilla.action.goTo && casilla.action.goTo.toLowerCase() === "jail") {
            enviarACarcel(jugador);
            return;
          }

          if (casilla && casilla.type === "chance") {
            mostrarCarta("chance", jugador);
          }
          else if (casilla && casilla.type === "community_chest") {
            mostrarCarta("community_chest", jugador);
          }
          else if (casilla.type === "tax") {
            aplicarImpuesto(jugador, casilla);
          }
          else if (["property", "railroad", "utility"].includes(casilla.type)) {
            if (casilla.owner && casilla.owner !== jugador.nombre && !casilla.hipotecada) {
              cobrarRenta(jugador, casilla);
            }
          }

          if (casilla && ["property", "railroad", "utility"].includes(casilla.type)) {
            if (!casilla.owner) {
              const shouldRepeat = (typeof resultado !== "undefined") ?
                ((resultado.dado1 === resultado.dado2) ? (resultado.doublesCount < 3) : (resultado.dado1 && resultado.dado2 && resultado.dado1 === resultado.dado2))
                : false;

              mostrarDetalles(casilla, jugador, game, { fromLanding: true, shouldRepeat });
              return;
            } else if (casilla.owner === jugador.nombre && casilla.type === "property") {
              // Si es su propia propiedad, abrir modal de gestión (casas/hotel)
              mostrarDetalles(casilla, jugador, game, { fromLanding: true, shouldRepeat: false });
              return;
            }
          }

          if (resultado.dado1 === resultado.dado2) {
            resultadoTexto.textContent += " 🎉 ¡Doble! repite turno";
          } else {
            game.siguienteTurno();
          }
        }

        actualizarTurno(game);
      } catch (e) {
        resultadoTexto.textContent = e.message;
      }

      dice1.classList.remove("rolling");
      dice2.classList.remove("rolling");
    }, 500);
  };
}
