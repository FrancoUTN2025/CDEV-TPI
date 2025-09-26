import * as THREE from 'three';

// Luz ambiental, ilumina todo por igual
const color = 0xFFFFFF;
const intensity = 0.5; // Puedes bajarle la intensidad para que no "queme" la escena
const light = new THREE.AmbientLight(color, intensity);

// Luz direccional, simula el sol
const sunLight = new THREE.DirectionalLight(color, 2);
sunLight.position.set(50, 100, 50); // Altura y dirección del sol
sunLight.castShadow = true; // Permite sombras

// Opcional: configura la calidad de las sombras
sunLight.shadow.mapSize.width = 2048; 
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.near = 0.5;
sunLight.shadow.camera.far = 500;
sunLight.shadow.camera.left = -200;
sunLight.shadow.camera.right = 200;
sunLight.shadow.camera.top = 200;
sunLight.shadow.camera.bottom = -200;

// Agrega la luz solar a la escena junto con la ambiental
light.add(sunLight);

export default light;