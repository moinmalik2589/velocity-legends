export class LapManager {

    constructor(scene) {

        this.scene = scene;

        this.currentLap = 1;

        this.maxLaps = 3;

        this.label = scene.add.text(
            20,
            110,
            "",
            {
                fontFamily: "Arial",
                fontSize: "28px",
                color: "#FFFFFF",
                fontStyle: "bold"
            }
        );

        this.label.setScrollFactor(0);

        this.updateLabel();

    }

    updateLabel() {

        this.label.setText(
            `LAP ${this.currentLap}/${this.maxLaps}`
        );

    }

    nextLap() {

        if (this.currentLap < this.maxLaps) {

            this.currentLap++;

            this.updateLabel();

            return false;

        }

        return true;

    }

}