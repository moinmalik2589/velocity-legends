import { BaseScene } from "./BaseScene.js";
import { playerManager } from "../managers/PlayerManager.js";

const EVENTS=[
 {id:"career-1",chapter:"CHAPTER 1 · CITY SPARK",name:"Neon Initiation",stage:{id:"neon-city",name:"Neon City Circuit",sky:0x07142a,color:0x37d9ff,laps:3}},
 {id:"career-2",chapter:"CHAPTER 2 · OPEN ROAD",name:"Coastal Breakaway",stage:{id:"coastal",name:"Coastal Highway",sky:0x4b3152,color:0xffa85a,laps:3}},
 {id:"career-3",chapter:"CHAPTER 3 · HEATLINE",name:"Canyon Charge",stage:{id:"desert",name:"Desert Canyon",sky:0x72412e,color:0xffca65,laps:3}},
 {id:"career-4",chapter:"CHAPTER 4 · ICEBOUND",name:"Summit Sprint",stage:{id:"alpine",name:"Alpine Snow",sky:0x2b4664,color:0xbcecff,laps:3}},
 {id:"career-5",chapter:"CHAPTER 5 · STEEL RUSH",name:"Dockyard Duel",stage:{id:"docks",name:"Industrial Docks",sky:0x122d31,color:0x8affbb,laps:3}},
 {id:"career-6",chapter:"CHAPTER 6 · WILDLANDS",name:"Forest Crown",stage:{id:"forest",name:"Forest Mountain",sky:0x17342a,color:0x8cda73,laps:3}},
];
export class CareerScene extends BaseScene {
 constructor(){super("CareerScene")}
 create(){this.createBackground(0x071326);this.createTitle("CAREER");const player=playerManager.getData(),completed=player.career.completedEvents||[];this.add.text(this.centerX(),112,`COMPLETION ${completed.length}/${EVENTS.length}`,{fontFamily:"Trebuchet MS, Arial",fontSize:"18px",fontStyle:"bold",color:"#AFC8ED"}).setOrigin(.5);EVENTS.forEach((event,index)=>{const unlocked=index===0||completed.includes(EVENTS[index-1].id),done=completed.includes(event.id),x=80+(index%3)*390,y=155+Math.floor(index/3)*250;this.add.rectangle(x+165,y+100,330,190,0x10213b,.98).setStrokeStyle(2,done?0x77ffb3:unlocked?event.stage.color:0x3b4b64);this.add.text(x+18,y+18,event.chapter,{fontFamily:"Trebuchet MS, Arial",fontSize:"13px",color:"#8fd6ff"});this.add.text(x+18,y+47,event.name,{fontFamily:"Trebuchet MS, Arial",fontSize:"23px",fontStyle:"bold",color:"#fff"});this.add.text(x+18,y+82,done?"COMPLETED":unlocked?event.stage.name:"WIN PREVIOUS EVENT",{fontFamily:"Trebuchet MS, Arial",fontSize:"16px",color:done?"#77ffb3":"#c7d8ee"});if(unlocked){const button=this.add.text(x+165,y+150,done?"REPLAY":"RACE",{fontFamily:"Trebuchet MS, Arial",fontSize:"17px",fontStyle:"bold",color:"#07111f",backgroundColor:"#ffd54f",padding:{x:25,y:9}}).setOrigin(.5).setInteractive({useHandCursor:true});button.on("pointerdown",()=>this.scene.start("ThreeRaceScene",{stage:event.stage,careerEvent:event}))}});const back=this.add.text(40,this.scale.height-40,"< BACK",{fontFamily:"Trebuchet MS, Arial",fontSize:"20px",fontStyle:"bold",color:"#AFC8ED"}).setInteractive({useHandCursor:true});back.on("pointerdown",()=>this.scene.start("MainMenuScene"))}
}
