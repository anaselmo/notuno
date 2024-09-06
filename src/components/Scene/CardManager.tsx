import * as THREE from "three";

import fragmentShader from "@/shaders/card.frag";
import vertexShader from "@/shaders/card.vert";

export class CardManager {
  private uvProportion: THREE.Vector2 = new THREE.Vector2(0.25, 0.25);
  private positions = [];
  private normals = [];
  private offsets = [];
  private uvs = [];
  private uvOffsets = [];
  private colors = [];
  private rotations = []; // Guardar las rotaciones como quaterniones ahorra espacio, pero el shader puede ser mas lento
  private mesh: THREE.Mesh;

  private initBuffers(instances) {
    // original mesh attributes
    this.positions.push(1, 0, 0);
    this.positions.push(0, 1, 0);
    this.positions.push(0, 0, 0);

    this.positions.push(1, 1, 0);
    this.positions.push(0, 1, 0);
    this.positions.push(1, 0, 0);

    this.normals.push(0, 0, 1);
    this.normals.push(0, 0, 1);
    this.normals.push(0, 0, 1);

    this.normals.push(0, 0, 1);
    this.normals.push(0, 0, 1);
    this.normals.push(0, 0, 1);

    this.uvs.push(0 * this.uvProportion.x, 1 * this.uvProportion.y);
    this.uvs.push(1 * this.uvProportion.x, 0 * this.uvProportion.y);
    this.uvs.push(0 * this.uvProportion.x, 0 * this.uvProportion.y);

    this.uvs.push(1 * this.uvProportion.x, 1 * this.uvProportion.y);
    this.uvs.push(0 * this.uvProportion.x, 1 * this.uvProportion.y);
    this.uvs.push(1 * this.uvProportion.x, 0 * this.uvProportion.y);
    // instanced attributes

    for (let i = 0; i < instances; i++) {
      // offsets

      this.offsets.push(
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 4,
      );

      // rotations

      const rot: THREE.Quaternion = new THREE.Quaternion().random();
      this.rotations.push(rot.x, rot.y, rot.z, rot.w);

      // colors

      this.colors.push(Math.random(), Math.random(), Math.random(), 1);

      // uvs offsets
      this.uvOffsets.push(
        Math.floor(Math.random() * 4),
        Math.floor(Math.random() * 4),
      );
    }
  }

  public add2Scene(scene) {
    console.log(this.mesh.geometry.isBufferGeometry);
    scene.add(this.mesh);
  }

  constructor(instances) {
    const loader = new THREE.TextureLoader();
    const texture = loader.load("src/assets/colorAtlas.png");

    this.initBuffers(instances);

    const geometry = new THREE.InstancedBufferGeometry();
    geometry.instanceCount = instances; // set so its initalized for dat.GUI, will be set in first draw otherwise

    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(this.positions, 3),
    );
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(this.uvs, 2));
    geometry.setAttribute(
      "normal",
      new THREE.Float32BufferAttribute(this.normals, 3),
    );

    geometry.setAttribute(
      "offset",
      new THREE.InstancedBufferAttribute(new Float32Array(this.offsets), 3),
    );
    geometry.setAttribute(
      "color",
      new THREE.InstancedBufferAttribute(new Float32Array(this.colors), 4),
    );
    geometry.setAttribute(
      "uvOffset",
      new THREE.InstancedBufferAttribute(new Float32Array(this.uvOffsets), 2),
    );
    geometry.setAttribute(
      "rotation",
      new THREE.InstancedBufferAttribute(new Float32Array(this.rotations), 4),
    );

    // material

    const material = new THREE.RawShaderMaterial({
      uniforms: {
        texture1: { value: texture },
        uvProportion: { value: this.uvProportion },
      },
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      side: THREE.DoubleSide,
      forceSinglePass: true,
      transparent: true,
    });

    //

    this.mesh = new THREE.Mesh(geometry, material);
  }
}
