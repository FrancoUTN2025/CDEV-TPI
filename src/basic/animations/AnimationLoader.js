

class AnimationLoader {
    constructor(urlModel, urlAnimations){
        this.urlModel = urlModel; //string
        this.urlAnimations = urlAnimations; //json
        this.model = null;
    }
    addPromiseLoader(promiseLoader){
        this.promiseLoader = promiseLoader;
    }
    getModelWhitAnimations(){
        return new Promise( (resolve, reject) => {
            const animationAndModelPromises = [];
            animationAndModelPromises.push(this.promiseLoader.load(this.urlModel));

            Object.keys(this.urlAnimations).forEach( strinIndex => {
                animationAndModelPromises.push(this.promiseLoader.load(this.urlAnimations[strinIndex]));
            });

            Promise.all(animationAndModelPromises).then(payload => {
                const model = payload.shift();
                const animationEmptyModels = payload;
                const animations = [];

                Object.keys(this.urlAnimations).forEach(stringIndex => {
                    animations[stringIndex*1] = animationEmptyModels.shift().animations[0];
                });
                model.animations = animations;
                resolve(model); // <-- CORRECTO
            })
        });
    }
}


export default AnimationLoader;
export { AnimationLoader };