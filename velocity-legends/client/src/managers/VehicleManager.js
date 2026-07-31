import { CARS } from "../data/Cars";
import { playerManager } from "./PlayerManager";

class VehicleManager {

    constructor() {

        this.cars = structuredClone(CARS);

    }

    getCars() {
        return this.cars;
    }

    getCar(id) {

        return this.cars.find(
            car => car.id === id
        );

    }

    getSelectedCar() {

        return this.getCar(
            playerManager.getSelectedCar()
        );

    }

    purchase(id) {

        const car = this.getCar(id);

        if (!car) {

            return false;

        }

        if (playerManager.ownsCar(id)) {

            return true;

        }

        if (!playerManager.spendCoins(car.price)) {

            return false;

        }

        playerManager.ownCar(id);

        return true;

    }

    select(id) {

        if (!playerManager.ownsCar(id)) {

            return false;

        }

        playerManager.setSelectedCar(id);

        return true;

    }

}

export const vehicleManager = new VehicleManager();