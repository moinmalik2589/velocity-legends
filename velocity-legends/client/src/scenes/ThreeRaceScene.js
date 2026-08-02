import Phaser from "phaser";
import { ThreeRaceScene as ThreeRaceRenderer } from "../three/ThreeRaceScene.js";

export class ThreeRaceScene extends Phaser.Scene {
  constructor(){ super("ThreeRaceScene"); }
  create(data){
    this.game.canvas.style.opacity="0";
   this.renderer=new ThreeRaceRenderer(this.game.canvas.parentElement,()=>this.scene.start("MainMenuScene"),()=>this.scene.restart({ stage: data?.stage }),data?.stage);
    this.events.once("shutdown",()=>{ this.renderer?.destroy(); this.game.canvas.style.opacity="1"; });
  }
}
