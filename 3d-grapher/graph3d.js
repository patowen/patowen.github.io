
var gl, shaderProgram, canvas;

var mvMatrix = mat4.create();
var mvMatrixStack = [];
var pMatrix = mat4.create();

var vertexPositionBuffer;
var vertexNormalBuffer;
var vertexIndexBuffer;

var xRot = Math.PI/2;
var zRot = 0;
var distance = 4;
var centerX = 0, centerY = 0, centerZ = 0;

var mouseDown = false;
var mouseX = 0, mouseY = 0;
var mouseButton = 0;
var mouseView = true;

var mouseSensitivityAngle = 0.01;
var mouseSensitivityDistance = 1.003;
var scrollSensitivityDistance = 1.0015;

var vertexShaderSrc = 
	 "	attribute vec3 aVertexPosition;"
	+"	attribute vec3 aVertexNormal;"
	
	+"	uniform mat4 uMVMatrix;"
	+"	uniform mat4 uPMatrix;"
	+"	uniform mat3 uNMatrix;"
	
	+"	uniform vec3 uAmbientColor;"
	
	+"	uniform vec3 uLightingDirection;"
	+"	uniform vec3 uDirectionalColor;"
	
	+"	uniform bool uUseLighting;"
	
	+"	varying vec3 vLightWeighting;"
	
	+"	void main(void)"
	+"	{"
	+"		gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);"
	
	+"		if (!uUseLighting)"
	+"		{"
	+"			vLightWeighting = uAmbientColor;"
	+"		}"
	+"		else"
	+"		{"
	+"			vec3 transformedNormal = uNMatrix * aVertexNormal;"
	+"			float directionalLightWeighting = max(sign(transformedNormal.z)*dot(transformedNormal, uLightingDirection), 0.0);"
	+"			vLightWeighting = uAmbientColor + uDirectionalColor * directionalLightWeighting;"
	+"		}"
	+"	}";

var fragmentShaderSrc =
	 "	precision mediump float;"
	
	+"	varying vec3 vLightWeighting;"
	
	+"	void main(void)"
	+"	{"
	+"		gl_FragColor = vec4(vLightWeighting, 1);"
	+"	}";

function initGL()
{
	try
	{
		gl = canvas.getContext("experimental-webgl");
		gl.viewportWidth = canvas.width;
		gl.viewportHeight = canvas.height;
	}
	catch (e) {}
	if (!gl)
	{
		alert("Could not initialise WebGL, sorry :-(");
	}
}


function getVertexShader(gl)
{
	var shader = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(shader, vertexShaderSrc);
	gl.compileShader(shader);
	
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
	{
		alert(gl.getShaderInfoLog(shader));
		return null;
	}
	
	return shader;
}

function getFragmentShader(gl)
{
	var shader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(shader, fragmentShaderSrc);
	gl.compileShader(shader);
	
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
	{
		alert(gl.getShaderInfoLog(shader));
		return null;
	}
	
	return shader;
}


function initShaders()
{
	var fragmentShader = getFragmentShader(gl);
	var vertexShader = getVertexShader(gl);

	shaderProgram = gl.createProgram();
	gl.attachShader(shaderProgram, vertexShader);
	gl.attachShader(shaderProgram, fragmentShader);
	gl.linkProgram(shaderProgram);

	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS))
	{
		alert("Could not initialise shaders");
	}

	gl.useProgram(shaderProgram);

	shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
	gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

	shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
	gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

	shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
	shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
	shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
	shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
	shaderProgram.useLightingUniform = gl.getUniformLocation(shaderProgram, "uUseLighting");
	shaderProgram.ambientColorUniform = gl.getUniformLocation(shaderProgram, "uAmbientColor");
	shaderProgram.lightingDirectionUniform = gl.getUniformLocation(shaderProgram, "uLightingDirection");
	shaderProgram.directionalColorUniform = gl.getUniformLocation(shaderProgram, "uDirectionalColor");
}

function mvPushMatrix()
{
	var copy = mat4.create();
	mat4.set(mvMatrix, copy);
	mvMatrixStack.push(copy);
}

function mvPopMatrix()
{
	if (mvMatrixStack.length == 0)
	{
		throw "Invalid popMatrix!";
	}
	mvMatrix = mvMatrixStack.pop();
}


function setMatrixUniforms()
{
	gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
	gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);

	var normalMatrix = mat3.create();
	mat4.toInverseMat3(mvMatrix, normalMatrix);
	mat3.transpose(normalMatrix);
	gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, normalMatrix);
}


function drawScene()
{
	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);

	mat4.identity(mvMatrix);

	mat4.translate(mvMatrix, [0.0, 0.0, -distance]);

	mat4.rotate(mvMatrix, xRot, [-1, 0, 0]);
	mat4.rotate(mvMatrix, zRot, [0, 0, -1]);
	
	mat4.translate(mvMatrix, [-centerX, -centerY, -centerZ]);

	gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, vertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);

	gl.uniform1i(shaderProgram.samplerUniform, 0);
	gl.uniform1i(shaderProgram.useLightingUniform, true);
	
	gl.uniform3fv(shaderProgram.ambientColorUniform, [0.2, 0.2, 0.2]);
	gl.uniform3fv(shaderProgram.lightingDirectionUniform, [0.0, 0.0, 1.0]);
	gl.uniform3fv(shaderProgram.directionalColorUniform, [0.8, 0.8, 0.8]);
	
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexIndexBuffer);
	setMatrixUniforms();
	gl.drawElements(gl.TRIANGLES, vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
}

function setBuffers(vertices, normals, order)
{
	vertexPositionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	vertexPositionBuffer.itemSize = 3;
	vertexPositionBuffer.numItems = vertices.length;

	vertexNormalBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
	vertexNormalBuffer.itemSize = 3;
	vertexNormalBuffer.numItems = normals.length;

	vertexIndexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexIndexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(order), gl.STATIC_DRAW);
	vertexIndexBuffer.itemSize = 1;
	vertexIndexBuffer.numItems = order.length;
}


function render()
{
	drawScene();
}


function webGLStart()
{
	canvas = document.getElementById("canvas");
	initGL();
	initShaders();
	updateSettings();
	
	canvas.onmousedown = handleMouseDown;
	canvas.onmousewheel = handleMouseWheel;
	canvas.oncontextmenu = suppressContextMenu;
	document.onmouseup = handleMouseUp;
	document.onmousemove = handleMouseMove;
	window.addEventListener('resize', handleWindowResize, false);
	
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.enable(gl.DEPTH_TEST);
	
	handleWindowResize();
}

function suppressContextMenu(e)
{
	e.preventDefault();
	return false;
}

function handleWindowResize(e)
{
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	
	gl.viewportWidth = canvas.width;
	gl.viewportHeight = canvas.height;
	
	render();
}

function handleMouseDown(e)
{
	e.preventDefault();
	mouseDown = true;
	
	if (mouseView)
	{
		mouseX = e.clientX;
		mouseY = e.clientY;
		mouseButton = e.button;
		
		if (e.shiftKey)
			mouseButton = 2;
		if (e.ctrlKey)
			mouseButton = 1;
	}
	else
	{
		//TODO setMouseCoordinates
	}
	
	return false;
}

function handleMouseUp(e)
{
	mouseDown = false;
}

function handleMouseMove(e)
{
	if (mouseDown)
	{
		if (!mouseView)
		{
			//TODO setMouseCoordinates
		}
		else if (mouseButton == 0)
		{
			zRot -= mouseSensitivityAngle*(e.clientX - mouseX);
			xRot -= mouseSensitivityAngle*(e.clientY - mouseY);
			
			//Vertical limits
			if (xRot > Math.PI) xRot = Math.PI;
			else if (xRot < 0) xRot = 0;
			
			render();
		}
		else if (mouseButton == 2)
		{
			distance *= Math.pow(mouseSensitivityDistance, e.clientY-mouseY);
			render();
		}
		
		mouseX = e.clientX;
		mouseY = e.clientY;
	}
}

function handleMouseWheel(e)
{
	e.preventDefault();
	distance *= Math.pow(scrollSensitivityDistance, -e.wheelDelta);
	render();
	return false;
}

function hideSettings()
{
	document.getElementById("settings").style.display = "none";
	document.getElementById("show-settings").style.display = "inline-block";
}

function showSettings()
{
	document.getElementById("settings").style.display = "inline-block";
	document.getElementById("show-settings").style.display = "none";
}