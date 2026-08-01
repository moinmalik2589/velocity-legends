import Phaser from "phaser";

import { RaceWorld } from "../game/world/RaceWorld.js";
import { PlayerCar } from "../game/entities/PlayerCar.js";
import { RaceCamera } from "../game/camera/RaceCamera.js";
import { TrackBuilder } from "../game/track/TrackBuilder.js";

import { Speedometer } from "../game/hud/Speedometer.js";
import { NitroBar } from "../game/hud/NitroBar.js";
import { Leaderboard } from "../game/hud/Leaderboard.js";

import { LapManager } from "../game/race/LapManager.js";
import { RaceResults } from "../game/race/RaceResults.js";
import { RaceProgressManager } from "../game/race/RaceProgressManager.js";

import { RaceTimer } from "../game/timer/RaceTimer.js";
import { Countdown } from "../game/countdown/Countdown.js";

import { AICar } from "../game/ai/AICar.js";

import { CollisionManager } from "../game/collision/CollisionManager.js";
import { MiniMap } from "../game/minimap/MiniMap.js";
import { RoadBoundary } from "../game/road/RoadBoundary.js";

import { SkidMarks } from "../game/effects/SkidMarks.js";
import { BoostEffect } from "../game/effects/BoostEffect.js";

import { EngineSound } from "../game/audio/EngineSound.js";

import { WeatherSystem } from "../game/weather/WeatherSystem.js";
import { DamageSystem } from "../game/damage/DamageSystem.js";

import { PositionManager } from "../game/position/PositionManager.js";

import { PickupManager } from "../game/pickups/PickupManager.js";
import { DriftManager } from "../game/drift/DriftManager.js";

import { SpeedLines } from "../game/effects/SpeedLines.js";
import { CinematicDepth } from "../game/effects/CinematicDepth.js";
import { TrafficManager } from "../game/traffic/TrafficManager.js";
import { RACE_EVENTS } from "../data/RaceEvents.js";

export class RaceScene extends Phaser.Scene {

    constructor() {

        super("RaceScene");

    }

    create(data = {}) {

        this.raceEvent = data.event || RACE_EVENTS[0];

        this.worldManager = new RaceWorld(this);
        this.worldManager.createBackground();

        this.track = new TrackBuilder(this);
        this.track.build();

        this.createStartingGrid();

        const gridSlots = [
            { x: 3000, y: 4400 },
            { x: 3000, y: 4465 },
            { x: 3000, y: 4530 },
            { x: 3000, y: 4595 }
        ];

        this.player = new PlayerCar(
            this,
            gridSlots[0].x,
            gridSlots[0].y
        );
        this.player.sprite.setAngle(90);

        const aiColors = [0x4CAF50, 0xFFEB3B, 0xF06C92];
        this.aiCars = Array.from({ length: this.raceEvent.rivals }, (_, index) =>
            new AICar(this, gridSlots[index + 1].x, gridSlots[index + 1].y, aiColors[index])
        );

        this.cinematicDepth = new CinematicDepth(this, this.player, this.aiCars);
        this.trafficManager = new TrafficManager(this);

        this.damageSystem =
            new DamageSystem(
                this,
                this.player
            );

        this.collisionManager =
            new CollisionManager(
                this,
                this.player,
                this.aiCars,
                this.damageSystem
            );

        this.roadBoundary =
            new RoadBoundary(
                this,
                this.player
            );

        this.camera =
            new RaceCamera(
                this,
                this.player.sprite
            );

        this.speedometer =
            new Speedometer(
                this,
                this.player
            );

        this.nitroBar =
            new NitroBar(
                this,
                this.player
            );

        this.engineSound =
            new EngineSound(
                this,
                this.player
            );

        this.skidMarks =
            new SkidMarks(
                this,
                this.player
            );

        this.boostEffect =
            new BoostEffect(
                this,
                this.player
            );
        
        this.speedLines =
            new SpeedLines(
                this,
                this.player
            );

        this.weather =
            new WeatherSystem(this);

        this.lapManager =
            new LapManager(this);

        this.lapManager.maxLaps = this.raceEvent.laps;
        this.lapManager.updateLabel();

        this.raceTimer =
            new RaceTimer(this);

        this.raceResults =
            new RaceResults(
                this,
                this.lapManager,
                this.raceTimer
            );
        
        this.progressManager =
            new RaceProgressManager(
                this,
                this.player,
                this.aiCars,
                this.lapManager,
                this.raceResults
            );

        this.countdown =
            new Countdown(this);

        this.miniMap =
            new MiniMap(
                this,
                this.player,
                this.aiCars
            );

        this.positionManager =
            new PositionManager(
                this,
                this.player,
                this.aiCars
            );

        this.leaderboard =
            new Leaderboard(
                this,
                this.player,
                this.aiCars
            );

        this.pickupManager =
            new PickupManager(
                this,
                this.player
            );

        this.driftManager =
            new DriftManager(
                this,
                this.player
            );

        this.input.keyboard.on(
            "keydown-H",
            () => {

                this.damageSystem.repair();

            }
        );

        this.add.text(
            20,
            20,
            `${this.raceEvent.name}\nWASD / Arrow Keys\nSHIFT = Nitro\nSPACE = Brake`,
            {
                fontFamily: "Arial",
                fontSize: "24px",
                color: "#FFFFFF"
            }
        )
            .setScrollFactor(0);

        this.add.text(
            20,
            135,
            `CAR  ${this.player.carData.name}`,
            {
                fontFamily: "Arial",
                fontSize: "18px",
                color: "#B9D9FF",
                fontStyle: "bold"
            }
        ).setScrollFactor(0);

        this.createPauseControls();
        this.createEventIntro();

    }

    createStartingGrid() {
        const x = 2860;
        const y = 4500;
        const g = this.add.graphics().setDepth(1);
        for (let row = 0; row < 8; row++) {
            const color = row % 2 === 0 ? 0xffffff : 0x141923;
            g.fillStyle(color, 0.95).fillRect(x - 10, y - 80 + row * 20, 20, 20);
            g.fillStyle(color === 0xffffff ? 0x141923 : 0xffffff, 0.95).fillRect(x + 10, y - 80 + row * 20, 20, 20);
        }
    }

    createEventIntro() {
        const color = `#${(this.raceEvent.palette?.accent || 0x51caff).toString(16).padStart(6, "0")}`;
        const title = this.add.text(this.scale.width / 2, this.scale.height / 2 - 150, this.raceEvent.name, {
            fontFamily: "Trebuchet MS, Arial, sans-serif", fontSize: "42px", fontStyle: "bold", color,
            stroke: "#06101E", strokeThickness: 8
        }).setOrigin(0.5).setScrollFactor(0).setDepth(17000);
        const location = this.add.text(this.scale.width / 2, this.scale.height / 2 - 104, this.raceEvent.location, {
            fontFamily: "Trebuchet MS, Arial, sans-serif", fontSize: "18px", fontStyle: "bold", color: "#E8F3FF", letterSpacing: 3
        }).setOrigin(0.5).setScrollFactor(0).setDepth(17000);
        this.tweens.add({ targets: [title, location], alpha: 0, y: "-=22", delay: 1050, duration: 500, onComplete: () => { title.destroy(); location.destroy(); } });
    }

    createPauseControls() {
        this.isPaused = false;
        this.pauseButton = this.add.text(this.scale.width - 28, 24, "II", {
            fontFamily: "Trebuchet MS, Arial, sans-serif", fontSize: "23px", color: "#FFFFFF", fontStyle: "bold",
            backgroundColor: "#102747", padding: { left: 12, right: 12, top: 7, bottom: 7 }
        }).setOrigin(1, 0).setScrollFactor(0).setDepth(16000).setInteractive({ useHandCursor: true });
        this.pauseButton.on("pointerdown", () => this.togglePause());
        this.input.keyboard.on("keydown-ESC", () => {
            if (!this.raceResults?.finished) this.togglePause();
        });
    }

    togglePause() {
        if (this.isPaused) {
            this.isPaused = false;
            this.pauseOverlay.destroy(true);
            this.pauseOverlay = null;
            this.pauseButton.setText("II");
            return;
        }
        this.isPaused = true;
        this.pauseButton.setText(">");
        this.pauseOverlay = this.add.container(0, 0).setScrollFactor(0).setDepth(19000);
        const shade = this.add.rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, 0x03070f, 0.76);
        const panel = this.add.rectangle(this.scale.width / 2, this.scale.height / 2, 470, 290, 0x10213b, 1).setStrokeStyle(2, 0x51caff, 0.9);
        const title = this.add.text(this.scale.width / 2, this.scale.height / 2 - 86, "RACE PAUSED", {
            fontFamily: "Trebuchet MS, Arial, sans-serif", fontSize: "40px", fontStyle: "bold", color: "#FFFFFF"
        }).setOrigin(0.5);
        const resume = this.add.text(this.scale.width / 2, this.scale.height / 2 - 12, "RESUME", {
            fontFamily: "Trebuchet MS, Arial, sans-serif", fontSize: "22px", fontStyle: "bold", color: "#07111E", backgroundColor: "#FFD54F", padding: { left: 44, right: 44, top: 12, bottom: 12 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        const exit = this.add.text(this.scale.width / 2, this.scale.height / 2 + 68, "EXIT RACE", {
            fontFamily: "Trebuchet MS, Arial, sans-serif", fontSize: "20px", fontStyle: "bold", color: "#FFB0B5", backgroundColor: "#46202A", padding: { left: 39, right: 39, top: 11, bottom: 11 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        resume.on("pointerdown", () => this.togglePause());
        exit.on("pointerdown", () => this.scene.start("MainMenuScene"));
        this.pauseOverlay.add([shade, panel, title, resume, exit]);
    }

    update(time, delta) {

        if (this.isPaused || this.raceResults?.finished) return;

        this.worldManager.update(time);

        this.player.update(delta);

        this.camera.update(this.player);

        if (this.countdown.canDrive) {

            this.aiCars.forEach(ai => {

                ai.update();

            });

            this.cinematicDepth.update();
            this.trafficManager.update();

            this.aiCars.forEach(ai => {
                if (ai.lap > this.lapManager.maxLaps) {
                    ai.finished = true;
                    ai.body.setVelocity(0);
                }
            });

            if (this.aiCars.every(ai => ai.finished) && !this.progressManager.finished) {
                this.progressManager.finished = true;
                this.raceResults.finishRace(false);
                return;
            }

            this.weather.update(
                this.player
            );

            this.roadBoundary.update();

            this.speedometer.update();

            this.nitroBar.update();

            this.engineSound.update();

            this.skidMarks.update();

            this.boostEffect.update();

            this.speedLines.update();

            this.pickupManager.update();

            this.driftManager.update();

            this.progressManager.update();

            this.raceTimer.update(delta);

        }

        this.miniMap.update();

        this.positionManager.update();

        this.leaderboard.update();

    }

}
