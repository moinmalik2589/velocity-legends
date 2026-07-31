class StorageManager {

    constructor() {
        this.prefix = "velocity_legends_";
    }

    key(name) {
        return this.prefix + name;
    }

    save(name, data) {
        localStorage.setItem(
            this.key(name),
            JSON.stringify(data)
        );
    }

    load(name, defaultValue = null) {

        const value = localStorage.getItem(this.key(name));

        if (value === null) {
            return structuredClone(defaultValue);
        }

        try {
            return JSON.parse(value);
        }
        catch {

            return structuredClone(defaultValue);
        }
    }

    exists(name) {
        return localStorage.getItem(this.key(name)) !== null;
    }

    remove(name) {
        localStorage.removeItem(this.key(name));
    }

    clear() {

        Object.keys(localStorage).forEach(key => {

            if (key.startsWith(this.prefix)) {

                localStorage.removeItem(key);

            }

        });

    }

}

export const storageManager = new StorageManager();