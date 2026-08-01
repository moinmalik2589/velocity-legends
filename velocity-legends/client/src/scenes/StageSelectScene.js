import { BaseScene } from "./BaseScene.js";
import { RACE_EVENTS } from "../data/RaceEvents.js";
import { playerManager } from "../managers/PlayerManager.js";

export class StageSelectScene extends BaseScene {

    constructor() {
        super("StageSelectScene");
    }

    create() {
        this.createBackground(0x071326);
        this.createTitle("SELECT EVENT");

        const player = playerManager.getData();
        this.add.text(40, 38, `CREDITS  ${player.currency.coins.toLocaleString()}`, {
            fontFamily: "Trebuchet MS, Arial, sans-serif", fontSize: "24px", fontStyle: "bold", color: "#FFD54F"
        });
        this.add.text(this.centerX(), 118, "WIN EVENTS TO UNLOCK THE NEXT STAGE", {
            fontFamily: "Trebuchet MS, Arial, sans-serif", fontSize: "17px", color: "#9DB9DD"
        }).setOrigin(0.5);

        RACE_EVENTS.forEach((event, index) => this.createEventCard(event, index, player.career.unlockedChapter));

        const back = this.add.text(40, 670, "<  BACK TO GARAGE", {
            fontFamily: "Trebuchet MS, Arial, sans-serif", fontSize: "20px", fontStyle: "bold", color: "#AFC8ED"
        }).setInteractive({ useHandCursor: true });
        back.on("pointerdown", () => this.scene.start("MainMenuScene"));
    }

    createEventCard(event, index, unlockedChapter) {
        const x = 78 + index * 390;
        const y = 180;
        const unlocked = unlockedChapter >= event.unlockAt;
        const color = [0xFF9E4A, 0x43B9FF, 0xC27DFF][index];
        const panel = this.add.rectangle(x + 170, y + 190, 340, 350, unlocked ? 0x132949 : 0x111927, 1)
            .setStrokeStyle(2, unlocked ? color : 0x34445D, 1);
        this.add.rectangle(x + 170, y + 72, 310, 112, unlocked ? color : 0x263244, unlocked ? 0.35 : 0.3);
        this.add.text(x + 24, y + 38, unlocked ? event.name : "LOCKED EVENT", {
            fontFamily: "Trebuchet MS, Arial, sans-serif", fontSize: "26px", fontStyle: "bold", color: unlocked ? "#FFFFFF" : "#77869B"
        });
        this.add.text(x + 24, y + 94, unlocked ? event.location : `WIN ${RACE_EVENTS[index - 1]?.name || "A RACE"}`, {
            fontFamily: "Trebuchet MS, Arial, sans-serif", fontSize: "15px", color: unlocked ? "#AFC8ED" : "#77869B"
        });
        this.add.text(x + 24, y + 158, unlocked ? event.description : "Complete the previous event to unlock this race.", {
            fontFamily: "Trebuchet MS, Arial, sans-serif", fontSize: "17px", color: "#CED9EC", wordWrap: { width: 285 }
        });
        this.add.text(x + 24, y + 252, `REWARD  ${event.reward} CREDITS`, {
            fontFamily: "Trebuchet MS, Arial, sans-serif", fontSize: "18px", fontStyle: "bold", color: unlocked ? "#FFD54F" : "#77869B"
        });
        this.add.text(x + 24, y + 282, `${event.laps} LAP${event.laps > 1 ? "S" : ""}  •  ${event.rivals} RIVALS`, {
            fontFamily: "Trebuchet MS, Arial, sans-serif", fontSize: "16px", color: "#AFC8ED"
        });
        if (unlocked) {
            const best = playerManager.getData().career.bestTimes?.[event.id];
            this.add.text(x + 24, y + 214, `BEST  ${best ? this.formatTime(best) : "--:--.---"}`, {
                fontFamily: "Trebuchet MS, Arial, sans-serif", fontSize: "15px", color: "#8CEBFF"
            });
            const button = this.add.text(x + 170, y + 326, "START RACE", {
                fontFamily: "Trebuchet MS, Arial, sans-serif", fontSize: "20px", fontStyle: "bold", color: "#08111F", backgroundColor: "#FFD54F", padding: { x: 24, y: 11 }
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });
            button.on("pointerdown", () => this.scene.start("RaceScene", { event }));
        } else {
            this.add.text(x + 170, y + 326, "LOCKED", { fontFamily: "Trebuchet MS, Arial, sans-serif", fontSize: "18px", color: "#77869B" }).setOrigin(0.5);
        }
    }

    formatTime(ms) {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        const milliseconds = Math.floor(ms % 1000);
        return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(milliseconds).padStart(3, "0")}`;
    }
}
