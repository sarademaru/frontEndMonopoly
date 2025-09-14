async function cargarCasillas() {
try {
    const resp = await fetch("json/board.json");
    const data = await resp.json();

    const casillas = [...data.bottom, ...data.left, ...data.top, ...data.right];
    const tablero = document.getElementById("tablero");

    casillas.forEach((c, i) => {
    const div = document.createElement("div");
    div.classList.add("casilla");

      // Abreviación (3 primeras letras en mayúsculas)
    const abrev = (c.name || "").slice(0, 3).toUpperCase();

    div.innerHTML = `
        <span class="nombre-completo">${c.name}</span>
        <span class="abreviacion">${abrev}</span>
    `;

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

      // Click para abrir el modal con detalles
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
    modal.style.position = "fixed";
    modal.style.top = "0";
    modal.style.left = "0";
    modal.style.width = "100%";
    modal.style.height = "100%";
    modal.style.background = "rgba(0,0,0,0.5)";
    modal.style.display = "flex";
    modal.style.alignItems = "center";
    modal.style.justifyContent = "center";
    modal.style.zIndex = "1000";

    modal.innerHTML = `
        <div style="background:white; padding:20px; border-radius:10px; max-width:320px; text-align:center;">
        <h3 id="modalNombre"></h3>
        <div id="modalContenido"></div>
        <button id="cerrarModal" style="margin-top:15px; padding:8px 15px; border:none; border-radius:5px; background:#333; color:white; cursor:pointer;">Cerrar</button>
        </div>
    `;
    document.body.appendChild(modal);

    // Para cerrar el modal
    modal.addEventListener("click", (e) => {
    if (e.target.id === "cerrarModal" || e.target.id === "detalleModal") {
        modal.style.display = "none";
    }
    });
}

  // Contenido dinámico según el tipo
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
        contenido = `
        <p><b>Impuesto:</b> $${Math.abs(c.action.money)}</p>
        `;
        break;
    case "community_chest":
        contenido = `<p>Casilla de Caja de Comunidad. Roba una carta.</p>`;
        break;
    case "chance":
        contenido = `<p>Casilla de Sorpresa. Roba una carta.</p>`;
        break;
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

cargarCasillas();
