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
        <option value="">Cargando...</option>
      </select>
    `;

    playersSetup.appendChild(playerDiv);
  }
  loadCountries();
}

playerCountSelect.addEventListener("change", (e) => {
  generatePlayerInputs(parseInt(e.target.value));
});

// Carga de países desde la API
async function loadCountries() {
  try {
    const res = await fetch("http://127.0.0.1:5000/countries");
    const countries = await res.json();
    document.querySelectorAll("[id^=player][id$=-country]").forEach((select) => {
      select.innerHTML = countries
        .map((c) => {
          const key = Object.keys(c)[0];
          return `<option value="${key}">${c[key]}</option>`;
        })
        .join("");
    });
  } catch (error) {
    console.error("Error cargando países:", error);
  }
}

// Iniciar con 4 jugadores por defecto
generatePlayerInputs(4);

window.onload = () => {
  document.getElementById("pre-menu-modal").style.display = "block";

};


  
document.getElementById("start-game").addEventListener("click", async () => {
  const playerCount = parseInt(playerCountSelect.value);
  const jugadores = [];

  for (let i = 1; i <= playerCount; i++) {
    const name = document.getElementById(`player${i}-name`).value;
    const country = document.getElementById(`player${i}-country`).value;

    const jugador = new Jugador(name);
    jugador.country = country;
    jugador.money = 1500;
    jugador.token = tokenColors[i - 1];
    jugador.posicion = 0;

    jugadores.push(jugador);
  }

  await iniciarJuego(jugadores);

  document.getElementById("pre-menu-modal").style.display = "none";
});