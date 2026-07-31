import { storageManager } from "./StorageManager";
import { DEFAULT_PLAYER_DATA } from "../data/PlayerData";

class PlayerManager {

    constructor() {

        this.player = storageManager.load(
            "player",
            DEFAULT_PLAYER_DATA
        );

    }

    getData() {
        return this.player;
    }

    save() {
        storageManager.save("player", this.player);
    }

    load() {

        this.player = storageManager.load(
            "player",
            DEFAULT_PLAYER_DATA
        );

    }

    reset() {

        this.player = structuredClone(
            DEFAULT_PLAYER_DATA
        );

        this.save();

    }

    getCoins() {
        return this.player.currency.coins;
    }

    addCoins(amount) {

        this.player.currency.coins += amount;

        this.save();

    }

    spendCoins(amount) {

        if (this.player.currency.coins < amount) {

            return false;

        }

        this.player.currency.coins -= amount;

        this.save();

        return true;

    }

    getSelectedCar() {
        return this.player.garage.selectedCar;
    }

    setSelectedCar(carId) {

        this.player.garage.selectedCar = carId;

        this.save();

    }

    ownCar(carId) {

        if (!this.player.garage.ownedCars.includes(carId)) {

            this.player.garage.ownedCars.push(carId);

            this.save();

        }

    }

    ownsCar(carId) {

        return this.player
            .garage
            .ownedCars
            .includes(carId);

    }

}

export const playerManager = new PlayerManager();