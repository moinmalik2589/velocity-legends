import Phaser from "phaser";

export class WeatherSystem {

    constructor(scene) {
        this.scene = scene;
        this.mode = scene.raceEvent?.weather || "clear";
        this.isRaining = this.mode === "rain";
        this.drops = [];

        this.label = scene.add.text(scene.scale.width - 20, scene.scale.height - 40, "", {
            fontFamily: "Arial", fontSize: "18px", color: "#D7E9FF", fontStyle: "bold"
        }).setOrigin(1, 0.5).setScrollFactor(0);

        if (this.isRaining) this.createRain();
        if (this.mode === "fog") {
            scene.add.rectangle(scene.scale.width / 2, scene.scale.height / 2, scene.scale.width, scene.scale.height, 0xd8ddef, 0.12)
                .setScrollFactor(0).setDepth(9000);
        }
        this.updateLabel();
    }

    createRain() {
        for (let i = 0; i < 65; i++) {
            const drop = this.scene.add.rectangle(
                Phaser.Math.Between(0, this.scene.scale.width),
                Phaser.Math.Between(0, this.scene.scale.height),
                2, Phaser.Math.Between(14, 28), 0xa6dfff, 0.45
            ).setScrollFactor(0).setDepth(9500).setRotation(-0.3);
            drop.speed = Phaser.Math.Between(16, 28);
            this.drops.push(drop);
        }
    }

    updateLabel() {
        const name = this.isRaining ? "RAIN" : this.mode === "fog" ? "MOUNTAIN FOG" : "CLEAR SKY";
        this.label.setText(`WEATHER  ${name}`);
    }

    toggleRain() {
        this.isRaining = !this.isRaining;
        if (this.isRaining && this.drops.length === 0) this.createRain();
        this.drops.forEach(drop => drop.setVisible(this.isRaining));
        this.updateLabel();
    }

    update(player) {
        if (this.isRaining) {
            player.physicsController.drag = 0.987;
            player.physicsController.turnSpeed = 2.55 + player.carData.stats.handling / 80;
            this.drops.forEach(drop => {
                drop.y += drop.speed;
                drop.x -= 4;
                if (drop.y > this.scene.scale.height + 25) {
                    drop.y = -25;
                    drop.x = Phaser.Math.Between(0, this.scene.scale.width);
                }
            });
        } else {
            player.physicsController.drag = 0.98;
            player.physicsController.turnSpeed = 2 + player.carData.stats.handling / 60;
        }
    }
}
