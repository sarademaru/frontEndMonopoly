import Jugador from "./player.js";
import { iniciarJuego } from "./script.js";

const tokenColors = ["🔴", "🔵", "🟢", "🟡"];
const playerCountSelect = document.getElementById("player-count");
const playersSetup = document.getElementById("players-setup");

// Solo permite 2, 3 o 4 jugadores
playerCountSelect.innerHTML = `
  <option value="2">2 jugadores</option>
  <option value="3">3 jugadores</option>
  <option value="4" selected>4 jugadores</option>
`;

// ------------------
// Genera inputs de jugadores
// ------------------
function generatePlayerInputs(count) {
  playersSetup.innerHTML = "";
  for (let i = 1; i <= count; i++) {
    const playerDiv = document.createElement("div");
    playerDiv.classList.add("player-input");

    playerDiv.innerHTML = `
      <h3>Jugador ${i} ${tokenColors[i - 1]}</h3>
      <label for="player${i}-name">Nombre:</label>
      <input type="text" id="player${i}-name" value="Jugador ${i}" required>
      
      <label for="player${i}-country">País:</label>
      <select id="player${i}-country" required>
        <option value="">Seleccione un país</option>
      </select>
    `;

    playersSetup.appendChild(playerDiv);
  }

  loadCountries();
}

// ------------------
// Cargar países 
// ------------------
async function loadCountries() {
  try {
    const res = await fetch("http://127.0.0.1:5000/countries"); // usa Flask
    const countries = await res.json();

    document.querySelectorAll('[id$="-country"]').forEach((select) => {
      select.innerHTML = `
        <option value="">Seleccione un país</option>
        ${countries
          .map((c) => {
            const key = Object.keys(c)[0]; // ej: "co"
            return `<option value="${key}">${c[key]}</option>`;
          })
          .join("")}
      `;
    });
  } catch (error) {
    console.error("Error cargando países:", error);
  }
}

// ------------------
// Inicializar según selección del select
// ------------------
generatePlayerInputs(parseInt(playerCountSelect.value));

// Escuchar cambios en la cantidad de jugadores
playerCountSelect.addEventListener("change", (e) => {
  generatePlayerInputs(parseInt(e.target.value));
});

// ------------------
// Mostrar pre-menú
// ------------------
window.onload = () => {
  document.getElementById("pre-menu-modal").style.display = "block";
};

// ------------------
// Botón "Iniciar Juego"
// ------------------
document.getElementById("start-game").addEventListener("click", async () => {
  const playerCount = parseInt(playerCountSelect.value);
  const jugadores = [];

  for (let i = 1; i <= playerCount; i++) {
    const name = document.getElementById(`player${i}-name`).value;
    const country = document.getElementById(`player${i}-country`).value;

    const jugador = new Jugador(name);
    jugador.country = country; // se guarda el código del país 
    jugador.dinero = 1500;
    jugador.token = tokenColors[i - 1];
    jugador.posicion = 0;

    jugadores.push(jugador);
  }

  await iniciarJuego(jugadores);
  dibujarMiniPaneles(jugadores);
  document.getElementById("pre-menu-modal").style.display = "none";
  
});

function dibujarMiniPaneles(jugadores) {
  const panel = document.getElementById("mini-panels");
  panel.innerHTML = "";

  jugadores.forEach((j, i) => {
    const iniciales = j.nombre
      .split(" ")
      .map(n => n[0]?.toUpperCase() + ".")
      .join("");

    const flagUrl = j.country
      ? `https://flagsapi.com/${j.country.toUpperCase()}/flat/32.png`
      : "";

    const div = document.createElement("div");
    div.classList.add("mini-card");
    div.id = `panel-mini-${j.nombre.replace(/\s+/g, "_")}`;

    div.innerHTML = `
      <div class="mini-header">
        <span class="token">${j.token}</span>
        ${flagUrl ? `<img class="mini-flag" src="${flagUrl}" alt="flag">` : ""}
        <strong>${iniciales}</strong>
      </div>
      <div class="mini-body">
        <p>💰 <span class="dinero">$${j.dinero}</span></p>
        <p>🏠 Propiedades: <span class="propiedades">${j.propiedades?.length || 0}</span></p>
        <p>📑 Hipotecas: <span class="hipotecas">${j.hipotecas?.length || 0}</span></p>
      </div>
    `;

    panel.appendChild(div);
  });
}

// Exponer para que otros módulos puedan actualizar los mini paneles
window.dibujarMiniPaneles = dibujarMiniPaneles;
