
// Handles everything common between all 3D graphs. Some code is borrowed from the
// WebGL tutorials which helped me get started.

// Specifically: WebGL Lesson 7 – basic directional and ambient lighting | Learning WebGL
// http://learningwebgl.com/blog/?p=684)



// gl is the WebGL context, shaderProgram is the shader used for all
// the drawing, and canvas is the given document element.
var gl, shaderProgram, canvas;

var mvMatrix = mat4.create(); // Model-view matrix
var pMatrix = mat4.create(); // Perspective matrix

var vertexPositionBuffer; // Stores the vertex positions on the graph
var vertexNormalBuffer; // Stores the normals of the graph
var vertexIndexBuffer; // Stores the vertex traversal ordering in the graph

var xRot = Math.PI/3; // Vertical rotation in radians
var zRot = 3*Math.PI/4; // Horizontal rotation in radians
var distance = 4; // Distance from the center of the view
var xCenter = 0, yCenter = 0, zCenter = 0; // Location of the center of the view
var u = 0, v = 0;

var mouseDown = false; // Whether the mouse button is pressed
var mouseX = 0, mouseY = 0; // Location of the mouse with respect to the top-left of the canvas
var mouseButton = 0; // Which mouse button is pressed

var mouseSensitivityAngle = 0.01; // How fast left-click dragging rotates the view
var mouseSensitivityDistance = 1.003; // How fast right-click dragging zooms in and out
var scrollSensitivityDistance = 1.0015; // How fast scrolling zooms in and out

var showGraph = false; // Whether the graph is ready to be shown
var showAxes = true; // Whether the axes are being shown

// Code of the vertex shader
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
	
	+"	varying vec3 vLightWeighting1;"
	+"	varying vec3 vLightWeighting2;"
	
	+"	void main(void)"
	+"	{"
	+"		vec4 position = uMVMatrix * vec4(aVertexPosition, 1.0);"
	+"		gl_Position = uPMatrix * position;"
	
	+"		if (!uUseLighting)"
	+"		{"
	+"			vLightWeighting1 = uAmbientColor;"
	+"			vLightWeighting2 = uAmbientColor;"
	+"		}"
	+"		else"
	+"		{"
	+"			vec3 transformedNormal = uNMatrix * aVertexNormal;"
	+"			vec3 vertexDirection = -normalize(position.xyz);"
	+"			float directionalLightWeighting1 = max(dot(transformedNormal, vertexDirection), 0.0);"
	+"			float directionalLightWeighting2 = max(-dot(transformedNormal, vertexDirection), 0.0);"
	+"			vLightWeighting1 = uAmbientColor + uDirectionalColor * directionalLightWeighting1;"
	+"			vLightWeighting2 = uAmbientColor + uDirectionalColor * directionalLightWeighting2;"
	+"		}"
	+"	}";

// Code of the fragment shader
var fragmentShaderSrc =
	 "	precision mediump float;"
	
	+"	varying vec3 vLightWeighting1;"
	+"	varying vec3 vLightWeighting2;"
	
	+"	void main(void)"
	+"	{"
	+"		if (gl_FrontFacing)"
	+"			gl_FragColor = vec4(vLightWeighting1, 1);"
	+"		else"
	+"			gl_FragColor = vec4(vLightWeighting2, 1);"
	+"	}";

// Intialize WebGL
function initGL()
{
	try
	{
		gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
		gl.viewportWidth = canvas.width;
		gl.viewportHeight = canvas.height;
	}
	catch (e) {}
	if (!gl)
	{
		alert("Could not initialise WebGL. Your browser may not support it.");
	}
}

// Compiles the vertex shader and returns a reference to it.
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

// Compiles the fragment shader and returns a reference to it.
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

// Initializes the shader program and attaches references to its uniforms to it.
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
	shaderProgram.useLightingUniform = gl.getUniformLocation(shaderProgram, "uUseLighting");
	shaderProgram.ambientColorUniform = gl.getUniformLocation(shaderProgram, "uAmbientColor");
	shaderProgram.lightingDirectionUniform = gl.getUniformLocation(shaderProgram, "uLightingDirection");
	shaderProgram.directionalColorUniform = gl.getUniformLocation(shaderProgram, "uDirectionalColor");
}

// Set the matrix uniforms to the current values of the matrices.
function setMatrixUniforms()
{
	//Set the perspective and modelview matrices
	gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
	gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
	
	//Set normal matrix uniform properly (see http://learningwebgl.com/blog/?p=684 for details)
	var normalMatrix = mat3.create();
	mat4.toInverseMat3(mvMatrix, normalMatrix);
	mat3.transpose(normalMatrix);
	gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, normalMatrix);
}

// Updates the graph if it is visible.
function updateGraph()
{
	if (showGraph)
	{
		updateGraphSpecific();
	}
}

// Renders the graph and axes if necessary and updates the permalink to represent
// what is currently being viewed.
function render()
{
	document.getElementById("permalink").href = getQueryFromOptions();
	
	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, distance/20, distance*50, pMatrix);

	mat4.identity(mvMatrix);

	mat4.translate(mvMatrix, [0.0, 0.0, -distance]);

	mat4.rotate(mvMatrix, xRot, [-1, 0, 0]);
	mat4.rotate(mvMatrix, zRot, [0, 0, -1]);
	
	mat4.translate(mvMatrix, [-xCenter, -yCenter, -zCenter]);
	
	if (showGraph)
	{
		renderGraph();
	}
	
	if (showAxes)
	{
		renderAxes();
	}
}

// Renders the axes: Red=x, Green=y, Blue=z
function renderAxes()
{
	// Make sure the axes are long enough
	var axis_length = Math.abs(xCenter);
	if (Math.abs(yCenter) > axis_length) axis_length = Math.abs(yCenter);
	if (Math.abs(zCenter) > axis_length) axis_length = Math.abs(zCenter);
	axis_length += distance*50;
	
	// Coordinates for the axes
	var vertices =
		[0,           0,           0,
		 axis_length, 0,           0,
		 0,           axis_length, 0,
		 0,           0,           axis_length];
	
	var normals = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
	
	var order = [0, 1, 0, 2, 0, 3];
	
	// Vertex positions
	var axesVertexPositionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, axesVertexPositionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	axesVertexPositionBuffer.itemSize = 3;
	axesVertexPositionBuffer.numItems = vertices.length;
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, axesVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
	
	// Vertex normals (all set to 0 because lighting is not used)
	var axesVertexNormalBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, axesVertexNormalBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
	axesVertexNormalBuffer.itemSize = 3;
	axesVertexNormalBuffer.numItems = normals.length;
	gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, axesVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);
	
	// Vertex indices
	var axesVertexIndexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, axesVertexIndexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(order), gl.STATIC_DRAW);
	
	// Turn lighting off
	gl.uniform1i(shaderProgram.useLightingUniform, false);
	
	// Draw the axes
	setMatrixUniforms();
	gl.uniform3fv(shaderProgram.ambientColorUniform, [1, 0, 0]);
	gl.drawElements(gl.LINES, 2, gl.UNSIGNED_SHORT, 0);
	gl.uniform3fv(shaderProgram.ambientColorUniform, [0, 1, 0]);
	gl.drawElements(gl.LINES, 2, gl.UNSIGNED_SHORT, 4);
	gl.uniform3fv(shaderProgram.ambientColorUniform, [0, 0, 1]);
	gl.drawElements(gl.LINES, 2, gl.UNSIGNED_SHORT, 8);
}

// Renders the graph based on the contents of the vertex, normal, and element buffers.
function renderGraph()
{
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, vertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);
	
	gl.uniform1i(shaderProgram.useLightingUniform, true);
	
	gl.uniform3fv(shaderProgram.ambientColorUniform, [0.05, 0.05, 0.05]);
	gl.uniform3fv(shaderProgram.lightingDirectionUniform, [0.0, 0.0, 1.0]);
	gl.uniform3fv(shaderProgram.directionalColorUniform, [0.95, 0.95, 0.95]);
	
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexIndexBuffer);
	setMatrixUniforms();
	gl.drawElements(gl.TRIANGLES, vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
}

// Sets all the buffers used in rendering the graph based on the given arrays.
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

// Initializes WebGL and sets everything up.
function webGLStart()
{
	canvas = document.getElementById("canvas");
	initGL();
	initShaders();
	initSettings();
	
	canvas.onmousedown = handleMouseDown;
	
	// Add mouse wheel events for all browsers
	if (canvas.onmousewheel === undefined)
		canvas.onwheel = handleWheel;
	else
		canvas.onmousewheel = handleMouseWheel;
	
	canvas.oncontextmenu = suppressContextMenu;
	document.onmouseup = handleMouseUp;
	document.onmousemove = handleMouseMove;
	document.getElementById("form").onkeydown = handleEnterKey;
	document.getElementById("apply").onclick = updateSettings;
	document.getElementById("axes").onchange = handleAxesUpdate;
	window.addEventListener("resize", handleWindowResize, false);
	
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.enable(gl.DEPTH_TEST);
	
	handleWindowResize();
}

// Prevents right-click dragging from opening a context menu.
function suppressContextMenu(e)
{
	e.preventDefault();
	return false;
}

// Makes axes toggle when the axes checkbox is toggled.
function handleAxesUpdate(e)
{
	if (document.getElementById("axes").checked)
	{
		showAxes = true;
	}
	else
	{
		showAxes = false;
	}
	render();
}

// Makes hitting enter equivalent to pressing Apply.
function handleEnterKey(e)
{
	if (e.keyCode == 13)
	{
		updateSettings();
	}
}

// Forces the canvas to take up the entire browser's space.
function handleWindowResize(e)
{
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	
	gl.viewportWidth = canvas.width;
	gl.viewportHeight = canvas.height;
	
	render();
}

// Makes sure the program knows when the mouse is pressed and which button is pressed.
// Also handles changing u and v when the mouse is pressed.
function handleMouseDown(e)
{
	e.preventDefault();
	mouseDown = true;
	
	mouseX = e.clientX;
	mouseY = e.clientY;
	mouseButton = e.button;
	
	if (e.shiftKey)
		mouseButton = 2;
	if (e.ctrlKey)
		mouseButton = 1;
	
	if (mouseButton == 1)
	{
		u = 2*e.clientX/canvas.width - 1;
		v = 1 - 2*e.clientY/canvas.height;
		updateGraph();
		render();
	}
	
	return false;
}

// Makes sure the program knows when the mouse is released.
function handleMouseUp(e)
{
	mouseDown = false;
}

// Handles rotating, zooming, and changing u and v when the mouse is clicking and dragging.
function handleMouseMove(e)
{
	if (mouseDown)
	{
		if (mouseButton == 0)
		{
			zRot -= mouseSensitivityAngle*(e.clientX - mouseX);
			xRot -= mouseSensitivityAngle*(e.clientY - mouseY);
			
			//Vertical limits
			if (xRot > Math.PI) xRot = Math.PI;
			else if (xRot < 0) xRot = 0;
			
			render();
		}
		else if (mouseButton == 1)
		{
			u = 2*e.clientX/canvas.width - 1;
			v = 1 - 2*e.clientY/canvas.height;
			updateGraph();
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

// Handles zooming while scrolling
function handleMouseWheel(e)
{
	e.preventDefault();
	distance *= Math.pow(scrollSensitivityDistance, -e.wheelDelta);
	render();
	return false;
}

// Handles zooming while scolling (for Firefox)
function handleWheel(e)
{
	e.preventDefault();
	distance *= Math.pow(scrollSensitivityDistance, e.deltaY*40);
	render();
	return false;
}

// Hides the settings menu
function hideSettings()
{
	document.getElementById("settings").style.display = "none";
	document.getElementById("show-settings").style.display = "inline-block";
}

// Shows the settings menu
function showSettings()
{
	document.getElementById("settings").style.display = "inline-block";
	document.getElementById("show-settings").style.display = "none";
}

// Returns the expression in the textfield with the given id and variable
// list, or oldExpr if the expression is invalid. Also, this function turns
// the textfield red if the expression is invalid and white if it is valid.
function getExpression(id, vars, oldExpr)
{
	var element = document.getElementById(id);
	try
	{
		var expr = parseExpression(element.value, vars);
		element.style.backgroundColor = "#FFFFFF";
		return expr;
	}
	catch (e)
	{
		if (e == "parse error")
		{
			element.style.backgroundColor = "#FFC0C0";
			return oldExpr;
		}
		else
		{
			throw e;
		}
	}
}

// Turns an empty textfiled white. This makes sure that no red
// textfields appear on a just-loaded page.
function resetTextField(id)
{
	var element = document.getElementById(id);
	if (element.value === "")
	{
		element.style.backgroundColor = "#FFFFFF";
	}
}

// Returns the value in the textfield with the given id, or
// oldExpr if the expression is invalid. Also, this function turns the
// textfield red if the expression is invalid and white if it is valid.
function getValue(id, oldValue)
{
	var element = document.getElementById(id);
	try
	{
		var expr = parseExpression(element.value, []);
		element.style.backgroundColor = "#FFFFFF";
		var val = expr.eval([]);
		element.value = val;
		return val;
	}
	catch (e)
	{
		if (e == "parse error")
		{
			element.style.backgroundColor = "#FFC0C0";
			return oldValue;
		}
		else
		{
			throw e;
		}
	}
}

// Returns a string containing the query to put in the URL to match what is currently being displayed.
function getQueryFromOptions()
{
	var query = "?";
	var options = document.getElementsByClassName("option");
	
	for (var i=0; i<options.length; i++)
	{
		if (i != 0) query += "&";
		query += encodeURIComponent(options[i].id) + "=" + encodeURIComponent(options[i].value);
	}
	
	query += "&xrot=" + xRot;
	query += "&zrot=" + zRot;
	query += "&distance=" + distance;
	query += "&showaxes=" + showAxes;
	query += "&u=" + u;
	query += "&v=" + v;
	
	return query;
}

// Matches all the parameters of the graph display to match everything in the query put in the URL.
function setOptionsFromQuery()
{
	var query = window.location.search;
	if (query !== "")
	{
		query = query.substring(1);
		while (query !== "")
		{
			var divider = query.indexOf('&');
			if (divider == -1)
			{				
				setSingleOptionFromQuery(query);
				query = "";
			}
			else
			{
				setSingleOptionFromQuery(query.substring(0, divider));
				query = query.substring(divider+1);
			}
		}
	}
}

// Sets a single option based on the given encoded query.
function setSingleOptionFromQuery(query)
{
	var divider = query.indexOf('=')
	var id = decodeURIComponent(query.substring(0, divider));
	var value = decodeURIComponent(query.substring(divider+1));
	
	if (!setCommonOption(id, value))
	{
		var element = document.getElementById(id);
		if (element !== null && element.className === "option")
		{
			element.value = value;
		}
	}
}

// Sets an option based on the given query id and value if it is one
// of the options compatible with all 3D graph types.
function setCommonOption(id, value)
{
	if (id == "xrot") {xRot = parseFloatOption(value, xRot); return true;}
	if (id == "zrot") {zRot = parseFloatOption(value, zRot); return true;}
	if (id == "distance") {distance = parseFloatOption(value, distance); return true;}
	if (id == "showaxes") {showAxes = parseBoolOption(value, showAxes); document.getElementById("axes").checked = showAxes; return true;}
	if (id == "u") {u = parseFloatOption(value, u); return true;}
	if (id == "v") {v = parseFloatOption(value, v); return true;}
	return false;
}

// Parses a float and returns oldValue if it cannot parse.
function parseFloatOption(str, oldValue)
{
	if (isNaN(str)) return oldValue;
	
	var newValue = parseFloat(str);
	if (isFinite(newValue)) return newValue;
	return oldValue;
}

// Parses a boolean and returns oldValue if it cannot parse.
function parseBoolOption(str, oldValue)
{
	if (str == "true") return true;
	if (str == "false") return false;
	return oldValue;
}
