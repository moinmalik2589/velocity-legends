export class CarPhysics {

    constructor() {

        this.maxSpeed = 450;
        this.reverseSpeed = 150;
        this.acceleration = 320;
        this.brakePower = 700;
        this.drag = 0.98;
        this.turnSpeed = 3;

    }

    update(car, input, delta) {

        const dt = delta / 1000;

        if (input.up()) {

            car.speed += this.acceleration * dt;

        }
        else if (input.down()) {

            car.speed -= this.acceleration * dt;

        }
        else {

            car.speed *= this.drag;

        }

        if (input.brake()) {

            if (car.speed > 0) {

                car.speed -= this.brakePower * dt;

                if (car.speed < 0) {

                    car.speed = 0;

                }

            }

        }

        car.speed = Phaser.Math.Clamp(
            car.speed,
            -this.reverseSpeed,
            this.maxSpeed
        );

        if (Math.abs(car.speed) > 5) {

            if (input.left()) {

                car.sprite.angle -= this.turnSpeed;

            }

            if (input.right()) {

                car.sprite.angle += this.turnSpeed;

            }

        }

        car.scene.physics.velocityFromRotation(
            Phaser.Math.DegToRad(car.sprite.angle - 90),
            car.speed,
            car.body.velocity
        );

    }

}