export class NitroSystem {

    constructor(car) {

        this.car = car;

        this.maxNitro = 100;

        this.currentNitro = 100;

        this.drainRate = 25;

        this.rechargeRate = 12;

        this.boostMultiplier = 1.6;

    }

    update(input, delta) {

        const dt = delta / 1000;

        if (input.nitro() && this.currentNitro > 0) {

            this.currentNitro -= this.drainRate * dt;

            if (this.currentNitro < 0) {

                this.currentNitro = 0;

            }

            this.car.physicsController.maxSpeed = 350;

            this.car.physicsController.acceleration = 250;

        } else {

            this.currentNitro += this.rechargeRate * dt;

            if (this.currentNitro > this.maxNitro) {

                this.currentNitro = this.maxNitro;

            }

            this.car.physicsController.maxSpeed = 300;

            this.car.physicsController.acceleration = 250;

        }

    }

}
