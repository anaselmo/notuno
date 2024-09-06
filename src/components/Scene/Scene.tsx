import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import Stats from "three/examples/jsm/libs/stats.module";
import { GLTF } from "three/examples/jsm/loaders/GLTFLoader";

import { CardManager } from "./CardManager";
import { Loader } from "./Loaders";

const vertexShader = `
precision highp float;

uniform float sineTime;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

attribute vec3 position;
attribute vec3 offset;
attribute vec4 color;
attribute vec4 orientationStart;
attribute vec4 orientationEnd;

varying vec3 vPosition;
varying vec4 vColor;

void main(){

  vPosition = offset * max( abs( sineTime * 2.0 + 1.0 ), 0.5 ) + position;
  vec4 orientation = normalize( mix( orientationStart, orientationEnd, sineTime ) );
  vec3 vcV = cross( orientation.xyz, vPosition );
  vPosition = vcV * ( 2.0 * orientation.w ) + ( cross( orientation.xyz, vcV ) * 2.0 + vPosition );

  vColor = color;

  gl_Position = projectionMatrix * modelViewMatrix * vec4( vPosition, 1.0 );

}
`;

const fragmentShader = `
precision highp float;

uniform float time;

varying vec3 vPosition;
varying vec4 vColor;

void main() {

  vec4 color = vec4( vColor );
  color.r += sin( vPosition.x * 10.0 + time ) * 0.5;

  gl_FragColor = color;

}

`;

function GameScene() {
  const stats = new Stats();

  const refContainer = useRef(null);
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
  });
  var scene = new THREE.Scene();
  const loader = new Loader();
  let playerCount = 5;

  loader.loadGLTF("/src/assets/models/table.glb", (gltf: GLTF) => {
    // scene.add(gltf.scene);
    gltf.scene.translateY(-4);
  });

  var playerRadius = 3.5;

  loader.loadOBJGeometry(
    "/src/assets/models/guy.obj",
    "/src/assets/models/guy.mtl",
    (geo: THREE.BufferGeometry, mat: THREE.Material) => {
      const mesh = new THREE.InstancedMesh(geo, mat, playerCount - 1);
      // scene.add(mesh);

      const dummy = new THREE.Object3D();
      for (let i = 0; i < playerCount - 1; i++) {
        var angle = Math.PI * 2 * ((i + 1) / playerCount);
        dummy.position.x = Math.sin(angle) * playerRadius;
        dummy.position.y = -2.5;
        dummy.position.z = Math.cos(angle) * playerRadius;
        dummy.rotation.y = angle + Math.PI;
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
    },
  );

  var cardCount = 1;
  var cardMesh = null;
  loader.loadOBJGeometry(
    "/src/assets/models/card.obj",
    "/src/assets/models/card.mtl",
    (geo: THREE.BufferGeometry, mat: THREE.Material) => {
      const loader = new THREE.TextureLoader();
      const texture = loader.load("src/assets/colorAtlas.png");
      const texturedMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        map: texture,
      });
      cardMesh = new THREE.InstancedMesh(geo, texturedMat, cardCount);
      // scene.add(cardMesh);

      const dummy = new THREE.Object3D();
      for (let i = 0; i < cardCount; i++) {
        dummy.position.x = Math.random() * 4 - 2;
        dummy.position.y = Math.random() * 4 - 2;
        dummy.position.z = Math.random() * 4 - 2;
        dummy.rotation.x = Math.random();
        dummy.rotation.y = Math.random();
        dummy.rotation.z = Math.random();
        dummy.updateMatrix();
        cardMesh.setMatrixAt(i, dummy.matrix);
      }
    },
  );

  const cardManager = new CardManager(1000);
  cardManager.add2Scene(scene);

  //*********** */

  //*********** */

  let canvasWidth;
  let canvasHeight;
  const handleResize = useCallback(() => {
    if (!refContainer.current) {
      return;
    }
    const rect = refContainer.current.parentElement.getBoundingClientRect();
    canvasWidth = rect.width;
    canvasHeight = rect.height;
    renderer.setSize(canvasWidth, canvasHeight);
    // console.log(rect);
  }, [refContainer]);

  useLayoutEffect(() => {
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  });

  useEffect(() => {
    handleResize();
    // === THREE.JS CODE START ===

    var camera = new THREE.PerspectiveCamera(
      75,
      canvasWidth / canvasHeight,
      0.1,
      1000,
    );

    // document.body.appendChild( renderer.domElement );
    // use ref as a mount point of the Three.js scene instead of the document.body
    refContainer.current &&
      refContainer.current.appendChild(renderer.domElement);
    refContainer.current.appendChild(stats.dom);
    var geometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
    var material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    var cube = new THREE.Mesh(geometry, material);
    var spotLight = new THREE.SpotLight(0xeeee00, 10, 100, 0.3, 0.7, 2);
    var pointLight = new THREE.PointLight(0xff9933, 10, 4, 0);
    // var ambientLight = new THREE.AmbientLight(0xeeee00, 0.05);
    spotLight.translateY(3);
    spotLight.rotateY(180);
    pointLight.translateY(2);
    scene.add(spotLight);
    scene.add(pointLight);
    // scene.add(ambientLight);
    scene.add(cube);
    camera.position.z = 5;
    var animate = function (time) {
      // requestAnimationFrame(animate);
      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;

      if (cardMesh) {
        console.log("frame");
        const matrix = new THREE.Matrix4();
        const dummy = new THREE.Object3D();
        for (let i = 0; i < cardCount; i++) {
          cardMesh.getMatrixAt(i, matrix);
          matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);

          const rot = ((i / 10000) * time) / 1000;
          dummy.rotation.x = rot;
          dummy.rotation.y = rot + 1;
          dummy.rotation.z = rot + 2;

          dummy.updateMatrix();
          cardMesh.setMatrixAt(i, dummy.matrix);
        }
        cardMesh.instanceMatrix.needsUpdate = true;
      }

      renderer.render(scene, camera);
      stats.update();
    };
    renderer.setAnimationLoop(animate);
    // animate();
  }, []);
  return (
    <div
      style={{
        position: "absolute",
        height: "100%",
      }}
      ref={refContainer}
    ></div>
  );
}

export default GameScene;
