/*import loopMachine from "src/basic/LoopMachine.js";

class TransitionHandler {
    constructor(mesh, peerId){
        this.peerId = peerId;
        this.mixer = new THREE.AnimationMixer(mesh);
        this.clock = new THREE.Clock();
        this.mes = mesh
        this.clips = mesh.animations.map(animation => {
            return this.mixer.clipAction(animation);
            })
        this.lastClip = null;
        this.interpolationTime = 0.2
        this.inProgress = false
        this.callback = null
        }
    run = () => {
        const delta = this.clock.getDelta();
        this.mixer.update(delta);
    }
    start(){
        loopMachine.addCallback(this.run)
    }
    stop(){
        loopMachine.removeCallback(this.run)
        console.log("stop transition handler", this.peerId)
    }
    onCycleFinished = () => {
        this.inProgress = false
        if(this.callback != null){
            this.callback(this.lastClip)
            this.callback = null
        } 
    }
    action(animationId, timeScale = 1, cycleFlag = false){
        if(this.inProgress) return
        if(cycleFlag){
            this.mixer.addEventListener( 'loop', this.onCycleFinished );
            this.inProgress = true
        }
        this.mixer.timeScale = timeScale
        if (this.lastClip == animationId)return
        if(this.lastClip == null){
            this.clips[animationId].play()
        } else{
            this.clips(animationId).reset().play()

        }
            
    }
}*/

import loopMachine from '../LoopMachine.js';
import * as THREE from 'three';

class TransitionHandler {
    constructor(mesh, peerId){
        this.peerId = peerId;
        this.mixer = new THREE.AnimationMixer(mesh);
        this.clock = new THREE.Clock();
        this.mes = mesh;
        this.clips = mesh.animations.map(animation => {
            const clip = this.mixer.clipAction(animation);
            clip.setLoop(THREE.LoopOnce); // Configura el loop a una sola vez por defecto
            clip.clampWhenFinished = true; // El último frame se mantiene al finalizar
            return clip;
        });
        this.lastClip = null;
        this.interpolationTime = 0.2;
        this.inProgress = false;
        this.callback = null;
    }
    run = () => {
        const delta = this.clock.getDelta();
        this.mixer.update(delta);
    }
    start(){
        loopMachine.addCallback(this.run);
    }
    stop(){
        loopMachine.removeCallback(this.run);
        console.log("stop transition handler", this.peerId);
    }
    onCycleFinished = () => {
        this.inProgress = false;
        if(this.callback != null){
            this.callback(this.lastClip);
            this.callback = null;
        } 
    }
    action(animationId, timeScale = 1, cycleFlag = false, callback = null){
        const clip = this.clips[animationId];
        if (!clip) {
            console.warn(`TransitionHandler: No animation clip found for id ${animationId}`);
            return;
        }
        clip.enabled = true;
        
        if(this.inProgress) return;
        if(this.lastClip == this.clips[animationId]) return;
        
        if(cycleFlag){
            this.mixer.addEventListener('finished', this.onCycleFinished);
            this.inProgress = true;
            this.callback = callback;
        }
        
        // Transición de la animación anterior a la nueva
        if (this.lastClip) {
            this.lastClip.fadeOut(this.interpolationTime);
        }
        
        const newClip = this.clips[animationId];
        newClip.enabled = true;
        newClip.setEffectiveTimeScale(timeScale);
        newClip.setEffectiveWeight(1.0);

        if(cycleFlag) {
            newClip.setLoop(THREE.LoopOnce);
        } else {
            newClip.setLoop(THREE.LoopRepeat);
        }

        newClip.time = 0; // Reinicia la animación al principio
        if(this.lastClip){
            newClip.fadeIn(this.interpolationTime).play();
        } else {
            newClip.play();
        }
        
        this.lastClip = newClip;
    }

    destroy(){
        this.stop();
        if (this.lastClip) {
            this.lastClip.stop();
        }
        this.mixer.uncacheRoot(this.mes);
        this.mixer.removeEventListener('finished', this.onCycleFinished);
        console.log("transition handler destroyed", this.peerId);
    }
}

export default TransitionHandler;
export { TransitionHandler };