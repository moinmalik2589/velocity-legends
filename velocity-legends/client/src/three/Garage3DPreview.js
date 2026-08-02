import * as THREE from "three";
import { ProceduralVehicleFactory } from "./ProceduralVehicleFactory.js";

export class Garage3DPreview {
    constructor(scene, vehicle) {
        this.host = scene.game.canvas.parentElement;
        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        this.renderer.setSize(300, 210);
        this.renderer.domElement.className = "garage-3d-preview";
        this.host.appendChild(this.renderer.domElement);
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(34, 300 / 210, 0.1, 100);
        this.camera.position.set(4.5, 3.2, 6.5);
        this.scene.add(new THREE.HemisphereLight(0xb8dfff, 0x101827, 2.4));
        const key = new THREE.DirectionalLight(0xffffff, 2.7); key.position.set(4, 6, 4); this.scene.add(key);
        const floor = new THREE.Mesh(new THREE.CircleGeometry(4.6, 48), new THREE.MeshStandardMaterial({ color: 0x101d32, metalness: 0.7, roughness: 0.35 })); floor.rotation.x = -Math.PI / 2; this.scene.add(floor);
        this.car = ProceduralVehicleFactory.create({ color: vehicle.color || 0x4ab8ff, preset: vehicle.class === "C" ? "compact" : vehicle.class === "B" ? "muscle" : "supercar", name: vehicle.name }); this.car.rotation.y = -0.42; this.scene.add(this.car); this.active = true; this.animate();
        scene.events.once("shutdown", () => this.destroy());
    }
    animate() { if (!this.active) return; this.car.rotation.y += 0.008; ProceduralVehicleFactory.animate(this.car,{speed:1.2,delta:1/60}); this.renderer.render(this.scene, this.camera); this.frame = requestAnimationFrame(() => this.animate()); }
    destroy() { this.active = false; cancelAnimationFrame(this.frame); this.renderer.dispose(); this.renderer.domElement.remove(); }
}
