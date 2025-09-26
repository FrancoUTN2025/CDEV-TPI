import scene from './src/basic/Scene.js';
import * as THREE from 'three';
import camera from './src/basic/Camera.js';
import renderer from './src/basic/Renderer.js';
import cube from './src/basic/shapes/Cube.js';
import light from './src/basic/Light.js';
import resize from './src/basic/Resize.js';
import loopMachine from './src/basic/LoopMachine.js';
import keyListener from './src/basic/KeyListener.js';
import keyCode from './src/basic/KeyCode.js';
import characterController from './src/controllers/CharacterController.js';
import keyController from './src/controllers/KeyController.js';
import moveController from './src/controllers/MoveController.js';
import X_BotLoader from './src/models/characters/XBot/X_BotLoader.js';
import modelController from './src/controllers/ModeController.js';
import animationController from './src/controllers/AnimationController.js';
import rotationController from './src/controllers/RotationController.js';
import cRotationController from './src/controllers/cRotationController.js';
import { GLTFLoader } from './js/libs/GLTFLoader.js';
import { OrbitControls } from './js/libs/OrbitControls.js';

scene.add(light);
/*const loader = new THREE.TextureLoader();
loader.load('./src/models/Entornos/Imagenes/cieloEstrellado.jpg', function(texture) {
  scene.background = texture;
});
*/
let bot;

// Crear la curva de la elipse (vertical en el plano YZ)
/*const ellipseCurve = new THREE.EllipseCurve(
  5, 2,            // xCenter, yCenter
  2, 3,            // xRadius, yRadius (ajusta el tamaño)
  0, 2 * Math.PI,  // startAngle, endAngle
  false,           // sentido antihorario
  0                // rotación
);

// Obtener puntos de la curva
const points = ellipseCurve.getPoints(50);

// Crear geometría a partir de los puntos
const geometry = new THREE.BufferGeometry().setFromPoints(points);

// Crear material para la línea
const material = new THREE.LineBasicMaterial({ color: 0xff0000 });

// Crear la línea de la elipse
const ellipse = new THREE.Line(geometry, material);

// Rota la elipse para que quede vertical (en el plano YZ)
ellipse.rotation.y = Math.PI / 2;

// Opcional: posiciónala donde quieras
ellipse.position.set(0, 5, 0);

scene.add(ellipse);*/

// --- Grupo de suelos sobre los que el bot puede caminar ---
const walkableGroundGroup = new THREE.Group();
scene.add(walkableGroundGroup);

// --- Variables de física ---
let velocityY = 0;
const gravity = -0.5;

// --- Raycaster y vector hacia abajo ---
const raycaster = new THREE.Raycaster();
const down = new THREE.Vector3(0, -1, 0);

// --- Cargar entorno GLTF ---
const gltfLoader = new GLTFLoader();
const url = './src/models/Entornos/sceneCircle3.gltf';
gltfLoader.load(
  url,
  (gltf) => {
    // Usamos gltf.scene o el primer elemento de gltf.scenes como fallback
    const root = gltf.scene || (gltf.scenes && gltf.scenes[0]);
    if (!root) {
      console.error("GLTF no contiene una escena válida:", gltf);
      return;
    }

    // Escalar y posicionar
    root.scale.set(1, 1, 1);
    root.position.set(0, 0, 0);
    scene.add(root);

    // Recorrer solo meshes para agregar el floor
    root.traverse((child) => {
      if (child.isMesh) {
        if (child.name.toLowerCase().includes('floor')) {
          walkableGroundGroup.add(child);
          if (child.material && child.material.color) {
            child.material.color.set(0x316329); // Cambia a azul, o el color que prefieras
          }
        }
      }
    });

    console.log("GLTF cargado correctamente:", root);
  },
  undefined,
  (error) => {
    console.error("Error cargando el GLTF:", error);
  }
);

// --- Cargar personaje ---
X_BotLoader().then((loadedBot) => {
  bot = loadedBot;

  // Posicionar bot sobre el suelo
  const tempRayOrigin = new THREE.Vector3(0, 50, 0);
  raycaster.set(tempRayOrigin, down);
  const hits = raycaster.intersectObjects(walkableGroundGroup.children, true);
  let initialY = 10; // fallback
  if (hits.length > 0) initialY = hits[0].point.y;
  bot.position.set(0, initialY, 0);

  bot.rotation.y = Math.PI;
  bot.scale.set(0.01, 0.01, 0.01);
  scene.add(bot);

  // --- Posición inicial de la cámara ---
  const cameraOffset = new THREE.Vector3(0, -6, -5); // detrás y arriba del bot
  cameraOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI); // 180° para ver la espalda
  camera.position.copy(bot.position).add(cameraOffset);
  camera.lookAt(bot.position.clone().add(new THREE.Vector3(0, 2, 0)));

  // Añadir controladores
  characterController.addController(keyController);
  characterController.addController(moveController);
  characterController.addController(animationController);
  characterController.addController(modelController);
  characterController.addController(rotationController);
  characterController.addController(cRotationController);
  characterController.addCharacter(bot);
  characterController.start();
});

// --- Configuración de cámara y controles ---
const rotationSpeed = 0.05;
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.1;
controls.enablePan = false;
controls.target.set(0, 2, 0);

loopMachine.addCallback(() => {
  if (bot) {
    // Rotación manual con teclas
    if (keyListener.isPressed(keyCode.LEFT)) {
      bot.rotation.y += rotationSpeed;
      cRotationController.cRotation.y = bot.rotation.y;
    }
    if (keyListener.isPressed(keyCode.RIGHT)) {
      bot.rotation.y -= rotationSpeed;
      cRotationController.cRotation.y = bot.rotation.y;
    }

    // --- Física y gravedad ---
    velocityY += gravity * 0.1;
    bot.position.y += velocityY;

    raycaster.set(bot.position.clone().add(new THREE.Vector3(0, 50, 0)), down);
    const intersects = raycaster.intersectObjects(walkableGroundGroup.children, true);
    if (intersects.length > 0) {
      const groundY = intersects[0].point.y;
      if (bot.position.y <= groundY) {
        bot.position.y = groundY;
        velocityY = 0;
      }
    }

    // --- OrbitControls sigue al bot ---
    controls.target.copy(bot.position).add(new THREE.Vector3(0, 2, 0));
  }

  controls.update();

  if (keyListener.isPressed(keyCode.ENTER)) cube.rotation.y += 0.01;

  renderer.render(scene, camera);
});

resize.start(renderer);
loopMachine.start();
keyListener.start();
