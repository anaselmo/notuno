import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import {OBJLoader} from "three/examples/jsm/loaders/OBJLoader";
import {MTLLoader} from "three/examples/jsm/loaders/MTLLoader";

export class Loader{
    private gltfLoader = new GLTFLoader();
    private objLoader = new OBJLoader();
    private mtlLoader = new MTLLoader();

    public loadGLTF(url:string,callback:(GLTF)=>void){
        this.gltfLoader.load(
            // resource URL
            url,
            // called when the resource is loaded
            function (gltf) {
                callback(gltf);
                gltf.animations; // Array<THREE.AnimationClip>
                gltf.scene; // THREE.Group
                gltf.scenes; // Array<THREE.Group>
                gltf.cameras; // Array<THREE.Camera>
                gltf.asset; // Object
            },
            // called while loading is progressing
            function (xhr) {
                // console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
            },
            // called when loading has errors
            function (error) {
                console.error(error);
                console.log("An error happened");
            },
        );
    }

    public loadOBJ(url:string,mtlUrl:string,callback:(obj)=>void){
        this.mtlLoader.load(mtlUrl,(mtl)=>{
            mtl.preload();
            this.objLoader.setMaterials(mtl);
            
            this.objLoader.load(
                // resource URL
                url,
                // called when the resource is loaded
                function (obj) {
                    console.log(obj)
                    callback(obj);
                },
                function (xhr) {
                    // console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
                },
                // called when loading has errors
                function (error) {
                    console.error(error);
                    console.log("An error happened");
                },
            );
        })
        
    }

    public loadOBJGeometry(url:string,mtlUrl:string,callback:(obj:THREE.BufferGeometry,mat:THREE.Material)=>void){
        this.loadOBJ(url,mtlUrl,(obj)=>{
            callback(obj.children[0].geometry,obj.children[0].material)//! tendria que buscar un hijo con geometry en vez de darlo por hecho
        })
    }
}