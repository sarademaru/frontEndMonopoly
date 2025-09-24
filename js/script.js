// script.js
import UI from "./UI.js";
import Juego from "./game.js";
import Jugador from "./player.js";

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

  await cargarCasillas();
  dibujarFichas(jugadores);
  dibujarPanelJugadores(jugadores);
  inicializarListenersDados();
  actualizarTurno();

}

function dibujarFichas(jugadores) {
  console.log("Dibujando fichas para:", jugadores);
  const fichasSalida = document.getElementById("fichas-salida");
  fichasSalida.innerHTML = "";
  jugadores.forEach((jugador) => {
    const ficha = document.createElement("span");
    ficha.className = "ficha";

    // Al crear el jugador:
    const nombreLimpio = jugador.nombre.replace(/\s+/g, "");
    ficha.id = `ficha-${nombreLimpio}`; // <-- ID único

    ficha.textContent = jugador.token || "🔴";
    ficha.title = jugador.nombre;
    ficha.style.fontSize = "2rem";
    ficha.style.marginRight = "5px";
    fichasSalida.appendChild(ficha);
    console.log("Ficha agregada:", ficha);
  });
}

function moverFicha(jugador) {
  const nombreLimpio = jugador.nombre.replace(/\s+/g, "");
  const ficha = document.getElementById(`ficha-${nombreLimpio}`);
  const nuevaCasilla = document.querySelector(`.casilla[data-id="${jugador.posicion}"]`);
  if (ficha && nuevaCasilla) {
    nuevaCasilla.appendChild(ficha);
  }
}

// ...para que los dados sirvan despues de dar "iniciar juego"...
function inicializarListenersDados() {
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
  }

  // Función para mostrar modal de compra de propiedad
  function mostrarDetallesPropiedad(casilla, jugador) {
    const modal = document.createElement("div");
    modal.classList.add("modal");

    modal.innerHTML = `
      <div class="modal-content">
        <h3>${casilla.name}</h3>
        <p>Precio: $${casilla.price}</p>
        <p>Hipoteca: $${casilla.mortgage}</p>
        <p>Rentas: ${casilla.rent ? casilla.rent.join(", ") : "-"}</p>
        <button id="comprar-btn">Comprar</button>
        <button id="cancelar-btn">Cancelar</button>
      </div>
    `;

    document.body.appendChild(modal);

    // Comprar
    modal.querySelector("#comprar-btn").onclick = () => {
      if (jugador.dinero >= casilla.price) {
        jugador.dinero -= casilla.price;
        casilla.owner = jugador.nombre;
        jugador.propiedades.push(casilla);
        alert(`${jugador.nombre} compró ${casilla.name} por $${casilla.price}`);
      } else {
        alert(`${jugador.nombre} no tiene suficiente dinero 💸`);
      }
      modal.remove();
    };

    // Cancelar
    modal.querySelector("#cancelar-btn").onclick = () => {
      modal.remove();
    };
  }

  // -------------------------
  // Tirada ALEATORIA
  // -------------------------
  document.getElementById("btnLanzar").onclick = () => {
    dice1.classList.add("rolling");
    dice2.classList.add("rolling");

    setTimeout(() => {
      const jugador = game.getJugadorActual();

      // Si está en la cárcel
      if (jugador.enCarcel) {
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
          actualizarTurno();
          dice1.classList.remove("rolling");
          dice2.classList.remove("rolling");
          return;
        }
      } else {
        // Jugador normal
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

        // Ir a la cárcel
        if (casilla && casilla.action && casilla.action.goTo && casilla.action.goTo.toLowerCase() === "jail") {
          enviarACarcel(jugador);
          game.siguienteTurno();
          actualizarTurno();
          return;
        }

        // Cartas
        if (casilla && casilla.type === "chance") {
          mostrarCarta("chance", jugador);
        }
        else if (casilla && casilla.type === "community_chest") {
          mostrarCarta("community_chest", jugador);
        }
        else if (["property", "railroad", "utility"].includes(casilla.type)) {
          if (casilla.owner && casilla.owner !== jugador.nombre) {
            cobrarRenta(jugador, casilla);
          }
        }
        else if (casilla.type === "tax") {
          aplicarImpuesto(jugador, casilla);
        }

        // Propiedades disponibles
        // Después de moverFicha(jugador) y calcular `casilla`:

        if (casilla && ["property", "railroad", "utility"].includes(casilla.type)) {
          if (!casilla.owner) {
            const shouldRepeat = (typeof resultado !== "undefined") ?
              ((resultado.isDouble) ? (resultado.doublesCount < 3) : (resultado.dado1 && resultado.dado2 && resultado.dado1 === resultado.dado2))
              : false;

            // Abrimos modal de compra pasando al jugador y opciones
            mostrarDetalles(casilla, jugador, { fromLanding: true, shouldRepeat });

            // No sigas avanzando el turno aquí: la función mostrarDetalles se encargará
            // de llamar a game.siguienteTurno() (o no) cuando el usuario cierre/compre
            return;
          }
        }

        if (resultado.isDouble && resultado.doublesCount < 3) {
          resultadoTexto.textContent += " 🎉 ¡Doble! repite turno";
        } else {
          game.siguienteTurno();
        }
      }

      actualizarTurno();
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
            actualizarTurno();
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
            game.siguienteTurno();
            actualizarTurno();
            return;
          }

          if (casilla && casilla.type === "chance") {
            mostrarCarta("chance");
          }
          else if (casilla && casilla.type === "community_chest") {
            mostrarCarta("community_chest");
          }
          else if (casilla.type === "tax") {
            aplicarImpuesto(jugador, casilla);
          }
          else if (["property", "railroad", "utility"].includes(casilla.type)) {
            if (casilla.owner && casilla.owner !== jugador.nombre) {
              cobrarRenta(jugador, casilla);
            }
          }


          // Después de moverFicha(jugador) y calcular `casilla`:

          if (casilla && ["property", "railroad", "utility"].includes(casilla.type)) {
            if (!casilla.owner) {
              const shouldRepeat = (typeof resultado !== "undefined") ?
                ((resultado.dado1 === resultado.dado2) ? (resultado.doublesCount < 3) : (resultado.dado1 && resultado.dado2 && resultado.dado1 === resultado.dado2))
                : false;

              // Abrimos modal de compra pasando al jugador y opciones
              mostrarDetalles(casilla, jugador, { fromLanding: true, shouldRepeat });

              // No sigas avanzando el turno aquí: la función mostrarDetalles se encargará
              // de llamar a game.siguienteTurno() (o no) cuando el usuario cierre/compre
              return;
            }
          }

          if (resultado.dado1 === resultado.dado2) {
            resultadoTexto.textContent += " 🎉 ¡Doble! repite turno";
          } else {
            game.siguienteTurno();
          }
        }

        actualizarTurno();
      } catch (e) {
        resultadoTexto.textContent = e.message;
      }

      dice1.classList.remove("rolling");
      dice2.classList.remove("rolling");
    }, 500);
  };
}

function actualizarTurno() {
  const jugador = game.getJugadorActual();
  const turnoDiv = document.getElementById("turno-actual");
  turnoDiv.textContent = `🎲 Turno de: ${jugador.nombre} ${jugador.token}`;
}

// --- CARGA DE CASILLAS ---
async function cargarCasillas() {
  try {
    let data;
    try {
      const respBackend = await fetch("http://127.0.0.1:5000/board");
      if (!respBackend.ok) throw new Error("Backend no disponible");
      data = await respBackend.json();
    } catch (e) {
      //const respLocal = await fetch("json/board.json");
      //data = await respLocal.json();
    }
    boardData = data; // Guardar todo el JSON

    const allLists = [data.bottom, data.left, data.top, data.right];
    allLists.forEach(list => {
      list.forEach(c => {
        if (["property", "railroad", "utility"].includes(c.type)) {
          if (typeof c.owner === "undefined") c.owner = null;
        }
      });
    });

    const casillas = [...data.bottom, ...data.left, ...data.top, ...data.right];
    const tablero = document.getElementById("tablero");

    casillas.forEach((c, i) => {
      const div = document.createElement("div");
      div.classList.add("casilla");
      div.dataset.id = c.id;
      div.dataset.type = c.type || "";

      if (c.type) {
        div.classList.add(c.type);
      }

      // Abreviación
      const abrev = (c.name || "").slice(0, 3).toUpperCase();

      // Construcción del contenido con innerHTML
      let contenido = "";

      // Estado encima de la casilla (solo propiedades)
      if (c.type === "property") {
        contenido += `<div class="estado" id="estado-${c.id}">Disponible</div>`;
      }

      if (c.type === "property" && c.color) {
        contenido += `<div class="color-bar" style="background-color:${c.color};"></div>`;
      }

      contenido += `
        <span class="nombre-completo">${c.name}</span>
        <span class="abreviacion">${abrev}</span>
      `;

      // Contenedor de edificaciones (casas/hotel) solo para propiedades
      if (c.type === "property") {
        contenido += `<div class="edificaciones" id="edif-${c.id}"></div>`;
      }

      // Si es la casilla de salida (id 0), agrega el contenedor de fichas
      if (c.id === 0) {
        contenido += `<div id="fichas-salida"></div>`;
      }

      div.innerHTML = contenido;

      // Posicionamiento
      if (i < 11) {
        div.style.gridRow = 1;
        div.style.gridColumn = i + 1;
      } else if (i < 20) {
        div.style.gridColumn = 11;
        div.style.gridRow = i - 9;
      } else if (i < 31) {
        div.style.gridRow = 11;
        div.style.gridColumn = 31 - i;
      } else {
        div.style.gridColumn = 1;
        div.style.gridRow = 41 - i;
      }

      // Click para abrir detalles
      div.addEventListener("click", () => {
        mostrarDetalles(c);
      });

      tablero.appendChild(div);
    });

    if (casillas.length !== 40) {
      console.warn("Se esperaban 40 casillas, llegaron:", casillas.length);
    }
  } catch (err) {
    console.error("Error cargando casillas:", err);
  }
}

/**
 * Mostrar modal de detalles de casilla.
 * Si se pasa `jugador` (obj jugador) y la casilla es propiedad libre,
 * se mostrará botón Comprar que descuenta el dinero y asigna owner.
 *
 * options: { fromLanding: boolean, shouldRepeat: boolean }
 */
function mostrarDetalles(c, jugador = null, options = { fromLanding: false, shouldRepeat: false }) {
  let modal = document.getElementById("detalleModal");

  if (!modal) {
    modal = document.createElement("div");
    modal.id = "detalleModal";
    modal.innerHTML = `
      <div class="modal-content">
        <h3 id="modalNombre"></h3>
        <div id="modalContenido"></div>
        <div id="modalActions" style="margin-top:12px;"></div>
      </div>`;
    document.body.appendChild(modal);

    modal.addEventListener("click", (e) => {
      if (e.target.id === "detalleModal") {
        modal.style.display = "none";
      }
    });
  }

  document.getElementById("modalNombre").textContent = c.name;

  // ----- Contenido del modal -----
  let contenido = "";
  if (["property", "railroad", "utility"].includes(c.type)) {
    contenido += `<p><b>Precio:</b> $${c.price ?? "—"}</p>`;
    contenido += `<p><b>Hipoteca:</b> $${c.mortgage ?? "—"}</p>`;
    if (c.rent) {
      if (c.type === "railroad") {
        contenido += `<p><b>Rentas:</b></p><ul>`;
        contenido += `<li>1 ferrocarril: $${c.rent["1"]}</li>`;
        contenido += `<li>2 ferrocarriles: $${c.rent["2"]}</li>`;
        contenido += `<li>3 ferrocarriles: $${c.rent["3"]}</li>`;
        contenido += `<li>4 ferrocarriles: $${c.rent["4"]}</li>`;
        contenido += `</ul>`;
      } else {
        contenido += `<p><b>Renta base:</b> $${c.rent.base ?? "-"}</p>`;
      }
    }
  } else {
    contenido += `<p>Tipo: ${c.type}</p>`;
    if (c.action && c.action.money) {
      contenido += `<p><b>Acción:</b> ${c.action.money}</p>`;
    }
  }

  document.getElementById("modalContenido").innerHTML = contenido;

  // ----- Acciones -----
  const actionsEl = document.getElementById("modalActions");
  actionsEl.innerHTML = "";

  // Si es propiedad libre, permitir compra
  if (["property", "railroad", "utility"].includes(c.type) && !c.owner) {
    const buyBtn = document.createElement("button");
    buyBtn.textContent = "Comprar";
    buyBtn.className = "btn";

    // Si no hay jugador (solo abrir modal desde click), deshabilitar compra
    if (!jugador) buyBtn.disabled = true;

    buyBtn.onclick = () => {
      if (jugador && jugador.comprarPropiedad(c)) {
        c.owner = jugador.nombre;
        actualizarPanelJugadores(game.jugadores);

        // actualizar en tablero
        const estadoEl = document.getElementById(`estado-${c.id}`);
        if (estadoEl) {
          // Solo cambiamos el texto de estado
          estadoEl.textContent = "Ocupado";
          estadoEl.classList.remove("disponible");
          estadoEl.classList.add("ocupado");

          // Agregar dueño en un contenedor aparte
          let ownerInfo = document.getElementById(`owner-${c.id}`);
          if (!ownerInfo) {
            const casillaDiv = document.querySelector(`.casilla[data-id="${c.id}"]`);
            ownerInfo = document.createElement("div");
            ownerInfo.id = `owner-${c.id}`;
            ownerInfo.classList.add("owner-info");
            casillaDiv.appendChild(ownerInfo);
          }
          ownerInfo.innerHTML = `
    <span class="owner-token">${jugador.token}</span>
    <span class="owner-name">${jugador.nombre}</span>
  `;
        }

        document.getElementById("resultado").textContent =
          `${jugador.nombre} compró ${c.name} por $${c.price}`;
      } else {
        alert("No tienes suficiente dinero para comprar esta propiedad.");
      }

      modal.style.display = "none";

      if (options.fromLanding) {
        if (!options.shouldRepeat) game.siguienteTurno();
        actualizarTurno();
      }
    };

    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Cancelar";
    cancelBtn.className = "btn";
    cancelBtn.onclick = () => {
      modal.style.display = "none";
      if (options.fromLanding) {
        if (!options.shouldRepeat) game.siguienteTurno();
        actualizarTurno();
      }
    };

    actionsEl.appendChild(buyBtn);
    actionsEl.appendChild(cancelBtn);
  } else {
    const closeBtn = document.createElement("button");
    closeBtn.textContent = "Cerrar";
    closeBtn.className = "btn";
    closeBtn.onclick = () => { modal.style.display = "none"; };
    actionsEl.appendChild(closeBtn);
  }

  modal.style.display = "flex";
}

function aplicarAccionCarta(carta, jugador) {
  if (!carta.action) return;

  // Acción de dinero
  if (carta.action.money) {
    jugador.dinero += carta.action.money; // suma o resta
    document.getElementById("resultado").textContent =
      `${jugador.nombre} ${carta.action.money > 0 ? "recibió" : "pagó"} $${Math.abs(carta.action.money)}`;
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

  // 👇 actualizar panel de jugadores en pantalla
  actualizarPanelJugadores(game.jugadores);
}

function mostrarCarta(tipo, jugador) {
  const cartaCentro = document.getElementById("cartaCentro");
  const imgCarta = document.getElementById("imgCarta");
  const textoCarta = document.getElementById("textoCarta");

  let carta;

  if (tipo === "chance") {
    carta = boardData.chance[Math.floor(Math.random() * boardData.chance.length)];
    imgCarta.src = "assets/sorpresa.png";
  } else if (tipo === "community_chest") {
    carta = boardData.community_chest[Math.floor(Math.random() * boardData.community_chest.length)];
    imgCarta.src = "assets/comunidad.png";
  }

  textoCarta.textContent = carta.description;
  cartaCentro.style.display = "flex";

  cartaCentro.onclick = () => {
    cartaCentro.style.display = "none";
    aplicarAccionCarta(carta, jugador);
  };
}

function dibujarPanelJugadores(jugadores) {
  const panel = document.getElementById("panel-jugadores");
  panel.innerHTML = ""; // limpiar

  jugadores.forEach(j => {
    const div = document.createElement("div");
    div.classList.add("jugador-panel");
    div.id = `panel-${j.nombre}`;

    div.innerHTML = `
      <h4>${j.token} ${j.nombre}</h4>
      <p>Dinero: <span class="dinero">$${j.dinero}</span></p>
      <p>Propiedades: <span class="propiedades">${j.propiedades.length}</span></p>
    `;

    panel.appendChild(div);
  });
}

function actualizarPanelJugadores(jugadores) {
  jugadores.forEach(j => {
    const div = document.getElementById(`panel-${j.nombre}`);
    if (!div) return;

    div.querySelector(".dinero").textContent = `$${j.dinero}`;
    div.querySelector(".propiedades").textContent = j.propiedades.length;
  });
}

function cobrarRenta(jugador, casilla) {
  // verificar que haya dueño
  if (!casilla.owner) return;

  // buscar dueño en jugadores
  const dueno = game.jugadores.find(j => j.nombre === casilla.owner);
  if (!dueno || dueno === jugador) return; // no cobra renta a sí mismo

  // calcular renta (básico: solo renta base)
  let renta = 0;
  if (typeof casilla.rent === "number") {
    renta = casilla.rent;
  } else if (casilla.rent && casilla.rent.base) {
    renta = casilla.rent.base;
  } else if (typeof casilla.price === "number") {
    // fallback: renta básica como 10% del precio
    renta = Math.floor(casilla.price * 0.1);
  }

  // transferir dinero
  jugador.dinero -= renta;
  dueno.dinero += renta;

  // mostrar resultado
  document.getElementById("resultado").textContent =
    `${jugador.nombre} pagó $${renta} de renta a ${dueno.nombre}`;

  actualizarPanelJugadores(game.jugadores);
}

function aplicarImpuesto(jugador, casilla) {
  if (!casilla.action || !casilla.action.money) return;

  const monto = casilla.action.money; // negativo
  jugador.dinero += monto; // como es negativo, resta

  document.getElementById("resultado").textContent =
    `${jugador.nombre} pagó $${Math.abs(monto)} en ${casilla.name}`;

  actualizarPanelJugadores(game.jugadores);
}




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

