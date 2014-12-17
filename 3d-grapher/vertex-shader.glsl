
attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform mat3 uNMatrix;

uniform vec3 uAmbientColor;

uniform vec3 uLightingDirection;
uniform vec3 uDirectionalColor;

uniform bool uUseLighting;

varying vec3 vLightWeighting1;
varying vec3 vLightWeighting2;

void main(void)
{
	gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);

	if (!uUseLighting)
	{
		vLightWeighting1 = uAmbientColor;
		vLightWeighting2 = uAmbientColor;
	}
	else
	{
		vec3 transformedNormal = uNMatrix * aVertexNormal;
		float directionalLightWeighting1 = max(dot(transformedNormal, uLightingDirection), 0.0);
		float directionalLightWeighting2 = max(-dot(transformedNormal, uLightingDirection), 0.0);
		vLightWeighting1 = uAmbientColor + uDirectionalColor * directionalLightWeighting1;
		vLightWeighting2 = uAmbientColor + uDirectionalColor * directionalLightWeighting2;
	}
}
