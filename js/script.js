// script.js
import UI from "./UI.js";
import Juego from "./game.js";
import Jugador from "./player.js";

let boardData;
let game; 
let ui; 

// ...existing code...

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
  inicializarListenersDados();
  
}

function dibujarFichas(jugadores) {
  const fichasSalida = document.getElementById("fichas-salida");
  fichasSalida.innerHTML = ""; 
  jugadores.forEach((jugador) => {
    const ficha = document.createElement("span");
    ficha.className = "ficha";
    ficha.textContent = jugador.token;
    ficha.title = jugador.name;
    ficha.style.fontSize = "2rem";
    ficha.style.marginRight = "5px";
    fichasSalida.appendChild(ficha);
  });
}




 // ...para que los dados sirvan despues de dar "iniciar juego"...
function inicializarListenersDados() {
  document.getElementById("btnLanzar").onclick = () => {
    const dice1 = document.getElementById("dice1");
    const dice2 = document.getElementById("dice2");

    // Agrega la clase de animación
    dice1.classList.add("rolling");
    dice2.classList.add("rolling");

    // Espera la animación antes de mostrar el resultado
    setTimeout(() => {
      const resultado = game.tirarDadosAleatorio();
      dice1.textContent = resultado.dado1;
      dice2.textContent = resultado.dado2;
      document.getElementById("resultado").textContent = `Total: ${resultado.suma}`;

      // Quita la clase de animación
      dice1.classList.remove("rolling");
      dice2.classList.remove("rolling");
    }, 500); // Debe coincidir con la duración de la animación
  };

  document.getElementById("btnManual").onclick = () => {
    const dice1 = document.getElementById("dice1");
    const dice2 = document.getElementById("dice2");
    const dado1 = parseInt(document.getElementById("inputDado1").value, 10);
    const dado2 = parseInt(document.getElementById("inputDado2").value, 10);

    dice1.classList.add("rolling");
    dice2.classList.add("rolling");

    setTimeout(() => {
      try {
        const resultado = game.tirarDadosManual(dado1, dado2);
        dice1.textContent = resultado.dado1;
        dice2.textContent = resultado.dado2;
        document.getElementById("resultado").textContent = `Total: ${resultado.suma}`;
      } catch (e) {
        document.getElementById("resultado").textContent = e.message;
      }
      dice1.classList.remove("rolling");
      dice2.classList.remove("rolling");
    }, 500);
  };
}

// Crear jugadores y propiedades mínimas
const jugadores = [new Jugador("Jugador 1"), new Jugador("Jugador 2")];
const propiedades = new Array(40).fill(null);


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

// Helper para actualizar estado visual de una propiedad
// Uso: window.actualizarEstadoPropiedad(1, { ownerColor: "#ff0000", houses: 2, hotel: false, ownerName: "Jugador 1" })
window.actualizarEstadoPropiedad = function(id, { ownerColor = null, houses = 0, hotel = false, ownerName = "" } = {}) {
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
    } catch {}
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

// inicializar
cargarCasillas();
