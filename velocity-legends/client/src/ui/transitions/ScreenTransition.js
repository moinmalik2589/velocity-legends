export class ScreenTransition {

    static fadeIn(scene, duration = 300) {

        scene.cameras.main.fadeIn(duration);

    }

    static fadeOut(scene, callback, duration = 300) {

        scene.cameras.main.fadeOut(duration);

        scene.cameras.main.once("camerafadeoutcomplete", () => {

            if (callback) {
                callback();
            }

        });

    }

    static flash(scene, duration = 200) {

        scene.cameras.main.flash(duration);

    }

    static shake(scene, duration = 200, intensity = 0.005) {

        scene.cameras.main.shake(duration, intensity);

    }

}