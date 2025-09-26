import animationBehaviour from "../basic/animations/AnimationBehaviour.js";
import TransitionHandler from "../basic/animations/TransitionHandler.js";
import { mode } from "./ModeController.js";

class AnimationController {
    constructor(){
        this.state = null
        this.transitionHandler = null
    }
    init(characterController){
        this.state = characterController.state;
        if (!this.transitionHandler) {
            this.transitionHandler = new TransitionHandler(characterController.character, "local");
        }
        this.transitionHandler.start();
    }
    stop(){
        this.transitionHandler.stop();
    }
    tick(){
        const speed = 1.2
        if(this.state.mode == mode.IDLE){
            if(false){
            } else if(this.state.translation.x == 1){
                this.transitionHandler.action(animationBehaviour.left, speed);
            } else if(this.state.translation.x == -1){
                this.transitionHandler.action(animationBehaviour.right, speed);
            } else if(this.state.translation.y == 1){
                this.transitionHandler.action(animationBehaviour.run, speed);
            } else if(this.state.translation.y == -1){
                this.transitionHandler.action(animationBehaviour.runBack, speed);
            } else {
                this.transitionHandler.action(animationBehaviour.idle, speed);
            }
        }
        
        //cargar mas modos
    }
}
const animationController = new AnimationController();
export default animationController;
export { AnimationController };

