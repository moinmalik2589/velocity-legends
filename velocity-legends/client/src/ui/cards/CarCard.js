import { UIFactory } from "../utils/UIFactory.js";
import { ConfirmationDialog } from "../dialogs/ConfirmationDialog.js";
import { StatBar } from "../widgets/StatBar.js";

import { playerManager } from "../../managers/PlayerManager.js";
import { vehicleManager } from "../../managers/VehicleManager.js";

export class CarCard {

    constructor(scene, scrollView, car, x, y, width = 1080, height = 170) {

        this.scene = scene;
        this.scrollView = scrollView;

        const panel = UIFactory.createPanel(
            scene,
            x,
            y,
            width,
            height
        );

        scrollView.add(panel.panel);

        const title = UIFactory.createLabel(
            scene,
            x - 470,
            y - 55,
            car.name,
            {
                fontFamily: "Arial",
                fontSize: "30px",
                color: "#FFFFFF",
                fontStyle: "bold"
            }
        );

        scrollView.add(title.text);

        const brand = UIFactory.createLabel(
            scene,
            x - 470,
            y - 20,
            `${car.brand} • ${car.class} Class`,
            {
                fontFamily: "Arial",
                fontSize: "20px",
                color: "#00D4FF"
            }
        );

        scrollView.add(brand.text);

        const speedLabel = UIFactory.createLabel(scene, x - 120, y - 48, "Speed");
        scrollView.add(speedLabel.text);

        const speedBar = new StatBar(scene, x - 20, y - 42, 180, car.stats.speed);
        scrollView.add(speedBar.background);
        scrollView.add(speedBar.fill);

        const accLabel = UIFactory.createLabel(scene, x - 120, y - 12, "Acceleration");
        scrollView.add(accLabel.text);

        const accBar = new StatBar(scene, x - 20, y - 6, 180, car.stats.acceleration);
        scrollView.add(accBar.background);
        scrollView.add(accBar.fill);

        const handlingLabel = UIFactory.createLabel(scene, x - 120, y + 24, "Handling");
        scrollView.add(handlingLabel.text);

        const handlingBar = new StatBar(scene, x - 20, y + 30, 180, car.stats.handling);
        scrollView.add(handlingBar.background);
        scrollView.add(handlingBar.fill);

        const nitroLabel = UIFactory.createLabel(scene, x - 120, y + 60, "Nitro");
        scrollView.add(nitroLabel.text);

        const nitroBar = new StatBar(scene, x - 20, y + 66, 180, car.stats.nitro);
        scrollView.add(nitroBar.background);
        scrollView.add(nitroBar.fill);

        const status = UIFactory.createLabel(
            scene,
            x + 250,
            y - 35,
            playerManager.ownsCar(car.id)
                ? "OWNED"
                : `${car.price.toLocaleString()} Coins`,
            {
                fontFamily: "Arial",
                fontSize: "24px",
                color: playerManager.ownsCar(car.id)
                    ? "#4CAF50"
                    : "#FFD54F"
            }
        );

        scrollView.add(status.text);

        const button = UIFactory.createButton(
            scene,
            x + 390,
            y + 30,
            playerManager.getSelectedCar() === car.id
                ? "SELECTED"
                : playerManager.ownsCar(car.id)
                    ? "SELECT"
                    : "BUY",
            () => {

                if (playerManager.getSelectedCar() === car.id) {
                    return;
                }

                if (playerManager.ownsCar(car.id)) {

                    vehicleManager.select(car.id);
                    scene.scene.restart();
                    return;

                }

                new ConfirmationDialog(
                    scene,
                    "Purchase Vehicle",
                    `Buy ${car.name} for ${car.price.toLocaleString()} coins?`,
                    () => {

                        if (vehicleManager.purchase(car.id)) {
                            vehicleManager.select(car.id);
                        }

                        scene.scene.restart();

                    }
                );

            }
        );

        scrollView.add(button.container);

    }

}