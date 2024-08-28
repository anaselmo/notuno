import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import * as THREE from 'three'

// const GameScene = () => {
//     const mountRef = useRef(null)
//     const renderer = new THREE.WebGLRenderer({
//         // canvas: canvasRef.current as HTMLCanvasElement,
//         antialias: true,
//         alpha: true
//     })
//     const temp = {
//         width: 1024,
//         height: 720
//     }
//     const camera = new THREE.PerspectiveCamera(
//         75,
//         temp.width / temp.height
//     )

//     useEffect(()=>{
//         console.log("step")
//         const scene = new THREE.Scene()
//         mountRef.current && mountRef.current.appendChild( renderer.domElement );

//         const geometry = new THREE.BoxGeometry(1,1,1);
//         const material = new THREE.MeshBasicMaterial({color: 0x00ff00})
//         const mesh = new THREE.Mesh(geometry,material)
//         scene.add(mesh)

    
//         renderer.setAnimationLoop(() => {
//             renderer.render(scene, camera)
//         })

//         const onResize = () => {
//             camera.aspect = window.innerWidth / window.innerHeight
//             camera.updateProjectionMatrix()
//             renderer.setSize(window.innerWidth, window.innerHeight)
//         }
      
//         window.addEventListener("resize", onResize, false)
      
//         return () => {
//             window.removeEventListener("resize", onResize)
//         }
//     })

//     return (
//         <div ref={mountRef}></div>
        
//     )
// }


function GameScene() {
    const refContainer = useRef(null);
    const renderer = new THREE.WebGLRenderer();

    const handleResize = useCallback(() => {
      if (!refContainer.current) {
        return
      }
      const rect = refContainer.current.parentElement.getBoundingClientRect();
      const width = rect.width
      const height = rect.height
      renderer.setSize(width, height);
      console.log(rect)
  
    }, [refContainer])

    useLayoutEffect(() => {
      window.addEventListener('resize', handleResize)

      return () => {
        window.removeEventListener('resize', handleResize)
      }
    });

    useEffect(() => {
      
      // === THREE.JS CODE START ===
      var scene = new THREE.Scene();
      var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

      handleResize();
      // document.body.appendChild( renderer.domElement );
      // use ref as a mount point of the Three.js scene instead of the document.body
      refContainer.current && refContainer.current.appendChild( renderer.domElement );
      var geometry = new THREE.BoxGeometry(1, 1, 1);
      var material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
      var cube = new THREE.Mesh(geometry, material);
      scene.add(cube);
      camera.position.z = 5;
      var animate = function () {
        requestAnimationFrame(animate);
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;
        renderer.render(scene, camera);
      };
      animate();
    }, []);
    return (
      <div style={{
        position: 'absolute',
        height:"100%"
      }} ref={refContainer}></div>
  
    );
  }

export default GameScene;