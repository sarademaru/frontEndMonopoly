import Game from "./game.js";

// js/UI.js
export default class UI {
  constructor(game) {
    this.game = game; // instancia de Juego
    // Esperar DOM y luego inicializar listeners
    document.addEventListener('DOMContentLoaded', () => this.initializeEventListeners());
  }

  async handleRollDice() {
    const rollDiceBtn = document.getElementById('btnLanzar');
    rollDiceBtn.disabled = true;

    // animación de dados
    this.animateDice();
    await this.sleep(600);

    const { dado1, dado2, suma } = this.game.tirarDadosAleatorio();

    this.updateDiceDisplay({ dice1: dado1, dice2: dado2 });
    document.getElementById("resultado").innerText =
        `${this.game.getJugadorActual().nombre} sacó ${dado1} y ${dado2} (Total: ${suma})`;

    // mover jugador
    this.game.moverJugadorActual(suma);

    // actualizar ficha visual
    colocarFicha(this.game.getJugadorActual(), document.getElementById("tablero"));

    // pasar turno
    this.game.siguienteTurno();

    rollDiceBtn.disabled = false;
}


  handleManualRoll() {
    const d1 = parseInt(document.getElementById("inputDado1").value, 10);
    const d2 = parseInt(document.getElementById("inputDado2").value, 10);

    try {
      const result = this.game.tirarDadosManual(d1, d2);
      this.updateDiceDisplay({ dado1: result.dado1, dado2: result.dado2 });
      this.showResultText(`Usaste 🎲 ${result.dado1} y ${result.dado2} (Total: ${result.suma})`);
      if (typeof this.game.moverJugadorActual === 'function') {
        this.game.moverJugadorActual(result.suma);
      }
    } catch (err) {
      alert(err.message);
    }
  }

  animateDice() {
    console.log("animateDice() llamado");
    const dice1 = document.getElementById("dice1");
    const dice2 = document.getElementById("dice2");
    if (!dice1 || !dice2) return;

    dice1.classList.add("rolling");
    dice2.classList.add("rolling");

    setTimeout(() => {
      dice1.classList.remove("rolling");
      dice2.classList.remove("rolling");
    }, 600);
  }

  updateDiceDisplay({ dado1, dado2 }) {
    const dice1 = document.getElementById("dice1");
    const dice2 = document.getElementById("dice2");

    const caras = ["⚀","⚁","⚂","⚃","⚄","⚅"];
    if (dice1 && typeof dado1 === "number") dice1.textContent = caras[dado1 - 1] || dado1;
    if (dice2 && typeof dado2 === "number") dice2.textContent = caras[dado2 - 1] || dado2;
  }

  showResultText(text) {
    const res = document.getElementById("resultado");
    if (res) res.textContent = text;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  initializeEventListeners() {
    console.log("Inicializando listeners UI");
    const rollDiceBtn = document.getElementById("btnLanzar");
    if (rollDiceBtn) rollDiceBtn.addEventListener("click", () => this.handleRollDice());

    const manualBtn = document.getElementById("btnManual");
    if (manualBtn) manualBtn.addEventListener("click", () => this.handleManualRoll());
  }
}
