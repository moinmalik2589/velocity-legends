import Phaser from "phaser";
import { NitroPickup } from "./NitroPickup.js";

export class PickupManager {

    constructor(scene, player) {

        this.scene = scene;

        this.player = player;

        this.pickups = [

            new NitroPickup(scene, 4700, 2600),
            new NitroPickup(scene, 3000, 1200)

        ];

    }

    update() {

        this.pickups.forEach(pickup => {

            if (pickup.collected) return;

            const distance =
                Phaser.Math.Distance.Between(

                    pickup.sprite.x,
                    pickup.sprite.y,

                    this.player.sprite.x,
                    this.player.sprite.y

                );

            if (distance < 50) {

                pickup.collect(this.player);

            }

        });

    }

}
