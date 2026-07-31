import { playerManager } from "./PlayerManager";

class CurrencyManager {

    getCoins() {
        return playerManager.getCoins();
    }

    addCoins(amount) {
        playerManager.addCoins(amount);
    }

    spendCoins(amount) {
        return playerManager.spendCoins(amount);
    }

    canAfford(amount) {
        return this.getCoins() >= amount;
    }
}

export const currencyManager = new CurrencyManager();