import { ScreenLayout } from "../layouts/ScreenLayout.js";
import { CarCard } from "../cards/CarCard.js";
import { VerticalScrollView } from "../scroll/VerticalScrollView.js";
import { CurrencyHUD } from "../hud/CurrencyHUD.js";
import { NavBar } from "../navigation/NavBar.js";

import { vehicleManager } from "../../managers/VehicleManager.js";

export class GarageScreen {

    constructor(scene) {

        this.scene = scene;

        this.layout = new ScreenLayout(
            scene,
            "GARAGE"
        );

        this.currencyHUD = new CurrencyHUD(scene);

        this.scrollView = new VerticalScrollView(scene);

        this.navBar = new NavBar(scene, "GARAGE");

        this.build();

    }

    build() {

        const cars = vehicleManager.getCars();

        let y = 200;

        cars.forEach(car => {

            new CarCard(
                this.scene,
                this.scrollView,
                car,
                this.scene.centerX(),
                y
            );

            y += 195;

        });

    }

}