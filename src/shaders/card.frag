precision highp float;

uniform sampler2D texture1;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec4 vColor;
varying vec2 vUv;

void main() {

    vec4 color = vec4( vColor );

    // gl_FragColor = color;
    gl_FragColor = texture2D(texture1, vUv);

}