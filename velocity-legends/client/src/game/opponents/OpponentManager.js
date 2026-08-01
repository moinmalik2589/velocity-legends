import { OPPONENT_NAMES } from "./OpponentNames.js";

export class OpponentManager {

    constructor(aiCars) {

        this.opponents = aiCars.map((car, index) => ({

            car,

            name: OPPONENT_NAMES[index % OPPONENT_NAMES.length]

        }));

    }

    getOpponents() {

        return this.opponents;

    }

}