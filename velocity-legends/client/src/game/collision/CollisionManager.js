import { CollisionSparks } from "../effects/CollisionSparks.js";
import { CameraShake } from "../effects/CameraShake.js";

export class CollisionManager {

    constructor(scene, player, aiCars, damageSystem) {

        this.scene = scene;
        this.player = player;
        this.aiCars = aiCars;
        this.damageSystem = damageSystem;

        this.sparks = new CollisionSparks(scene);
        this.shake = new CameraShake(scene);
        this.nextPlayerImpactAt = 0;

        this.register();

    }

    register() {

        this.aiCars.forEach(ai => {

            this.scene.physics.add.collider(

                this.player.sprite,

                ai.sprite,

                () => {

                    if (this.scene.time.now < this.nextPlayerImpactAt) return;

                    this.nextPlayerImpactAt = this.scene.time.now + 450;

                    this.damageSystem.hit();

                    this.player.sprite.setTint(0xffffff);
                    this.scene.time.delayedCall(120, () => {
                        if (this.player.sprite.active) this.player.sprite.setTint(this.player.carData.color || 0xffffff);
                    });

                    this.sparks.create(
                        this.player.sprite.x,
                        this.player.sprite.y
                    );

                    this.shake.medium();

                }

            );

        });

        for (let i = 0; i < this.aiCars.length; i++) {

            for (let j = i + 1; j < this.aiCars.length; j++) {

                this.scene.physics.add.collider(

                    this.aiCars[i].sprite,

                    this.aiCars[j].sprite,

                    () => {

                        this.sparks.create(

                            this.aiCars[i].sprite.x,

                            this.aiCars[i].sprite.y

                        );

                    }

                );

            }

        }

    }

}
