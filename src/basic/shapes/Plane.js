import * as THREE from 'three';


const geometry = new THREE.PlaneGeometry( 10, 10);
const material = new THREE.MeshBasicMaterial( {color: 0xffff00, side: THREE.DoubleSide} );
const plane = new THREE.Mesh( geometry, material );

//neceitamos rotar el plano para que quede horizontal
plane.rotation.x = Math.PI / 2;

export default plane;