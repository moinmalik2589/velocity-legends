export class EventBus {
    constructor() {
        this.events = new Map();
    }

    on(event, callback) {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }

        this.events.get(event).push(callback);
    }

    emit(event, data = null) {
        if (!this.events.has(event)) {
            return;
        }

        this.events.get(event).forEach(callback => callback(data));
    }

    off(event, callback) {
        if (!this.events.has(event)) {
            return;
        }

        const listeners = this.events.get(event);
        const index = listeners.indexOf(callback);

        if (index !== -1) {
            listeners.splice(index, 1);
        }
    }
}

export const eventBus = new EventBus();