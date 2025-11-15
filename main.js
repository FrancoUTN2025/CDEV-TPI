import scene from './src/basic/Scene.js';
import * as THREE from 'https://cdn.jsdelivr.net/npm/three/build/three.module.js';
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
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three/examples/jsm/loaders/GLTFLoader.js';


//Añadimos luces a la escena, intentamos imitar una luz solar, una luz direccional y una luz ambiental
scene.add(light);
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); 
scene.add(ambientLight);
const sunLight = new THREE.DirectionalLight(0xffffff, 2.5); 
sunLight.position.set(50, 100, 50); 
sunLight.target.position.set(0, 0, 0); 
scene.add(sunLight);
scene.add(sunLight.target);


let bot;
const gltfLoader = new GLTFLoader(); 

// Cargamos el fondo con un skybox
try {
  const cubeTextureLoader = new THREE.CubeTextureLoader();
  const skyboxPath = 'src/textures/skybox/'; 
  
  const skyboxImages = [
    'px.png', 
    'nx.png',
    'py.png', 
    'ny.png', 
    'pz.png', 
    'nz.png'  
  ];

  const skyboxTexture = cubeTextureLoader.setPath(skyboxPath).load(skyboxImages);
  scene.background = skyboxTexture;
  scene.environment = skyboxTexture;

} catch (e) {
  console.error("Error al cargar el skybox:", e);
}



// Agregamos audio al juego, sonido de pasos y sonido ambiental
const listener = new THREE.AudioListener();
camera.add(listener);
const audioLoader = new THREE.AudioLoader();
const ambientSound = new THREE.Audio(listener);
audioLoader.load('src/sounds/bosque_ambiente.mp3', function(buffer) {
    ambientSound.setBuffer(buffer);
    ambientSound.setLoop(true);
    ambientSound.setVolume(0.4);
    
    if (currentArea === 'area2') {
        ambientSound.play();
    }
});

const footstepSound = new THREE.Audio(listener);
audioLoader.load('src/sounds/paso_tierra.mp3', function(buffer) {
    footstepSound.setBuffer(buffer);
    footstepSound.setLoop(true); 
    footstepSound.setVolume(0.3);
});


const url = 'src/models/Entornos/scene(Paredes7).gltf'; 
const forestUrl = 'src/models/Entornos/bosque6.glb'; 

// Animales
const rabbitUrl = 'src/models/animales/rabbit.glb';
const foxUrl = 'src/models/animales/fox/fox.glb';
const bearUrl = 'src/models/animales/bear.glb';
const butterflyUrl = 'src/models/animales/butterfly.glb';
const horseUrl = 'src/models/animales/horse.glb'; 
const monkeyUrl = 'src/models/animales/monkey/monkey.glb'; 
const spiderUrl = 'src/models/animales/spider.glb'; 
const toadUrl = 'src/models/animales/toad/toad.glb'; 
const snakeUrl = 'src/models/animales/snake.glb'; 
const owlUrl = 'src/models/animales/owl/owl.glb'; 

// Comidas
const carrotUrl = 'src/models/comidas/carrot.glb';
const berriesUrl = 'src/models/comidas/berries.glb';
const appleUrl = 'src/models/comidas/apple.glb'; 
const bananaUrl = 'src/models/comidas/banana.glb'; 


//Grupo de suelos sobre los que el bot puede caminar
const walkableGroundGroup = new THREE.Group();
scene.add(walkableGroundGroup);

//Grupo de objetos interactuables (esferas, animales, comida)
const interactablesGroup = new THREE.Group();
scene.add(interactablesGroup);

//Contenedor para objetos del juego cargados por código
const gameObjectsGroup = new THREE.Group();
scene.add(gameObjectsGroup);

//Variables de física 
let velocityY = 0;
const gravity = -0.5;

// Raycaster y vector hacia abajo
const raycaster = new THREE.Raycaster();
const down = new THREE.Vector3(0, -1, 0);

// Sistema de áreas (ajustado)
const areas = {
  area1: { position: new THREE.Vector3(0, 0, 0), floorY: 0, name: 'Área 1' },
  area2: { position: new THREE.Vector3(0, 0, 0), floorY: 0, name: 'Área 2 (Bosque)' } 
};

let currentArea = 'area1';
let environmentRoot = null;

// Variables de estado de misión
let currentQuestAnimal = null;
let questRabbitFoodDone = false; 
let questFoxFoodDone = false; 
let questHorseFoodDone = false; 
let questMonkeyFoodDone = false; 
let questToadFoodDone = false; 
let questSnakeFoodDone = false; 

let questVertebrateReunionActive = false; 
let questVertebrateReunionComplete = false;
let questVertebrateReunionOffered = false
let vertebrateQuestGiver = null; 

//Variable para el portal
let exitPortal = null; 

//Variables para el Diálogo Inicial
let introDialogueMessages = [];
let currentDialogueIndex = 0;
let isIntroDialogueActive = false;

//Listas de misiones dinámicas
let loadedVertebrates = new Set();
let loadedInvertebrates = new Set();
let vertebratesToFind = new Set(); 

//Elemento de pantalla de carga
const loadingScreenElement = document.getElementById('loadingScreen');

// Función de ayuda para mostrar/ocultar
function showLoadingScreen(show) {
    if (loadingScreenElement) {
        loadingScreenElement.style.display = show ? 'flex' : 'none';
    }
}


// Función para chequear el final del juego
function checkAllMissionsComplete() {
    const allFoodQuestsDone = questRabbitFoodDone &&
                            questFoxFoodDone &&
                            questHorseFoodDone &&
                            questMonkeyFoodDone &&
                            questToadFoodDone &&
                            questSnakeFoodDone;
    
    if (allFoodQuestsDone && questVertebrateReunionComplete) {
        console.log("¡TODAS LAS MISIONES COMPLETADAS! Iniciando final.");
        
        setTimeout(() => {
            console.log("Mostrando mensaje final y creando portal.");
            
            let feedback = "Gracias por ayudarnos a recuperar nuestro brillo, puedes regresar";
            
            interactionPrompt.style.fontSize = '1.5em'; 

            interactionPrompt.innerText = feedback;
            showInteractionPrompt(true); 
            createExitPortal();
            setTimeout(clearSelection, 10000); 
            
        }, 3000);
    }
}


function createTextLabel(text, color = '#FFFFFF', fontSize = 24, strokeColor = 'rgba(0,0,0,0.8)', strokeWidth = 2) {
    
    // 1. Crear un canvas 2D
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    // 2. Establecer la fuente y medir el texto
    const font = `bold ${fontSize}px Arial`;
    context.font = font;
    const metrics = context.measureText(text);
    const textWidth = metrics.width;
    
    // 3. Ajustar el tamaño del canvas al texto
    canvas.width = textWidth + (strokeWidth * 2);
    canvas.height = fontSize + (strokeWidth * 2);
    
    // 4. Volver a aplicar la fuente (se resetea al cambiar el tamaño)
    context.font = font;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    
    // 5. Dibujar el borde (stroke)
    context.strokeStyle = strokeColor;
    context.lineWidth = strokeWidth;
    context.strokeText(text, canvas.width / 2, canvas.height / 2);
    
    // 6. Dibujar el relleno (fill)
    context.fillStyle = color;
    context.fillText(text, canvas.width / 2, canvas.height / 2);

    // 7. Crear la textura y el material del Sprite
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false 
    });

    // 8. Crear el Sprite (el objeto 3D)
    const sprite = new THREE.Sprite(material);
    
    // 9. Escalar el sprite (¡VALOR REDUCIDO!)
    const aspect = canvas.width / canvas.height;
    sprite.scale.set(aspect * 0.7, 0.7, 1); // <-- Reducido de 1.0 a 0.8
    
    return sprite;
}


//Función para crear el portal de salida
function createExitPortal() {
    if (exitPortal) return;

    console.log("Creando portal de salida...");
    
    const geometry = new THREE.SphereGeometry(1, 32, 16);
    // Material brillante y llamativo
    const material = new THREE.MeshStandardMaterial({
        color: 0x00FFFF, // Color cian
        emissive: 0x00FFFF, // Que brille
        emissiveIntensity: 2,
        metalness: 0.8,
        roughness: 0.1
    });
    
    exitPortal = new THREE.Mesh(geometry, material);
    exitPortal.name = "portal_exit";
    exitPortal.position.set(0, 1, 0);
    
    scene.add(exitPortal);
    interactablesGroup.add(exitPortal);
}


// --- refreshGroups SE MANTIENE 100% DE main.js ---
function refreshGroups() {
  // Remover sin eliminar
  while (walkableGroundGroup.children.length > 0) {
    walkableGroundGroup.remove(walkableGroundGroup.children[0]);
  }
  while (interactablesGroup.children.length > 0) {
    interactablesGroup.remove(interactablesGroup.children[0]);
  }

  // (Tu lógica de portal se mantiene)
  if (exitPortal) {
      interactablesGroup.add(exitPortal);
  }

  if (!environmentRoot || typeof environmentRoot.traverse !== 'function') {
    console.warn('refreshGroups: environmentRoot no está listo o no tiene traverse():', environmentRoot);
    return;
  }

  const floorsToAdd = [];
  const interactablesToAdd = []; 
  
  const emissiveColors = [
      0xFF0000,   // 1. Rojo
      0x00FFFF,   // 2. Celeste
      0x7FFFD4,   // 3. Verde Agua (Objetivo)
      0x00FF00,   // 4. Verde
      0xA0522D    // 5. Marrón
  ];
  
  // --- ¡NUEVO! Nombres de los reinos ---
  const realmNames = [
      "Protista",   
      "Monera",  
      "Animalia" ,
      "Fungi",   
      "Plantae"     
  ];


  try {
    environmentRoot.traverse((child) => {
    // ... (tu lógica de traverse se mantiene igual) ...
    
    if (child.name.toLowerCase().includes('floor')) {
      floorsToAdd.push(child);
    }

    const name = child.name.toLowerCase();
    const isSphereName = name.includes('sphere') || 
                        name.includes('esfera') ||
                        name.includes('ball') ||
                        name.includes('orb');
    
    const isSphereGeometry = child.isMesh && child.geometry && child.geometry.type === 'SphereGeometry';

    if (isSphereName || isSphereGeometry) {
      if (!child.name.toLowerCase().includes('floor')) {
           interactablesToAdd.push(child);
      }
    }
  });
  } catch (err) {
    console.error('Error en refreshGroups durante traverse:', err, 'environmentRoot:', environmentRoot);
    return;
  }
  
  // ... (tu lógica de floorsToAdd.forEach se mantiene igual) ...
  floorsToAdd.forEach(child => {
      walkableGroundGroup.add(child);
      if (child.material && child.material.color) {
        child.material.color.set(0x316329); 
      }
      console.log("✓ Floor agregado:", child.name, "Geometría:", child.geometry.type);
  });

  let sphereIndex = 0; 
  
  interactablesToAdd.forEach(child => {
      interactablesGroup.add(child); 
      
      const name = child.name.toLowerCase();
      if (name.includes('sphere') || name.includes('esfera')) {
          try {
              const materials = Array.isArray(child.material) ? child.material : [child.material];
              
              const colorIndex = Math.min(sphereIndex, emissiveColors.length - 1);
              const emissiveColorValue = emissiveColors[colorIndex];
              
              const isTargetSphere = (sphereIndex === 2); 
              
              materials.forEach(material => {
                  // ... (tu lógica de materiales se mantiene) ...
                  if (material.isMeshStandardMaterial || material.isMeshPhysicalMaterial) {
                      
                      material.emissive = new THREE.Color(0xFF0000);
                      
                      if (isTargetSphere) {
                          material.metalness = 1.0; 
                          material.roughness = 0.1; 
                          material.emissiveIntensity = 0.5; 
                          console.log(`✓ Esfera ${sphereIndex + 1} (V. AGUA) - ACTIVA (Metálica y Emisiva).`);
                      } else {
                          material.metalness = 0.0;     
                          material.roughness = 1.0;     
                          material.emissiveIntensity = 0.0; 
                          console.log(`✓ Esfera ${sphereIndex + 1} - APAGADA (Opaca).`);
                      }
                      
                      material.needsUpdate = true;
                  }
              });
              

              const labelText = realmNames[sphereIndex];
              if (labelText) {
                  const label = createTextLabel(labelText, '#FFFFFF');
                  
                  // Posicionamos la etiqueta sobre la esfera
                  label.position.copy(child.position);
                  
                  // --- ¡VALOR 'Y' AJUSTADO! ---
                  label.position.y += 1.2; // <-- Reducido de 1.4 a 1.2
                  
                  // La añadimos al 'gameObjectsGroup'
                  gameObjectsGroup.add(label);
              }

              sphereIndex++; 
              
          } catch (e) {
              console.warn("No se pudo ajustar el material de la esfera:", child.name, e);
          }
      } else {
        console.log("✓ Interactuable (no esfera) agregada:", child.name);
      }
  });

  console.log('TOTAL - Floors en grupo:', walkableGroundGroup.children.length);
}

// --- teleportToArea SE MANTIENE 100% DE main.js ---
function teleportToArea(areaName) {
  if (!areas[areaName]) {
    console.error('Área no existe:', areaName);
    return;
  }

  currentArea = areaName;
  const targetArea = areas[areaName];

  if (bot) {
    bot.position.x = targetArea.position.x;
    bot.position.z = targetArea.position.z;
    bot.position.y = targetArea.position.y + 3; 
    velocityY = 0;
    
    if (walkableGroundGroup.children.length > 0) {
      const rayOrigin = bot.position.clone().add(new THREE.Vector3(0, 50, 0)); 
      raycaster.set(rayOrigin, down);
      const hits = raycaster.intersectObjects(walkableGroundGroup.children, true);
      
      if (hits.length > 0) {
        const groundY = hits[0].point.y; 
        bot.position.y = groundY; 
        console.log('✓ Bot aterrizado en nuevo suelo en Y:', groundY);
      } else {
        bot.position.y = targetArea.floorY; 
        console.warn('⚠ Raycast falló en teletransporte, usando floorY de área.');
      }
    } else {
         console.warn('⚠ Teletransporte sin suelos en walkableGroundGroup.');
         bot.position.y = targetArea.floorY;
    }

    console.log('Teletransportado a:', targetArea.name);
  }
}

// --- ¡REEMPLAZA ESTA FUNCIÓN COMPLETA! ---
async function loadEnvironment(newUrl, areaName) {
  
  // --- ¡LÓGICA DE AUDIO DE ESCENA! ---
  if (areaName === 'area2') {
    // Si entramos al bosque, intentar reproducir.
    // (Esto solo funcionará si el audio ya está cargado (ambientSound.buffer))
    if (ambientSound && ambientSound.buffer && !ambientSound.isPlaying) {
      ambientSound.play();
    }
    // Si no está cargado, el callback de audioLoader (que acabamos de modificar)
    // se encargará de reproducirlo cuando termine.
  } else {
    // Si salimos del bosque (a area1), detenerlo.
    if (ambientSound && ambientSound.isPlaying) {
      ambientSound.stop();
    }
  }
  // --- FIN DEL BLOQUE DE AUDIO ---


  // 1. ¡MOSTRAR LA PANTALLA DE CARGA SI ES EL BOSQUE!
  if (areaName === 'area2') {
    showLoadingScreen(true);
  }

  try {
    // 2. Limpieza de entorno anterior si existe
    if (environmentRoot) {
      scene.remove(environmentRoot);
    }
    
    // --- ¡NUEVO! Limpieza del portal de salida ---
    if (exitPortal) {
        scene.remove(exitPortal);
        // (interactablesGroup se limpia en refreshGroups,
        //  pero lo sacamos de la escena principal aquí)
        exitPortal = null; 
    }
    
    walkableGroundGroup.clear();
    interactablesGroup.clear();
    gameObjectsGroup.clear();
    
    // --- ¡CORRECCIÓN DE LÓGICA! ---
    // Limpiamos las listas CADA VEZ que cargamos un entorno.
    console.log("Limpiando listas de animales...");
    loadedVertebrates.clear(); 
    loadedInvertebrates.clear();
    // --- FIN CORRECCIÓN ---

    // 3. Carga del nuevo entorno (bosque o scene4)
    const gltf = await new Promise((res, rej) => gltfLoader.load(newUrl, res, undefined, rej));
    const root = gltf.scene || (gltf.scenes && gltf.scenes[0]);
    if (!root) {
      console.error("GLTF no contiene una escena válida:", gltf);
      return;
    }

    root.scale.set(1, 1, 1);
    root.position.set(0, 0, 0);
    scene.add(root);
    environmentRoot = root; 

    // 4. Actualizar grupos de física (pisos y esferas del GLB principal)
    refreshGroups();
    
    // --- ¡NUEVO BLOQUE PARA AREA 1 (CORREGIDO)! ---
    if (areaName === 'area1') {
        console.log("Cargando objetos de la escena inicial...");
        try {
            const owlGLTF = await gltfLoader.loadAsync(owlUrl);
            const owl = owlGLTF.scene;
            owl.name = "animal_owl"; // Para que sea interactivo
            
            // --- ¡AJUSTE DE POSICIÓN Y ROTACIÓN! ---
            // Posición: (5.42, 1, 0) -> Arriba de la "Box"
            owl.position.set(5.42, 2.8, 0);
            
            // Escala: (No la tocamos, como pediste)
            owl.scale.set(0.001, 0.001, 0.001);

            // Rotación: Mirando al centro (donde apareces tú)
            // Usamos (0, 1, 0) porque el bot aparece en (0, y, 0) y el búho está en y=1
            owl.lookAt(0, 2.8, 0); 
            owl.rotation.y += Math.PI;
            // --- FIN DEL AJUSTE ---
            
            // Mantenemos la corrección de material por si acaso
            owl.traverse((child) => {
                if (child.isMesh && child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => {
                            if (mat.isMeshStandardMaterial || mat.isMeshPhysicalMaterial) {
                                mat.metalness = 0.0; 
                                mat.roughness = 0.8; 
                                mat.needsUpdate = true; 
                            }
                        });
                    } 
                    else if (child.material.isMeshStandardMaterial || child.material.isMeshPhysicalMaterial) {
                        child.material.metalness = 0.0;
                        child.material.roughness = 0.8;
                        child.material.needsUpdate = true;
                    }
                }
            });

            gameObjectsGroup.add(owl);
            interactablesGroup.add(owl);
            
            console.log("Búho cargado en la escena 1 (Posición y rotación ajustadas).");
            
        } catch(e) { console.warn("No se pudo cargar owl.glb. Omitiendo.", e); }
    }
    // --- FIN BLOQUE AREA 1 ---
    
    // 5. Cargar objetos del juego si estamos en el bosque
    if (areaName === 'area2') {
      console.log("Cargando objetos del juego para el bosque...");
      
      // (Las listas ya se limpiaron arriba)

      // --- Carga de animales (Vertebrados) ---
      try {
          const rabbitGLTF = await gltfLoader.loadAsync(rabbitUrl);
          const rabbit = rabbitGLTF.scene;
          rabbit.name = "animal_rabbit"; 
          rabbit.position.set(5, 0, 5); 
          rabbit.scale.set(0.3, 0.3, 0.3); 
          gameObjectsGroup.add(rabbit); 
          interactablesGroup.add(rabbit);
          loadedVertebrates.add("animal_rabbit"); 
      } catch(e) { console.warn("No se pudo cargar rabbit.glb"); }

      try {
          const foxGLTF = await gltfLoader.loadAsync(foxUrl);
          const fox = foxGLTF.scene;
          fox.name = "animal_fox"; 
          fox.position.set(-8, 0, -10); 
          fox.scale.set(8, 8, 8); 
          gameObjectsGroup.add(fox);
          interactablesGroup.add(fox);
          loadedVertebrates.add("animal_fox"); 
      } catch(e) { console.warn("No se pudo cargar fox.glb"); }

      try {
          const bearGLTF = await gltfLoader.loadAsync(bearUrl);
          const bear = bearGLTF.scene;
          bear.name = "animal_bear";
          bear.position.set(0, 0, -15); 
          bear.scale.set(1, 1, 1); 
          gameObjectsGroup.add(bear);
          interactablesGroup.add(bear);
          loadedVertebrates.add("animal_bear"); 
      } catch(e) { console.warn("No se pudo cargar bear.glb. Omitiendo."); }
      
      try {
          const horseGLTF = await gltfLoader.loadAsync(horseUrl);
          const horse = horseGLTF.scene;
          horse.name = "animal_horse";
          horse.position.set(10, 0, 15);
          horse.scale.set(1, 1, 1);
          gameObjectsGroup.add(horse);
          interactablesGroup.add(horse);
          loadedVertebrates.add("animal_horse"); 
      } catch(e) { console.warn("No se pudo cargar horse.glb. Omitiendo."); }
      
      try {
          const monkeyGLTF = await gltfLoader.loadAsync(monkeyUrl);
          const monkey = monkeyGLTF.scene;
          monkey.name = "animal_monkey";
          monkey.position.set(-18, 0.5, 5); 
          monkey.scale.set(2, 2, 2); 
          gameObjectsGroup.add(monkey);
          interactablesGroup.add(monkey);
          loadedVertebrates.add("animal_monkey"); 
      } catch(e) { console.warn("No se pudo cargar monkey.glb. Omitiendo."); }
      
      try {
          const toadGLTF = await gltfLoader.loadAsync(toadUrl);
          const toad = toadGLTF.scene;
          toad.name = "animal_toad";
          toad.position.set(-13, 0, 18); 
          toad.scale.set(3, 3, 3); 
          gameObjectsGroup.add(toad);
          interactablesGroup.add(toad);
          loadedVertebrates.add("animal_toad"); 
      } catch(e) { console.warn("No se pudo cargar toad.glb. Omitiendo."); }
      
      try {
          const snakeGLTF = await gltfLoader.loadAsync(snakeUrl);
          const snake = snakeGLTF.scene;
          snake.name = "animal_snake";
          snake.position.set(0, 0, 20); 
          snake.scale.set(0.1, 0.15, 0.1); 
          gameObjectsGroup.add(snake);
          interactablesGroup.add(snake);
          loadedVertebrates.add("animal_snake"); 
      } catch(e) { console.warn("No se pudo cargar snake.glb. Omitiendo."); }
      
      // --- Carga de animales (Invertebrados) ---
      try {
          const butterflyGLTF = await gltfLoader.loadAsync(butterflyUrl);
          const butterfly = butterflyGLTF.scene;
          butterfly.name = "animal_butterfly"; 
          butterfly.position.set(2, 1, 3); 
          butterfly.scale.set(0.1, 0.1, 0.1); 
          gameObjectsGroup.add(butterfly);
          interactablesGroup.add(butterfly);
          loadedInvertebrates.add("animal_butterfly"); 
      } catch(e) { console.warn("No se pudo cargar butterfly.glb. Omitiendo."); }
      
      try {
          const spiderGLTF = await gltfLoader.loadAsync(spiderUrl);
          const spider = spiderGLTF.scene;
          spider.name = "animal_spider"; 
          spider.position.set(17, 0, 25); 
          spider.scale.set(1.5, 1.5, 1.5); 
          gameObjectsGroup.add(spider);
          interactablesGroup.add(spider);
          loadedInvertebrates.add("animal_spider"); 
      } catch(e) { console.warn("No se pudo cargar spider.glb. Omitiendo."); }


      // --- Carga de comidas (pueden ir juntas) ---
      try {
          const carrotGLTF = await gltfLoader.loadAsync(carrotUrl);
          const carrot = carrotGLTF.scene;
          carrot.name = "food_carrot"; 
          carrot.position.set(15, 0, 9); 
          carrot.scale.set(0.002, 0.002, 0.002); 
          gameObjectsGroup.add(carrot);
          interactablesGroup.add(carrot);

          const berriesGLTF = await gltfLoader.loadAsync(berriesUrl);
          const berries = berriesGLTF.scene;
          berries.name = "food_berries"; 
          berries.position.set(-10, 0, -14); 
          berries.scale.set(0.0005, 0.0005, 0.0005); 
          gameObjectsGroup.add(berries);
          interactablesGroup.add(berries);

          const appleGLTF = await gltfLoader.loadAsync(appleUrl);
          const apple = appleGLTF.scene;
          apple.name = "food_apple"; 
          apple.position.set(10, 0.2, 9.5); 
          apple.scale.set(0.003, 0.003, 0.003); 
          gameObjectsGroup.add(apple);
          interactablesGroup.add(apple);
          
          const bananaGLTF = await gltfLoader.loadAsync(bananaUrl);
          const banana = bananaGLTF.scene;
          banana.name = "food_banana"; 
          banana.position.set(10, 0.1, 6.5); 
          banana.scale.set(0.002, 0.002, 0.002); 
          gameObjectsGroup.add(banana);
          interactablesGroup.add(banana);

      } catch(e) { console.error("Error al cargar comidas", e); }


      console.log("Objetos del juego cargados.");
      console.log("Vertebrados cargados:", ...loadedVertebrates);
      console.log("Invertebrados cargados:", ...loadedInvertebrates);
    }
    
    console.log('Entorno cargado correctamente para:', areaName);

    // 6. Mover el personaje a la nueva área
    teleportToArea(areaName);

  } catch (err) {
      console.error("Error fatal durante la carga del entorno:", err);
  } finally {
      // --- ¡OCULTAR LA PANTALLA DE CARGA! ---
      // Esto se ejecuta SIEMPRE, ya sea que la carga falle o tenga éxito.
      if (areaName === 'area2') {
          showLoadingScreen(false);
      }
  }
}

// --- ¡LÓGICA DEL JUEGO MODIFICADA! ---
function onSphereInteract(mesh) {
  console.log('Interacción con:', mesh.name);
  const name = mesh.name.toLowerCase();

  // --- 1. Lógica de Teletransporte (Esferas) - MANTENIDA ---
  if (name.includes('sphere') || name.includes('esfera')) {
    
    const sphereIndexInGroup = interactablesGroup.children.findIndex(child => child === mesh);

    if (sphereIndexInGroup === 2) { 
        console.log('--- Activando Teletransporte ---');

        currentQuestAnimal = null; 
        questVertebrateReunionActive = false; 
        vertebratesToFind.clear(); 
        
        if (currentArea === 'area1') {
          console.log("Cargando Bosque (area2)...");
          loadEnvironment(forestUrl, 'area2').catch((err) => {
              console.error("Error al cargar el bosque:", err);
          });
        } else {
          console.log("Cargando Escena 4 (area1)...");
          loadEnvironment(url, 'area1').catch((err) => {
              console.error("Error al cargar la escena 4:", err);
          });
        }
    } else {
        console.log(`Esfera ${sphereIndexInGroup + 1} no es la esfera de teletransporte (Índice esperado: 3).`);
    }
    
    clearSelection(); 
    return; 
  }

  // --- ¡NUEVO! Lógica del Portal de Salida ---
  else if (name.startsWith('portal_exit')) {
      console.log("Usando portal de salida. Volviendo a area1...");
      loadEnvironment(url, 'area1').catch((err) => {
          console.error("Error al cargar la escena 4:", err);
      });
      clearSelection();
      return;
  }
  // --- FIN DEL BLOQUE DEL PORTAL ---


  // --- 2. Lógica de Misión de Comida (Presionar Enter en Comida) ---
  if (name.startsWith('food_') || 
      (currentQuestAnimal === 'animal_toad' && name === 'animal_spider') ||
      (currentQuestAnimal === 'animal_snake' && name === 'animal_toad')) 
  {
      let feedback = "Encuentra un animal primero."; 

      // Misiones de 'food_'
      if (currentQuestAnimal === 'animal_rabbit' && name === 'food_carrot') {
          feedback = "¡Gracias! Vuelve a hablar con Rabbit para mas misiones.";
          questRabbitFoodDone = true; 
          currentQuestAnimal = null; 
      } 
      else if (currentQuestAnimal === 'animal_fox' && name === 'food_berries') {
          feedback = "¡Gracias! Vuelve a hablar con Fox para mas misiones.";
          questFoxFoodDone = true; 
          currentQuestAnimal = null; 
      }
      else if (currentQuestAnimal === 'animal_horse' && name === 'food_apple') {
          feedback = "¡Gracias! Vuelve a hablar con Horse para mas misiones.";
          questHorseFoodDone = true; 
          currentQuestAnimal = null; 
      } 
      else if (currentQuestAnimal === 'animal_monkey' && name === 'food_banana') {
          feedback = "¡Gracias! Vuelve a hablar con Monkey para mas misiones.";
          questMonkeyFoodDone = true; 
          currentQuestAnimal = null; 
      }
      
      // Misiones de 'animal_' como comida
      else if (currentQuestAnimal === 'animal_toad' && name === 'animal_spider') {
          feedback = "¡Gracias! Vuelve a hablar con Toad para mas misiones.";
          questToadFoodDone = true; 
          currentQuestAnimal = null; 
      }
      else if (currentQuestAnimal === 'animal_snake' && name === 'animal_toad') {
          feedback = "¡Gracias! Vuelve a hablar con Snake para mas misiones.";
          questSnakeFoodDone = true; 
          currentQuestAnimal = null; 
      }
      
      // Si la comida es incorrecta
      else if (currentQuestAnimal !== null) {
          feedback = "¡Oh no! Este no es el alimento correcto. Intenta de nuevo.";
      }
      
      interactionPrompt.innerText = feedback;
      showInteractionPrompt(true);
      
      // --- ¡LÓGICA DE VALIDACIÓN AÑADIDA AQUÍ! ---
      setTimeout(() => {
          clearSelection();
          checkAllMissionsComplete(); // Chequea si el juego terminó
      }, 2500);
      return; 
  }

  // --- 3. Lógica de Animales (Presionar Enter en Animal) ---
  if (name.startsWith('animal_')) {
      let feedback = "";

      // A. Si la Misión de Reunión ESTÁ ACTIVA
      if (questVertebrateReunionActive) {
          
          if (loadedVertebrates.has(name)) { 
              if (vertebratesToFind.has(name)) {
                  vertebratesToFind.delete(name); // ¡Lo encontramos!
                  
                  // --- ¡LÓGICA DE FIN DE MISIÓN (REVERTIDA A LA VERSIÓN SIMPLE)! ---
                  if (vertebratesToFind.size === 0) {
                      feedback = `¡Genial! ${name.split('_')[1]} encontrado. ¡Completaste la misión de reunión!`;
                      questVertebrateReunionComplete = true; // Marca la misión como hecha
                      questVertebrateReunionActive = false;
                      // (La llamada a checkAllMissionsComplete() se hará en el setTimeout de abajo)
                  } else {
                      feedback = `¡Genial! ${name.split('_')[1]} encontrado. Faltan ${vertebratesToFind.size}.`;
                  }
              } else {
                  feedback = `Ya encontraste a ${name.split('_')[1]}. Sigue buscando.`;
              }
          } else {
              feedback = "¡Ese no es un vertebrado! Sigue buscando.";
          }
      } 
      
      // B. Si la Misión de Reunión NO ESTÁ ACTIVA
      else {
          // B1. Si el animal ya hizo su comida
          if ((name === 'animal_rabbit' && questRabbitFoodDone) || 
              (name === 'animal_fox' && questFoxFoodDone) ||
              (name === 'animal_horse' && questHorseFoodDone) ||
              (name === 'animal_monkey' && questMonkeyFoodDone) ||
              (name === 'animal_toad' && questToadFoodDone) ||
              (name === 'animal_snake' && questSnakeFoodDone)) {
              
              if (questVertebrateReunionComplete) {
                  // Cambiamos el mensaje para que sea coherente
                  feedback = "gracias nos ayudaste a recuperar nuestro brillo";
              } 
              else if (questVertebrateReunionOffered) {
                  feedback = "¡Misión reactivada! ¡Sigue buscando a mis amigos!";
                  questVertebrateReunionActive = true; 
                  vertebratesToFind = new Set(loadedVertebrates);
                  vertebratesToFind.delete(name);
              }
              else {
                  // ¡INICIAR MISIÓN DE REUNIÓN! (SOLO LA PRIMERA VEZ)
                  feedback = "¡Busca a mis amigos vertebrados y haz click en ellos!";
                  questVertebrateReunionActive = true; 
                  questVertebrateReunionOffered = true; 
                  vertebrateQuestGiver = name; 
                  
                  vertebratesToFind = new Set(loadedVertebrates);
                  vertebratesToFind.delete(name); 
              }
          }
          // B2. Si estamos aceptando una misión de comida
          else if (currentQuestAnimal === null && 
                   (name === 'animal_rabbit' || name === 'animal_fox' || name === 'animal_horse' ||
                    name === 'animal_monkey' || name === 'animal_toad' || name === 'animal_snake')) {
              currentQuestAnimal = name;
              feedback = "¡Misión aceptada! Busca mi comida.";
          }
          // B3. Si intentamos aceptar una misión teniendo otra activa
          else if (currentQuestAnimal !== null && currentQuestAnimal !== name) {
              feedback = "¡Termina la otra misión primero!";
          }
          // B4. Si solo es un animal genérico (oso, mariposa, araña sin misión)
          else {
              feedback = `Hola, soy ${name.split('_')[1]}.`;
          }
      }

      // --- ¡LÓGICA DE VALIDACIÓN AÑADIDA AQUÍ! ---
      interactionPrompt.innerText = feedback;
      showInteractionPrompt(true); 
      setTimeout(() => {
          clearSelection();
          // Si acabamos de completar la misión de vertebrados, chequea si el juego terminó
          if (questVertebrateReunionComplete) {
              checkAllMissionsComplete();
          }
      }, 1000);
  }
}

// --- Carga inicial de la escena ---
loadEnvironment(url, 'area1').catch((error) => {
  console.error("Error cargando la escena inicial:", error);
});


// --- Raycaster para clicks en esferas ---
const clickRaycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let selectedMesh = null;

const interactionPrompt = document.createElement('div');
interactionPrompt.className = 'interaction-prompt';
interactionPrompt.innerText = 'ingresar (Enter)';
document.body.appendChild(interactionPrompt);

function showInteractionPrompt(show) {
  if (show) interactionPrompt.classList.add('show');
  else interactionPrompt.classList.remove('show');
}

// --- ¡FUNCIÓN selectMesh REESTRUCTURADA CON PRIORIDAD CORREGIDA! ---
function selectMesh(mesh) {
  // 1. Limpieza inicial
  if (selectedMesh) {
      clearSelection();
  }

  selectedMesh = mesh; 
  const name = mesh.name.toLowerCase();

  let dialog = "ingresar (Enter)"; // Default

  // --- DIÁLOGOS AL HACER CLICK ---

  // 1. Si es un ANIMAL o COMIDA
  if (name.startsWith('animal_') || name.startsWith('food_')) {
      
      // --- LÓGICA DE DIÁLOGO REORDENADA ---

      // P0: ¿Es esto comida para una misión activa?
      if (currentQuestAnimal === 'animal_toad' && name === 'animal_spider') {
          dialog = "¿Atrapar la araña para el sapo? (Enter)";
      }
      else if (currentQuestAnimal === 'animal_snake' && name === 'animal_toad') {
          dialog = "¿Atrapar al sapo para la serpiente? (Enter)";
      }
      else if (name.startsWith('food_')) {
          dialog = '¿Recoger esto? (Enter)';
      }

      // P1: ¿Está la misión de vertebrados ACTIVA AHORA MISMO? (MÁXIMA PRIORIDAD)
      else if (questVertebrateReunionActive) {
          if (loadedVertebrates.has(name)) {
              if (vertebratesToFind.has(name)) {
                   dialog = `¡Soy un vertebrado! (Enter para seleccionar)`;
              } else {
                   dialog = `Ya me encontraste. Sigue buscando.`;
              }
          } else {
              dialog = "¡Yo no soy un vertebrado! (Enter)";
          }
      }

      // P2: ¿Hay una misión de comida activa? (SEGUNDA PRIORIDAD)
      else if (currentQuestAnimal !== null) {
          if (name === currentQuestAnimal) {
              dialog = "Estoy esperando mi comida...";
          } else if (name.startsWith('animal_')) { // Si es un animal con misión
              dialog = "¡Termina la otra misión primero!";
          }
      }
      
      // P3: ¿Este animal (Rabbit) tiene una misión de comida SIN HACER?
      else if (name === 'animal_rabbit' && !questRabbitFoodDone) {
          dialog = "Soy herbívoro... (Enter para aceptar misión)";
      }
      
      // P4: ¿Este animal (Fox) tiene una misión de comida SIN HACER?
      else if (name === 'animal_fox' && !questFoxFoodDone) {
          dialog = "Soy omnívoro... (Enter para aceptar misión)";
      }

      // P4B: ¿Este animal (Horse) tiene una misión de comida SIN HACER?
      else if (name === 'animal_horse' && !questHorseFoodDone) {
          dialog = "Me encantan las manzanas... (Enter para aceptar misión)";
      }
      
      // P4C: ¿Este animal (Monkey) tiene una misión de comida SIN HACER?
      else if (name === 'animal_monkey' && !questMonkeyFoodDone) {
          dialog = "¡Busco bananas! (Enter para aceptar misión)";
      }
      
      // P4D: ¿Este animal (Toad) tiene una misión de comida SIN HACER?
      else if (name === 'animal_toad' && !questToadFoodDone) {
          dialog = "¡Cazaré esa araña! (Enter para aceptar misión)";
      }
      
      // P4E: ¿Este animal (Snake) tiene una misión de comida SIN HACER?
      else if (name === 'animal_snake' && !questSnakeFoodDone) {
          dialog = "¡Me comeré a ese sapo! (Enter para aceptar misión)";
      }

      // P6: OFRECER la misión de vertebrados (¡ORDEN CAMBIADO!)
      // (Se comprueba ANTES de ver si el juego está completo)
      
      // P6A: Rabbit ofrece
      else if (name === 'animal_rabbit' && questRabbitFoodDone) {
          if (questVertebrateReunionOffered && vertebrateQuestGiver === name) {
              dialog = "¡Reanudar la búsqueda! (Enter)"; 
          } else if (questVertebrateReunionOffered && vertebrateQuestGiver !== name) {
              dialog = "¡Gracias por ayudar a mi amigo!";
          } else { 
              dialog = "¡Ayúdame a reunir a mis amigos! (Enter)"; 
          }
      }
      
      // P6B: Fox ofrece
      else if (name === 'animal_fox' && questFoxFoodDone) {
          if (questVertebrateReunionOffered && vertebrateQuestGiver === name) {
              dialog = "¡Reanudar la búsqueda! (Enter)";
          } else if (questVertebrateReunionOffered && vertebrateQuestGiver !== name) {
              dialog = "¡Gracias por ayudar a mi amigo!";
          } else { 
              dialog = "¡Ayúdame a reunir a mis amigos! (Enter)";
          }
      }

      // P6C: Horse ofrece
      else if (name === 'animal_horse' && questHorseFoodDone) {
          if (questVertebrateReunionOffered && vertebrateQuestGiver === name) {
              dialog = "¡Reanudar la búsqueda! (Enter)";
          } else if (questVertebrateReunionOffered && vertebrateQuestGiver !== name) {
              dialog = "¡Gracias por ayudar a mi amigo!";
          } else { 
              dialog = "¡Ayúdame a reunir a mis amigos! (Enter)";
          }
      }
      
      // P6D: Monkey ofrece
      else if (name === 'animal_monkey' && questMonkeyFoodDone) {
          if (questVertebrateReunionOffered && vertebrateQuestGiver === name) {
              dialog = "¡Reanudar la búsqueda! (Enter)";
          } else if (questVertebrateReunionOffered && vertebrateQuestGiver !== name) {
              dialog = "¡Gracias por ayudar a mi amigo!";
          } else { 
              dialog = "¡Ayúdame a reunir a mis amigos! (Enter)";
          }
      }
      
      // P6E: Toad ofrece
      else if (name === 'animal_toad' && questToadFoodDone) {
          if (questVertebrateReunionOffered && vertebrateQuestGiver === name) {
              dialog = "¡Reanudar la búsqueda! (Enter)";
          } else if (questVertebrateReunionOffered && vertebrateQuestGiver !== name) {
              dialog = "¡Gracias por ayudar a mi amigo!";
          } else { 
              dialog = "¡Ayúdame a reunir a mis amigos! (Enter)";
          }
      }
      
      // P6F: Snake ofrece
      else if (name === 'animal_snake' && questSnakeFoodDone) {
          if (questVertebrateReunionOffered && vertebrateQuestGiver === name) {
              dialog = "¡Reanudar la búsqueda! (Enter)";
          } else if (questVertebrateReunionOffered && vertebrateQuestGiver !== name) {
              dialog = "¡Gracias por ayudar a mi amigo!";
          } else { 
              dialog = "¡Ayúdame a reunir a mis amigos! (Enter)";
          }
      }
      
      // P5: ¿Está la misión de vertebrados COMPLETA? (¡ORDEN CAMBIADO!)
      // (Si todas las misiones de comida y la de vertebrados están hechas)
      else if (questVertebrateReunionComplete) {
          dialog = "Gracias por ayudarnos a recuperar nuestro brillo, puedes regresar";
      }
      
      // P7: Animal genérico (Oso, Araña, etc.)
      else if (name.startsWith('animal_')) {
          dialog = `Hola, soy ${name.split('_')[1]}.`;
      }
  } 
  
  // 3. Si es una ESFERA
  else if (name.includes('sphere')) {
       const sphereIndexInGroup = interactablesGroup.children.findIndex(child => child === mesh);
       if (sphereIndexInGroup === 2) {
           dialog = '¿Viajar al reino? (Enter)';
       } else {
           dialog = `No debes ingresar aquí`;
       }
  }
  
  // --- ¡NUEVO! Diálogo para el Portal de Salida ---
  else if (name.startsWith('portal_exit')) {
      dialog = "Volver al santuario? (Enter)";
  }

  
  interactionPrompt.innerText = dialog;
  showInteractionPrompt(true); 
  
  // Lógica de resaltado
  try {
    if (mesh.material && mesh.material.emissive) {
      mesh.userData._prevEmissive = mesh.material.emissive.clone 
        ? mesh.material.emissive.clone() 
        : mesh.material.emissive;
      mesh.material.emissive = new THREE.Color(0x333333);
    } else if (mesh.material && mesh.material.color) {
      mesh.userData._prevColor = mesh.material.color.clone 
        ? mesh.material.color.clone() 
        : mesh.material.color;
      mesh.material.color = new THREE.Color(0xffff00);
    }
  } catch (e) {}
}


// --- ¡FUNCIÓN clearSelection ACTUALIZADA! ---
function clearSelection() {
  if (selectedMesh) {
    try {
      if (selectedMesh.userData._prevEmissive) 
        selectedMesh.material.emissive = selectedMesh.userData._prevEmissive;
      if (selectedMesh.userData._prevColor) 
        selectedMesh.material.color = selectedMesh.userData._prevColor;
    } catch (e) {}
  }
  selectedMesh = null;
  showInteractionPrompt(false); 
  interactionPrompt.innerText = 'ingresar (Enter)';
  
  // --- ¡NUEVO! Resetea el tamaño de la fuente ---
  interactionPrompt.style.fontSize = ''; 
}

// --- ¡NUEVA FUNCIÓN PARA DIÁLOGO SECUENCIAL! ---
function showNextDialogueMessage() {
    // 1. Revisa si quedan mensajes en la lista
    if (currentDialogueIndex < introDialogueMessages.length) {
        
        // Toma el siguiente mensaje
        const dialog = introDialogueMessages[currentDialogueIndex];
        
        // 2. Prepara el prompt
        interactionPrompt.style.fontSize = '1.5em'; 
        interactionPrompt.innerText = dialog + " (Enter)"; // Añadimos (Enter)
        showInteractionPrompt(true); 
        
        // 3. Avanza al siguiente índice para la próxima vez
        currentDialogueIndex++;
        
    } else {
        // 4. Si no quedan mensajes, termina el diálogo
        clearSelection(); // Oculta el prompt y resetea el tamaño
        isIntroDialogueActive = false;
        console.log("Diálogo inicial completado.");
    }
}

window.addEventListener('pointerdown', (event) => {

    if ((welcomeScreenElement && welcomeScreenElement.style.display !== 'none') ||
        (controlsModalElement && controlsModalElement.style.display !== 'none')) {
        return; // Detiene la ejecución aquí
    }
    // --- FIN DE LA SOLUCIÓN ---
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    clickRaycaster.setFromCamera(pointer, camera);
    
    const intersects = clickRaycaster.intersectObjects(interactablesGroup.children, true); 

    if (intersects.length > 0) {
        let intersectedMesh = intersects[0].object;
        
        let parentInteractable = intersectedMesh;
        while (parentInteractable) {
            if (interactablesGroup.children.includes(parentInteractable)) {
                
                if (selectedMesh === parentInteractable) {
                    clearSelection();
                    return; 
                }
                
                clearSelection(); 
                selectMesh(parentInteractable); 
                return; 
            }
            parentInteractable = parentInteractable.parent;
        }
    }

    clearSelection();
});


window.addEventListener('keydown', (e) => {
  // Solo nos interesa la tecla Enter
  if (e.key !== 'Enter' && e.code !== 'Enter') return;
  
  // --- ¡NUEVA LÓGICA DE DIÁLOGO INICIAL! ---
  // PRIORIDAD 1: ¿Estamos en el diálogo inicial?
  if (isIntroDialogueActive) {
      e.preventDefault(); // Evita que se active otra cosa
      showNextDialogueMessage(); // Muestra el siguiente mensaje
      return; // ¡Importante! No sigas ejecutando
  }
  // --- FIN DE LA NUEVA LÓGICA ---

  // PRIORIDAD 2: ¿Hay un objeto seleccionado? (Tu lógica anterior)
  if (selectedMesh) {
    onSphereInteract(selectedMesh);
    e.preventDefault();
  }
});

// --- Cargar personaje ---
X_BotLoader().then((loadedBot) => {
  bot = loadedBot;

  bot.position.set(0, 10, 0); 
  bot.rotation.y = Math.PI;
  // --- ¡AJUSTE DE TAMAÑO DE PERSONAJE! ---
  bot.scale.set(0.008, 0.008, 0.008); // (Ajustado como pediste)
  scene.add(bot);

  const cameraOffset = new THREE.Vector3(0, -6, -5);
  cameraOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
  camera.position.copy(bot.position).add(cameraOffset);
  camera.lookAt(bot.position.clone().add(new THREE.Vector3(0, 2, 0)));

  characterController.addController(keyController);
  characterController.addController(moveController);
  characterController.addController(animationController);
  characterController.addController(modelController);
  characterController.addController(rotationController);
  
  // characterController.addController(cRotationController);
  
  characterController.addCharacter(bot);
  characterController.start();
});


const rotationSpeed = 0.05;
const cameraDistance = 5;
const cameraHeight = 2;

loopMachine.addCallback(() => {
  if (bot && environmentRoot) { 
    if (keyListener.isPressed(keyCode.LEFT)) {
      bot.rotation.y += rotationSpeed;
      cRotationController.cRotation.y = bot.rotation.y; 
    }
    if (keyListener.isPressed(keyCode.RIGHT)) {
      bot.rotation.y -= rotationSpeed;
      cRotationController.cRotation.y = bot.rotation.y;
    }

    // --- ¡CORRECCIÓN DE ERROR DE SONIDO DE PASOS (PARTE 2)! ---
    // Usamos KEY_W, KEY_A, KEY_S, KEY_D como está en tu archivo KeyCode.js
    const isMoving = keyListener.isPressed(keyCode.KEY_W) || 
                     keyListener.isPressed(keyCode.KEY_A) || 
                     keyListener.isPressed(keyCode.KEY_S) || 
                     keyListener.isPressed(keyCode.KEY_D);
    
    // --- ¡CORRECCIÓN DE LÓGICA DE PASOS (PARTE 3)! ---
    // Esta lógica reproduce en bucle MIENTRAS te mueves
    // y se detiene CUANDO te detienes.
    if (isMoving) {
        if (!footstepSound.isPlaying) {
            footstepSound.play();
        }
    } else {
        if (footstepSound.isPlaying) {
            footstepSound.stop();
        }
    }
    // --- FIN LÓGICA DE SONIDO ---

    velocityY += gravity * 0.1;
    bot.position.y += velocityY;

    const rayOrigin = bot.position.clone().add(new THREE.Vector3(0, 50, 0)); 
    raycaster.set(rayOrigin, down);
    
    const intersects = raycaster.intersectObjects(walkableGroundGroup.children, true); 
    
    let groundY = null;
    
    if (intersects.length > 0) {
      const botHeightOffset = 0; 
      groundY = intersects[0].point.y + botHeightOffset; 
    } else {
      const currentAreaData = areas[currentArea];
      if (currentAreaData) {
        groundY = currentAreaData.floorY;
        console.warn('⚠ Raycaster falló, usando floorY del área:', groundY);
      }
    }
    
    if (groundY !== null && bot.position.y <= groundY) {
      bot.position.y = groundY;
      velocityY = 0;
    }

    // Actualización de cámara
    const cameraOffset = new THREE.Vector3(0, cameraHeight, -cameraDistance);
    cameraOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), bot.rotation.y);
    camera.position.copy(bot.position).add(cameraOffset);
    
    const lookAtTarget = bot.position.clone().add(new THREE.Vector3(0, 1, 0));
    camera.lookAt(lookAtTarget);
  }

  interactablesGroup.children.forEach((item) => {
    if (item.name.toLowerCase().includes('sphere') && item.isMesh) {
      item.rotation.y += 0.02;
    }
    
    // --- ¡NUEVO! Animación del portal ---
    if (item.name.toLowerCase() === 'portal_exit') {
        item.rotation.y += 0.01;
        item.rotation.x += 0.01;
    }
  });

  if (keyListener.isPressed(keyCode.ENTER)) cube.rotation.y += 0.01;

  renderer.render(scene, camera);
});


// --- SECCIÓN DE CONTROL DE INICIO DEL JUEGO Y PANTALLA DE BIENVENIDA ---
const welcomeScreenElement = document.getElementById('welcomeScreen');
const startButtonElement = document.getElementById('startButton');

// --- ¡NUEVO! Elementos del Modal de Controles ---
const controlsButtonElement = document.getElementById('controlsButton');
const controlsModalElement = document.getElementById('controlsModal');
const closeControlsSpanElement = document.getElementById('closeControlsSpan');
const closeControlsButtonElement = document.getElementById('closeControlsButton');
// --- FIN DE LO NUEVO ---

const container = document.getElementById('bg');
if (container) {
    container.appendChild(renderer.domElement);
} else {
    document.body.appendChild(renderer.domElement);
    renderer.domElement.id = 'bg'; 
}



function startGame() {
    if (welcomeScreenElement) {
        welcomeScreenElement.style.display = 'none';
    }

    // --- ¡AQUÍ ESTÁ LA CORRECCIÓN! ---
    // Nos aseguramos de que el modal de controles también esté
    // oculto con un estilo en línea, para que la lógica
    // del 'pointerdown' (clic) funcione correctamente.
    if (controlsModalElement) {
        controlsModalElement.style.display = 'none';
    }
    // --- FIN DE LA CORRECCIÓN ---

    resize.start(renderer);
    loopMachine.start();
    keyListener.start();
    
    // "Despierta" el motor de audio.
    if (listener.context.state === 'suspended') {
        listener.context.resume();
        console.log("AudioContext reanudado por startGame.");
    }

    console.log("Juego Iniciado!");

    // ¡AQUÍ PUEDES AÑADIR/EDITAR TUS DIÁLOGOS!
    introDialogueMessages = [
        "Owl: Te llamamos aqui porque necesitamos tu ayuda...",
        "Owl: ...queremos recuperar el brillo de los reinos.",
        "Owl: ...esa esfera roja brillante es el reino animal.",
        "Owl: Entra en él, ayuda a aquellos que lo necesitan y recupera la luz."
        // Puedes añadir más líneas aquí:
        // "Owl: ¡Ten cuidado!"
    ];
    
    currentDialogueIndex = 0; // Empezamos desde el primer mensaje
    isIntroDialogueActive = true; // Activamos el modo diálogo
    
    // Mostramos el primer mensaje inmediatamente
    // (Usamos un pequeño retraso de 100ms para asegurar que todo cargó)
    setTimeout(showNextDialogueMessage, 100); 
    
    // --- FIN DEL DIÁLOGO ---
}

// --- ¡LÓGICA DE BOTONES DEL MENÚ DE INICIO ACTUALIZADA! ---
if (startButtonElement && controlsButtonElement && controlsModalElement) {
    
    // 1. Botón de Iniciar Juego
    startButtonElement.addEventListener('click', startGame);
    
    // 2. Botón de Controles (para ABRIR el modal)
    controlsButtonElement.addEventListener('click', () => {
        controlsModalElement.style.display = 'flex'; // 'flex' porque lo usamos para centrar
    });

    // 3. Botón 'X' (para CERRAR el modal)
    closeControlsSpanElement.addEventListener('click', () => {
        controlsModalElement.style.display = 'none';
    });

    // 4. Botón 'Cerrar' (para CERRAR el modal)
    closeControlsButtonElement.addEventListener('click', () => {
        controlsModalElement.style.display = 'none';
    });

    // 5. Clic fuera del modal (para CERRAR el modal)
    window.addEventListener('click', (event) => {
        if (event.target == controlsModalElement) {
            controlsModalElement.style.display = 'none';
        }
    });

    // Detenemos el juego al inicio
    loopMachine.stop();
    keyListener.stop(); 
    resize.stop(); 
    
} else {
    // Si no hay pantalla de bienvenida, inicia el juego directamente
    startGame();
}
