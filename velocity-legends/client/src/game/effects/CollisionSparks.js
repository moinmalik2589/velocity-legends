import Phaser from "phaser";

export class CollisionSparks {

    constructor(scene) {

        this.scene = scene;

    }

    create(x, y) {

        for (let i = 0; i < 12; i++) {

            const spark = this.scene.add.circle(
                x,
                y,
                Phaser.Math.Between(2, 4),
                0xffcc00
            );

            this.scene.tweens.add({

                targets: spark,

                x: x + Phaser.Math.Between(-60, 60),

                y: y + Phaser.Math.Between(-60, 60),

                alpha: 0,

                duration: 300,

                onComplete: () => {

                    spark.destroy();

                }

            });

        }

    }

}