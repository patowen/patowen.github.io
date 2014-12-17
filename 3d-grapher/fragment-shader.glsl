
precision mediump float;

varying vec3 vLightWeighting1;
varying vec3 vLightWeighting2;

void main(void)
{
	gl_FragColor = vec4(max(vLightWeighting1, vLightWeighting2), 1);
}
