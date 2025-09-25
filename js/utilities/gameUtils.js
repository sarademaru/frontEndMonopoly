//gameUtils.js
/**
 *  GAMEUTILS.JS
 * Funciones para manejar acciones comunes del juego:
 * impuestos, rentas, cartas, detalles de casilla
 *  
 * */
import { actualizarPanelJugadores, actualizarMiniPaneles } from "../ui/paneles.js";
import { actualizarTurno } from "../ui/turno.js";
import { agregarNovedad } from "../utilities.js";



export function aplicarImpuesto(jugador, casilla) {
  if (!casilla.action || !casilla.action.money) return;

  const monto = casilla.action.money; // negativo
  jugador.dinero += monto; // como es negativo, resta

  document.getElementById("resultado").textContent =
    `${jugador.nombre} pagó $${Math.abs(monto)} en ${casilla.name}`;

  const gameRef = window.game;
  if (gameRef) {
    actualizarPanelJugadores(gameRef.jugadores);
    actualizarMiniPaneles(gameRef.jugadores);
  }
}

export function cobrarRenta(jugador, casilla) {
  // verificar que haya dueño
  if (!casilla.owner) return;

  // buscar dueño en jugadores
  const gameRef = window.game;
  const dueno = gameRef?.jugadores.find(j => j.nombre === casilla.owner);
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
  agregarNovedad(`${jugador.nombre} pagó $${renta} de alquiler 💸`);
  dueno.dinero += renta;
  agregarNovedad(`${dueno.nombre} recibió $${renta} de alquiler 💰`);

  // mostrar resultado
  document.getElementById("resultado").textContent =
    `${jugador.nombre} pagó $${renta} de renta a ${dueno.nombre}`;

  if (gameRef) {
    actualizarPanelJugadores(gameRef.jugadores);
    actualizarMiniPaneles(gameRef.jugadores);
  }
}

export function mostrarCarta(tipo, jugador) {
  const cartaCentro = document.getElementById("cartaCentro");
  const imgCarta = document.getElementById("imgCarta");
  const textoCarta = document.getElementById("textoCarta");

  let carta;

  const data = window.boardData;
  if (tipo === "chance" && data?.chance) {
    carta = data.chance[Math.floor(Math.random() * data.chance.length)];
    imgCarta.src = "assets/sorpresa.png";
  } else if (tipo === "community_chest" && data?.community_chest) {
    carta = data.community_chest[Math.floor(Math.random() * data.community_chest.length)];
    imgCarta.src = "assets/comunidad.png";
  }

  textoCarta.textContent = carta.description;
  cartaCentro.style.display = "flex";

  cartaCentro.onclick = () => {
    cartaCentro.style.display = "none";
    if (typeof window.aplicarAccionCarta === 'function') {
      window.aplicarAccionCarta(carta, jugador);
    } else {
      console.warn('aplicarAccionCarta no está disponible en window.');
    }
  };
}

/**
 * Mostrar modal de detalles de casilla.
 * Si se pasa `jugador` (obj jugador) y la casilla es propiedad libre,
 * se mostrará botón Comprar que descuenta el dinero y asigna owner.
 *
 * options: { fromLanding: boolean, shouldRepeat: boolean }
 */
export function mostrarDetalles(c, jugador = null, game, options = { fromLanding: false, shouldRepeat: false}) {
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
    
    // Mostrar información de casas y hoteles si es una propiedad
    if (c.type === "property") {
      contenido += `<p><b>Casas:</b> ${c.houses || 0}</p>`;
      contenido += `<p><b>Hotel:</b> ${c.hotel ? "Sí" : "No"}</p>`;
      contenido += `<p><b>Precio Casa:</b> $100</p>`;
      contenido += `<p><b>Precio Hotel:</b> $250</p>`;
    }
    
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
        if (c.type === "property" && c.rent.with_houses) {
          contenido += `<p><b>Renta con casas:</b></p><ul>`;
          contenido += `<li>1 casa: $${c.rent.with_houses["1"] ?? "-"}</li>`;
          contenido += `<li>2 casas: $${c.rent.with_houses["2"] ?? "-"}</li>`;
          contenido += `<li>3 casas: $${c.rent.with_houses["3"] ?? "-"}</li>`;
          contenido += `<li>4 casas: $${c.rent.with_houses["4"] ?? "-"}</li>`;
          if (c.rent.with_hotel) {
            contenido += `<li>Hotel: $${c.rent.with_hotel}</li>`;
          }
          contenido += `</ul>`;
        }
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
      const gameRef = game || window.game;
      if (jugador && jugador.comprarPropiedad(c)) {
        c.owner = jugador.nombre;
        if (gameRef) {
          actualizarPanelJugadores(gameRef.jugadores);
          actualizarMiniPaneles(gameRef.jugadores);
        }

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
        if (!options.shouldRepeat && gameRef) gameRef.siguienteTurno();
        if (gameRef) actualizarTurno(gameRef);
      }
    };

    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Cancelar";
    cancelBtn.className = "btn";
    cancelBtn.onclick = () => {
      modal.style.display = "none";
      if (options.fromLanding) {
        const gameRef = game || window.game;
        if (!options.shouldRepeat && gameRef) gameRef.siguienteTurno();
        if (gameRef) actualizarTurno(gameRef);
      }
    };

    actionsEl.appendChild(buyBtn);
    actionsEl.appendChild(cancelBtn);
  }
  // Si es una propiedad que posee el jugador actual
  else if (c.type === "property" && jugador && c.owner === jugador.nombre) {
    
    // Función auxiliar para verificar si el jugador posee todas las propiedades del mismo color
    const poseeGrupoCompleto = (jugador, propiedad, game) => {
      const data = window.boardData;
      if (!data) return false;

      const all = []
        .concat(Array.isArray(data.bottom) ? data.bottom : [])
        .concat(Array.isArray(data.left) ? data.left : [])
        .concat(Array.isArray(data.top) ? data.top : [])
        .concat(Array.isArray(data.right) ? data.right : []);

      const propiedadesMismoColor = all.filter(casilla =>
        casilla && casilla.type === "property" && casilla.color === propiedad.color
      );

      if (propiedadesMismoColor.length === 0) return false;
      return propiedadesMismoColor.every(prop => prop.owner === jugador.nombre);
    };

    // Botón para comprar casa
    if (!c.hotel && (c.houses || 0) < 4) {
      const buyHouseBtn = document.createElement("button");
      buyHouseBtn.textContent = "Comprar Casa ($100)";
      buyHouseBtn.className = "btn";
      
      const gameRef = game || window.game;
      
      // Verificar condiciones: poseer grupo completo y tener dinero
      if (!poseeGrupoCompleto(jugador, c, gameRef)) {
        buyHouseBtn.disabled = true;
        buyHouseBtn.title = "Necesitas poseer todas las propiedades del mismo color";
      } else if (jugador.dinero < 100) {
        buyHouseBtn.disabled = true;
        buyHouseBtn.title = "No tienes suficiente dinero";
      }
      
      buyHouseBtn.onclick = () => {
        if (jugador.dinero >= 100) {
          jugador.dinero -= 100;
          c.houses = (c.houses || 0) + 1;
          
          // Actualizar la UI
          if (gameRef) {
            actualizarPanelJugadores(gameRef.jugadores);
            actualizarMiniPaneles(gameRef.jugadores);
          }
          
          // Actualizar casas en el tablero
          actualizarCasasEnTablero(c);
          
          document.getElementById("resultado").textContent =
            `${jugador.nombre} compró una casa en ${c.name}`;
          
          // Cerrar modal y refrescar
          modal.style.display = "none";
          mostrarDetalles(c, jugador, gameRef, options);
        }
      };
      
      actionsEl.appendChild(buyHouseBtn);
    }

    // Botón para comprar hotel
    if (!c.hotel && (c.houses || 0) === 4) {
      const buyHotelBtn = document.createElement("button");
      buyHotelBtn.textContent = "Comprar Hotel ($250)";
      buyHotelBtn.className = "btn";
      
      const gameRef = game || window.game;
      
      // Verificar condiciones: tener 4 casas y tener dinero
      if (jugador.dinero < 250) {
        buyHotelBtn.disabled = true;
        buyHotelBtn.title = "No tienes suficiente dinero";
      }
      
      buyHotelBtn.onclick = () => {
        if (jugador.dinero >= 250) {
          jugador.dinero -= 250;
          c.hotel = true;
          c.houses = 0; // El hotel reemplaza las 4 casas
          
          // Actualizar la UI
          if (gameRef) {
            actualizarPanelJugadores(gameRef.jugadores);
            actualizarMiniPaneles(gameRef.jugadores);
          }
          
          // Actualizar hotel en el tablero
          actualizarCasasEnTablero(c);
          
          document.getElementById("resultado").textContent =
            `${jugador.nombre} compró un hotel en ${c.name}`;
          
          // Cerrar modal y refrescar
          modal.style.display = "none";
          mostrarDetalles(c, jugador, gameRef, options);
        }
      };
      
      actionsEl.appendChild(buyHotelBtn);
    }

    // Botón cerrar
    const closeBtn = document.createElement("button");
    closeBtn.textContent = "Cerrar";
    closeBtn.className = "btn";
    closeBtn.onclick = () => { modal.style.display = "none"; };
    actionsEl.appendChild(closeBtn);
  }
  else {
    const closeBtn = document.createElement("button");
    closeBtn.textContent = "Cerrar";
    closeBtn.className = "btn";
    closeBtn.onclick = () => { modal.style.display = "none"; };
    actionsEl.appendChild(closeBtn);
  }

  modal.style.display = "flex";
}

// Función auxiliar para actualizar las casas y hoteles en el tablero visual
function actualizarCasasEnTablero(propiedad) {
  const casillaDiv = document.querySelector(`.casilla[data-id="${propiedad.id}"]`);
  if (!casillaDiv) return;
  
  // Remover indicadores existentes de casas/hoteles
  const existingIndicators = casillaDiv.querySelectorAll('.houses-indicator, .hotel-indicator');
  existingIndicators.forEach(indicator => indicator.remove());
  
  if (propiedad.hotel) {
    // Mostrar hotel
    const hotelIndicator = document.createElement('div');
    hotelIndicator.className = 'hotel-indicator';
    hotelIndicator.textContent = '🏨';
    hotelIndicator.title = 'Hotel';
    casillaDiv.appendChild(hotelIndicator);
  } else if (propiedad.houses > 0) {
    // Mostrar casas
    const housesIndicator = document.createElement('div');
    housesIndicator.className = 'houses-indicator';
    housesIndicator.textContent = '🏠'.repeat(propiedad.houses);
    housesIndicator.title = `${propiedad.houses} casa${propiedad.houses > 1 ? 's' : ''}`;
    casillaDiv.appendChild(housesIndicator);
  }
}