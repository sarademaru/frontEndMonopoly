/**
 *  BOARD.JS 
 * Carga las casillas desde el backend o un archivo local
 * y las dibuja en el DOM dentro de #tablero.
 */


// board.js
let boardData = null;

export async function cargarCasillas() {
  try {
    let data;
    try {
      const respBackend = await fetch("http://127.0.0.1:5000/board");
      if (!respBackend.ok) throw new Error("Backend no disponible");
      data = await respBackend.json();
    } catch (e) {
      // fallback: archivo local
      const respLocal = await fetch("json/board.json");
      data = await respLocal.json();
    }

    boardData = data; // Guardar todo el JSON en memoria

    // Asegurar que todas las propiedades tengan owner = null
    const allLists = [data.bottom, data.left, data.top, data.right];
    allLists.forEach(list => {
      list.forEach(c => {
        if (["property", "railroad", "utility"].includes(c.type)) {
          if (typeof c.owner === "undefined") c.owner = null;
        }
      });
    });

    // Dibujar casillas
    const casillas = [...data.bottom, ...data.left, ...data.top, ...data.right];
    const tablero = document.getElementById("tablero");

    casillas.forEach((c, i) => {
      const div = document.createElement("div");
      div.classList.add("casilla");
      div.dataset.id = c.id;
      div.dataset.type = c.type || "";

      if (c.type) div.classList.add(c.type);

      const abrev = (c.name || "").slice(0, 3).toUpperCase();
      let contenido = "";

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

      if (c.type === "property") {
        contenido += `<div class="edificaciones" id="edif-${c.id}"></div>`;
      }

      if (c.id === 0) {
        contenido += `<div id="fichas-salida"></div>`;
      }

      div.innerHTML = contenido;

      // Ubicar casillas en el grid 11x11
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

      // Evento al hacer click en casilla
      div.addEventListener("click", () => {
        if (typeof window.mostrarDetalles === "function") {
          window.mostrarDetalles(c);
        }
      });

      tablero.appendChild(div);
    });

    if (casillas.length !== 40) {
      console.warn("⚠️ Se esperaban 40 casillas, llegaron:", casillas.length);
    }
  } catch (err) {
    console.error("❌ Error cargando casillas:", err);
  }
}

/**
 * Devuelve el JSON completo del tablero.
 */
export function getBoardData() {
  return boardData;
}


export function dibujarFichas(jugadores) {
  console.log("Dibujando fichas para:", jugadores);
  const fichasSalida = document.getElementById("fichas-salida");
  fichasSalida.innerHTML = "";
  jugadores.forEach((jugador) => {
    const ficha = document.createElement("span");
    ficha.className = "ficha";

    const nombreLimpio = jugador.nombre.replace(/\s+/g, "");
    ficha.id = `ficha-${nombreLimpio}`;

    ficha.textContent = jugador.token || "🔴";
    ficha.title = jugador.nombre;
    ficha.style.fontSize = "2rem";
    ficha.style.marginRight = "5px";
    fichasSalida.appendChild(ficha);
    console.log("Ficha agregada:", ficha);
  });
}

// Funcion para mover la ficha del jugador en el tablero
export function moverFicha(jugador) {
  const nombreLimpio = jugador.nombre.replace(/\s+/g, "");
  const ficha = document.getElementById(`ficha-${nombreLimpio}`);

  const nuevaCasilla = document.querySelector(`.casilla[data-id="${jugador.posicion}"]`);
  if (ficha && nuevaCasilla) {
    nuevaCasilla.appendChild(ficha);
  }
}
