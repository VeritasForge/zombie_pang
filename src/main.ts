// Entry point — Composition root에서 Phaser game을 구성한다.
import { startGame } from "@infrastructure/container";

const root = document.getElementById("game");
if (!root) {
  throw new Error("Game root container not found");
}

startGame(root);
