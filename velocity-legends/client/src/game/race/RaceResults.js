import { playerManager } from "../../managers/PlayerManager.js";
import { RACE_EVENTS } from "../../data/RaceEvents.js";

export class RaceResults {

    constructor(scene, lapManager, raceTimer) {
        this.scene = scene;
        this.lapManager = lapManager;
        this.raceTimer = raceTimer;
        this.finished = false;
    }

    finishRace(didFinish = true) {
        if (this.finished) return;
        this.finished = true;
        this.raceTimer.stop();

        const event = this.scene.raceEvent || RACE_EVENTS[0];
        const position = didFinish ? (this.scene.positionManager?.position || 1) : this.scene.aiCars.length + 1;
        const baseReward = event.reward || 250;
        const multiplier = [0, 1, 0.7, 0.5, 0.35][position] || 0.35;
        const reward = didFinish ? Math.round(baseReward * multiplier) : 0;
        const player = playerManager.getData();
        const eventIndex = RACE_EVENTS.findIndex(item => item.id === event.id);
        player.career.bestTimes ??= {};
        const previousBest = player.career.bestTimes[event.id];
        const isBestTime = didFinish && (!previousBest || this.raceTimer.elapsed < previousBest);

        if (didFinish) {
            player.currency.coins += reward;
            player.career.missions.races++;
            if (position === 1) player.career.missions.wins++;
            const unlock = key => { if (!player.career.achievements.includes(key)) player.career.achievements.push(key); };
            unlock("first_race");
            if (position === 1) unlock("first_win");
            if (player.career.missions.wins >= 5) unlock("champion");
            playerManager.addXp(Math.max(50, reward));
            if (isBestTime) player.career.bestTimes[event.id] = this.raceTimer.elapsed;
            if (position === 1 && eventIndex >= 0) {
                player.career.unlockedChapter = Math.max(player.career.unlockedChapter, Math.min(RACE_EVENTS.length, eventIndex + 2));
                if (!player.career.completedEvents.includes(event.id)) player.career.completedEvents.push(event.id);
            }
            playerManager.save();
        }

        const width = this.scene.scale.width;
        const height = this.scene.scale.height;
        const summary = didFinish
            ? `${event.name}\n${this.raceTimer.label.text}  -  POSITION ${position}\n+${reward} CREDITS${isBestTime ? "\nNEW PERSONAL BEST!" : ""}`
            : "All opponents crossed the finish line.\nNo credits awarded.";

        this.scene.add.rectangle(width / 2, height / 2, 720, 360, 0x050a13, 0.92)
            .setScrollFactor(0).setDepth(20000).setStrokeStyle(2, didFinish ? 0x51caff : 0xe86b72, 0.85);
        this.scene.add.text(width / 2, height / 2 - 102, didFinish ? "RACE FINISHED" : "RACE ENDED", {
            fontFamily: "Trebuchet MS, Arial, sans-serif", fontSize: "48px", color: didFinish ? "#FFD54F" : "#FF838B", fontStyle: "bold"
        }).setOrigin(0.5).setScrollFactor(0).setDepth(20001);
        this.scene.add.text(width / 2, height / 2 - 20, summary, {
            fontFamily: "Trebuchet MS, Arial, sans-serif", fontSize: "26px", color: "#FFFFFF", align: "center"
        }).setOrigin(0.5).setScrollFactor(0).setDepth(20001);
        const prompt = didFinish && position === 1 && eventIndex < RACE_EVENTS.length - 1 ? "NEW STAGE UNLOCKED!" : "RACE COMPLETE";
        this.scene.add.text(width / 2, height / 2 + 92, prompt, {
            fontFamily: "Trebuchet MS, Arial, sans-serif", fontSize: "20px", color: "#B9D9FF", align: "center", fontStyle: "bold"
        }).setOrigin(0.5).setScrollFactor(0).setDepth(20001);

        const createAction = (x, label, color, callback) => {
            const action = this.scene.add.text(x, height / 2 + 145, label, {
                fontFamily: "Trebuchet MS, Arial, sans-serif", fontSize: "17px", fontStyle: "bold", color: "#07111E",
                backgroundColor: color, padding: { left: 18, right: 18, top: 10, bottom: 10 }
            }).setOrigin(0.5).setScrollFactor(0).setDepth(20001).setInteractive({ useHandCursor: true });
            action.on("pointerover", () => action.setScale(1.05));
            action.on("pointerout", () => action.setScale(1));
            action.on("pointerdown", callback);
        };
        createAction(width / 2 - 150, "RACE AGAIN", 0x51caff, () => this.scene.scene.start("RaceScene", { event }));
        createAction(width / 2 + 10, "STAGES", 0xffd54f, () => this.scene.scene.start("StageSelectScene"));
        createAction(width / 2 + 150, "GARAGE", 0x93b4dc, () => this.scene.scene.start("MainMenuScene"));

        this.scene.input.keyboard.once("keydown-ENTER", () => this.scene.scene.start("StageSelectScene"));
        this.scene.input.keyboard.once("keydown-ESC", () => this.scene.scene.start("MainMenuScene"));
    }
}
