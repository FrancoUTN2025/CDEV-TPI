import fileList from './FileList.js';
import PromiseLoader from '../../../basic/PromiseLoader.js';
import AnimationLoader from '../../../basic/animations/AnimationLoader.js';
import * as THREE from 'three';
import { FBXLoader } from '../../../../js/libs/FBXLoader.js';

const folder = "src/models/characters/XBot/";

const urlAnimations = {}
for (const [key, value] of Object.entries(fileList)) {
    urlAnimations[key] = folder + 'animations/' + value;
}

const urlModel = folder + 'girl.fbx';

const X_BotLoader = () => {
    const animationLoader = new AnimationLoader(urlModel, urlAnimations)
    const promiseLoader = new PromiseLoader(FBXLoader, function(object){
        const scale = 0.01
        object.scale.set(scale, scale, scale);
        object.traverse( function ( child ) {
            if ( child.isMesh ) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        } );
        object.castShadow = true;
        object.receiveShadow = true;
        return object;
    })
    animationLoader.addPromiseLoader(promiseLoader);
    return animationLoader.getModelWhitAnimations();
}
export default X_BotLoader;
