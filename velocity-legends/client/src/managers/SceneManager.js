class SceneManager {

    constructor() {
        this.game = null;
    }

    initialize(game) {
        this.game = game;
    }

    start(sceneKey, data = {}) {

        if (!this.game) {
            return;
        }

        this.game.scene.start(sceneKey, data);
    }

    get(sceneKey) {

        if (!this.game) {
            return null;
        }

        return this.game.scene.getScene(sceneKey);
    }
}

export const sceneManager = new SceneManager();