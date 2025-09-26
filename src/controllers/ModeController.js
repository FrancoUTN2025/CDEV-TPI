const mode = {
    "IDLE" : 0,
    "STEALTH" : 1,
    "RUNNER" : 2,
    "SHOOTER" : 3
}

class ModelController{
    constructor(){

    }
    init(characterController){
        this.state = characterController.state;
        this.state["mode"] = mode.IDLE;
    }
    tick(){

    }
}

const modelController = new ModelController();
export default modelController;
export { ModelController , mode};