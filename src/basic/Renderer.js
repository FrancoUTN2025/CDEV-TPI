import * as THREE from 'three';

// antialias suaviza los bordes
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
// Usar espacio de color correcto para PBR
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.physicallyCorrectLights = true;
document.body.appendChild(renderer.domElement);

const canvas = renderer.domElement;

export default renderer;
export { canvas };