/*import * as THREE from 'three';
import { FBXLoader } from '../../js/libs/FBXLoader.js';

class PromiseLoader {
    constructor(loader, callback){
        this.loader = loader;
        this.callback = callback;
    }
    load(url){
        const loader = new this.loader();
        return new Promise( (resolve, reject) => {
            loader.load(url, (object) => {
                res(this.callback(object));
            });
        });
    }
}

export default PromiseLoader;
export { PromiseLoader };*/

//Nos permite homogenizar la carga de recursos, porque pueden ser de formato fbx o algun otro

import * as THREE from 'three';
import { FBXLoader } from '../../js/libs/FBXLoader.js';

class PromiseLoader {
    constructor(loaderClass, callback){
        this.loaderClass = loaderClass;  // Guardas la clase, no la instancia
        this.callback = callback;
    }
    load(url){
        const loader = new this.loaderClass();  // Usas la clase para crear la instancia
        return new Promise((resolve, reject) => {
            loader.load(url, (object) => {
                resolve(this.callback(object));  // Usas resolve, no res
            }, undefined, reject); // También pasas el reject para manejar errores
        });
    }
}

export default PromiseLoader;
export { PromiseLoader };