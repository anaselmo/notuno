precision highp float;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform vec2 uvProportion;

attribute vec4 rotation;
attribute vec3 position;
attribute vec3 normal;
attribute vec3 offset;
attribute vec4 color;
attribute vec2 uv;
attribute vec2 uvOffset;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec4 vColor;
varying vec2 vUv;

vec3 applyQuaternionToVector(vec3 v,vec4 q){
    vec3 qVec = q.xyz;
    vec3 v0 = cross(qVec,v);
    vec3 v1 = cross(qVec,v0);
    v0 *= (2.0 * q.w);
    v1 *= 2.0;
    return v + v0 + v1;
}

void main(){
    vNormal = normal;
    vPosition = offset + applyQuaternionToVector(position,rotation);

    vColor = color;

    vUv = uv + uvProportion * uvOffset;
    // vUv = uv;

    gl_Position = projectionMatrix * modelViewMatrix * vec4( vPosition, 1.0 );
}