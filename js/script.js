// script.js
import UI from "js/UI.js";
import Juego from "js/game.js";
import Jugador from "js/player.js";

let boardData;

// Crear jugadores y propiedades mínimas
const jugadores = [new Jugador("Jugador 1"), new Jugador("Jugador 2")];
const propiedades = new Array(40).fill(null);

// Crear juego y UI
const game = new Juego(jugadores, propiedades);
const ui = new UI(game);

// --- CARGA DE CASILLAS ---
async function cargarCasillas() {
  try {
    const resp = await fetch("json/board.json");
    const data = await resp.json();
    boardData = data; // Guardar todo el JSON

    const casillas = [...data.bottom, ...data.left, ...data.top, ...data.right];
    const tablero = document.getElementById("tablero");

    casillas.forEach((c, i) => {
      const div = document.createElement("div");
      div.classList.add("casilla");

      if (c.type) {
        div.classList.add(c.type);
      }

      // Abreviación
      const abrev = (c.name || "").slice(0, 3).toUpperCase();

      // Construcción del contenido con innerHTML
      let contenido = "";

      if (c.type === "property" && c.color) {
        contenido += `<div class="color-bar" style="background-color:${c.color};"></div>`;
      }

      contenido += `
        <span class="nombre-completo">${c.name}</span>
        <span class="abreviacion">${abrev}</span>
      `;

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

// Función para mostrar detalles
function mostrarDetalles(c) {
  let modal = document.getElementById("detalleModal");

  if (!modal) {
    modal = document.createElement("div");
    modal.id = "detalleModal";

    modal.innerHTML = `
      <div class="modal-content">
        <h3 id="modalNombre"></h3>
        <div id="modalContenido"></div>
        <button id="cerrarModal">Cerrar</button>
      </div>
    `;
    document.body.appendChild(modal);

    modal.addEventListener("click", (e) => {
      if (e.target.id === "cerrarModal" || e.target.id === "detalleModal") {
        modal.style.display = "none";
      }
    });
  }

  // contenido dinámico según tipo
  let contenido = "";

  switch (c.type) {
    case "property":
      contenido = `
        <p><b>Color:</b> ${c.color}</p>
        <p><b>Precio:</b> $${c.price}</p>
        <p><b>Hipoteca:</b> $${c.mortgage}</p>
        <p><b>Renta base:</b> $${c.rent.base}</p>
      `;
      break;
    case "railroad":
      contenido = `
        <p><b>Precio:</b> $${c.price}</p>
        <p><b>Hipoteca:</b> $${c.mortgage}</p>
        <p><b>Rentas:</b></p>
        <ul style="text-align:left;">
          <li>1 ferrocarril: $${c.rent["1"]}</li>
          <li>2 ferrocarriles: $${c.rent["2"]}</li>
          <li>3 ferrocarriles: $${c.rent["3"]}</li>
          <li>4 ferrocarriles: $${c.rent["4"]}</li>
        </ul>
      `;
      break;
    case "tax":
      contenido = `<p><b>Impuesto:</b> $${Math.abs(c.action.money)}</p>`;
      break;
    case "community_chest":
      mostrarCarta("community_chest");
      return;
    case "chance":
      mostrarCarta("chance");
      return;
    case "special":
      contenido = `<p>Casilla especial.</p>`;
      break;
    default:
      contenido = `<p>Sin detalles adicionales.</p>`;
  }

  document.getElementById("modalNombre").textContent = c.name;
  document.getElementById("modalContenido").innerHTML = contenido;

  modal.style.display = "flex";
}

function mostrarCarta(tipo) {
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

  cartaCentro.addEventListener("click", () => {
    cartaCentro.style.display = "none";
  });
}

// inicializar
cargarCasillas();
