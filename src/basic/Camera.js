import * as THREE from 'three';

//esta camara caputa todo lo que este a menos de 1000 metros y despues de los 10 cm (0.1)
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );



export default camera;