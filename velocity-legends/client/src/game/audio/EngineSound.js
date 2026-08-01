export class EngineSound {

    constructor(scene, player) {

        this.scene = scene;
        this.player = player;

        this.label = scene.add.text(
            20,
            scene.scale.height - 100,
            "",
            {
                fontFamily: "Arial",
                fontSize: "18px",
                color: "#AAAAAA"
            }
        );

        this.label.setScrollFactor(0);

    }

    update() {

        const speed = Math.abs(this.player.speed);

        let gear = "IDLE";

        if (speed > 50) gear = "GEAR 1";
        if (speed > 150) gear = "GEAR 2";
        if (speed > 250) gear = "GEAR 3";
        if (speed > 350) gear = "GEAR 4";
        if (speed > 500) gear = "GEAR 5";

        this.label.setText(
            `ENGINE : ${gear}`
        );

    }

}