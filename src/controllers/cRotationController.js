import * as THREE from 'three';

class CRotationController {
    constructor(peerId){
        this.peerId = peerId;
        this.collection = null;
        this.speed = 0.2; // velocidad de lerp para suavizar la rotación
    }

    init(characterController){
        this.character = characterController.character;

        // Inicializamos el estado de rotación si no existe
        if (!characterController.state.rotation) {
            characterController.state.rotation = this.character.rotation.toArray();
        }

        // Inicializamos cRotation si no existe
        if (!characterController.state.cRotation) {
            characterController.state.cRotation = this.character.rotation.clone();
        }

        this.cRotation = characterController.state.cRotation;
        this.rotation = this.character.rotation;
    }

    tick(){
        // Aplica lerp hacia la rotación deseada
        this.rotation.x = THREE.MathUtils.lerp(this.rotation.x, this.cRotation.x, this.speed);
        this.rotation.y = THREE.MathUtils.lerp(this.rotation.y, this.cRotation.y, this.speed);
        this.rotation.z = THREE.MathUtils.lerp(this.rotation.z, this.cRotation.z, this.speed);
    }

    // Método para girar el personaje (actualiza cRotation)
    rotate(deltaY){
        this.cRotation.y += deltaY;
    }
}

const cRotationController = new CRotationController();
export default cRotationController;
export { CRotationController };
