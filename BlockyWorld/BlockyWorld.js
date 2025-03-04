// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  precision mediump float;
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  attribute vec3 a_Normal;
  varying vec2 v_UV;
  varying vec3 v_Normal;
  varying vec4 v_VertPos;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  
  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
    v_Normal = a_Normal;
    v_VertPos = u_ModelMatrix * a_Position;
    }`

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  varying vec3 v_Normal;
  varying vec4 v_VertPos;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0;
  uniform int u_whichTexture;
  uniform vec3 u_lightPos;
  uniform vec3 u_lightPos2;
  uniform vec3 u_cameraPos;
  uniform bool u_lightOn;

  void main() {
    vec4 baseColor;

    if (u_whichTexture == -3) {
      baseColor = vec4((v_Normal + 1.0) / 2.0, 1.0);
    } else if (u_whichTexture == -2) {
      baseColor = u_FragColor;
    } else if (u_whichTexture == -1) {
      baseColor = vec4(v_UV, 1.0, 1.0);
    } else if (u_whichTexture == 0) {
      baseColor = texture2D(u_Sampler0, v_UV);
    } else {
      baseColor = vec4(1, 1, 1, 1);
    }

    if (u_lightOn) {
      vec3 lightVector = u_lightPos - vec3(v_VertPos);
      float distance = length(lightVector);
      vec3 L = normalize(lightVector);
      vec3 N = normalize(v_Normal);
      float nDotL = max(dot(N, L), 0.0);

      vec3 R = reflect(-L, N);
      vec3 E = normalize(u_cameraPos - vec3(v_VertPos));
      float specular = pow(max(dot(E, R), 0.0), 50.0);

      float attenuation = 1.0 / (0.1 + 0.1 * distance + 0.02 * distance * distance);

      vec3 ambient = vec3(baseColor) * 0.3;
      vec3 diffuse = vec3(baseColor) * nDotL * attenuation;
      vec3 specularColor = vec3(1.0, 1.0, 1.0) * specular * attenuation;

      // Second light source calculations with increased brightness
      vec3 lightVector2 = u_lightPos2 - vec3(v_VertPos);
      float distance2 = length(lightVector2);
      vec3 L2 = normalize(lightVector2);
      float nDotL2 = max(dot(N, L2), 0.0);

      vec3 R2 = reflect(-L2, N);
      float specular2 = pow(max(dot(E, R2), 0.0), 50.0);

      float attenuation2 = 1.0 / (0.1 + 0.1 * distance2 + 0.02 * distance2 * distance2);

      vec3 diffuse2 = vec3(baseColor) * nDotL2 * attenuation2 * 1.0; // Increase brightness by multiplying by 5
      vec3 specularColor2 = vec3(1.0, 1.0, 1.0) * specular2 * attenuation2 * 5.0; // Increase brightness by multiplying by 5

      gl_FragColor = vec4(ambient + diffuse + specularColor + diffuse2 + specularColor2, baseColor.a);
    } else {
      gl_FragColor = baseColor;
    }
  }`;
//   Global Variables
  let g_lightOn = true; // Add this global variable to track the light state
  let u_lightOn;
  let canvas;
  let gl;
  let a_Position;
  let a_UV;
  let u_FragColor;
  let u_Size;
  let u_ModelMatrix;
  let u_ProjectionMatrix;
  let u_ViewMatrix;
  let u_GlobalRotateMatrix;
  let u_Sampler0;
  let u_whichTexture;
  let camera;
  let u_cameraPos;
  let u_lightPos;
  let a_Normal;
  let u_lightPos2;

function toggleLight() {
    g_lightOn = !g_lightOn;
    renderScene();
}

function setUpWebGL() {
    // Retrieve <canvas> element
    canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    gl = canvas.getContext('webgl', {preserveDrawingBuffer: true})
    if (!gl) {
      console.log('Failed to get the rendering context for WebGL');
      return;
    }
    gl.enable(gl.DEPTH_TEST);
}  


function connectVariablesToGLSL() {
 // Initialize shaders
 if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  u_lightOn = gl.getUniformLocation(gl.program, 'u_lightOn');
  if (!u_lightOn) {
    console.log('Failed to get the storage location of u_lightOn');
    return;
  }

  u_cameraPos = gl.getUniformLocation(gl.program, 'u_cameraPos');  // Add this line
  if (!u_cameraPos) {
    console.log('Failed to get the storage location of u_cameraPos');
    return;
  }

  // // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  a_UV = gl.getAttribLocation(gl.program, 'a_UV');
  if (a_UV < 0) {
    console.log('Failed to get the storage location of a_UV');
    return;
  }

  a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
  if (a_Normal < 0) {
    console.log('Failed to get the storage location of a_Normal');
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  u_lightPos = gl.getUniformLocation(gl.program, 'u_lightPos');
  if (!u_lightPos) {
    console.log('Failed to get the storage location of u_lightPos');
    return;
  }

  u_lightPos2 = gl.getUniformLocation(gl.program, 'u_lightPos2');
  if (!u_lightPos2) {
    console.log('Failed to get the storage location of u_lightPos2');
    return;
  }

  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }

  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  if (!u_GlobalRotateMatrix) {
    console.log("Failed to get the storage location of u_GlobalRotateMatrix");
    return;
  }

  u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
  if (!u_Sampler0) {
    console.log('Failed to get the storage location of u_Sampler0');
    return;
  }

  u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');
  if (!u_whichTexture) {
    console.log('Failed to get the storage location of u_whichTexture');
    return; 
  }

  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  if (!u_ViewMatrix) {
    console.log("Failed to get the storage location of u_ViewMatrix");
    return;
  }

  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  if (!u_ProjectionMatrix) {
    console.log("Failed to get the storage location of u_projectionMatrix");
    return;
  }
  
  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);


}
// Constants
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

// Globals related to HTML UI elements
let g_selectedColor = [1.0, 1.0, 1.0, 1.0];
let g_selected_size = 5;
let g_selectedType = POINT;
let g_globalAngle = 0;
let g_YellowAngle = 0;
let g_MagentaAngle = 0;
let g_animation = false;
let g_rightArmAngle = 0;
let g_leftLegAngle = 0;
let g_rightLegAngle = 0;
let shiftPressed = false;
let clicked = false;
// camera angles for mouse rotation
let g_globalAngleX = 0;
let g_globalAngleY = 0;
let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;
let g_normalOn = false;
let g_lightPos = [0, 1, -2];

function showStory() {
    document.getElementById('story').style.display = 'block';
    document.getElementById('showStoryButton').style.display = 'none';
    document.getElementById('hideStoryButton').style.display = 'inline';
}

function hideStory() {
    document.getElementById('story').style.display = 'none';
    document.getElementById('showStoryButton').style.display = 'inline';
    document.getElementById('hideStoryButton').style.display = 'none';
}

function addActionsForHtmlUI() {

  document.getElementById('toggleLightButton').onclick = toggleLight;

    document.getElementById('normalOn') .onclick = function() {
        g_normalOn = true;
    };

    document.getElementById('normalOff').onclick = function() {
        g_normalOn = false; 
    };

    document.getElementById('yellowSlide').addEventListener('mousemove', function() {
        g_YellowAngle = -1 * this.value;
        renderScene();
    });

    document.getElementById('magentaSlide').addEventListener('mousemove', function() {
        g_MagentaAngle = this.value;
        renderScene();
    });

    // Added these sliders for the light source
    document.getElementById('lightSlideX').addEventListener('mousemove', function(ev) { 
        g_lightPos[0] = this.value/100;
        renderScene();
    });

    document.getElementById('lightSlideY').addEventListener('mousemove', function(ev) {
        g_lightPos[1] = this.value/100;
        renderScene();
    });

    document.getElementById('lightSlideZ').addEventListener('mousemove', function(ev) {
        g_lightPos[2] = this.value/100;
        renderScene();
    });
    // Added these sliders for the light source

    document.getElementById('angleSlide').addEventListener('mousemove', function () {
        g_globalAngle = this.value;
        renderScene();
    });

    document.getElementById('animationOnButton').onclick = function () {
        g_animation = true;
    };

    document.getElementById('animationOffButton').onclick = function () {
        g_animation = false;
    };

    document.getElementById("rightArmSlide").addEventListener('mousemove', function () {
        g_rightArmAngle = this.value;
        renderScene();
    });

    document.getElementById('showStoryButton').onclick = showStory;
    document.getElementById('hideStoryButton').onclick = hideStory;

    // Mouse events for rotation
    canvas.addEventListener('mousedown', function(event) {
        isDragging = true;
        lastMouseX = event.clientX;
        lastMouseY = event.clientY;
    });

    canvas.addEventListener('mousemove', function(event) {
        if (isDragging) {
            let deltaX = event.clientX - lastMouseX;
            let deltaY = event.clientY - lastMouseY;

            g_globalAngleX += deltaY * 0.5;  // Map vertical movement to X rotation
            g_globalAngleY += deltaX * 0.5;  // Map horizontal movement to Y rotation

            lastMouseX = event.clientX;
            lastMouseY = event.clientY;

            renderScene();
        }
    });

    canvas.addEventListener('mouseup', function() {
        isDragging = false;
    });

    canvas.addEventListener('mouseleave', function() {
        isDragging = false;
    });

    // Listen for keydown and keyup events to track the Shift key state
    document.addEventListener('keydown', function(ev) {
        if (ev.key === 'Shift') {
            shiftPressed = true; // Shift key is pressed
        }
    });

    document.addEventListener('keyup', function(ev) {
        if (ev.key === 'Shift') {
            shiftPressed = false; // Shift key is released
        }
    });

    document.addEventListener('mousedown', function() {
        clicked = true;
    });

    // When the mouse button is released, set mouseHeld to false
    document.addEventListener('mouseup', function() {
        clicked = false;
    });
}

function main() {
    // Sets up WebGL canvas and context
  setUpWebGL();

  connectVariablesToGLSL();

//   Handles the clicking of the red and green buttons
  addActionsForHtmlUI();

  initTextures(gl, 0);

  // Instantiate the global camera object
  camera = new Camera(60, [0, 0, 4], [0, 0, -100], [0, 1, 0]);

  // Register function (event handler) to be called on a mouse press
  canvas.onmousedown = click;
  canvas.onmousemove = function(ev) { if (ev.buttons == 1) { click(ev) }  };

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // requestAnimationFrame for animation
  requestAnimationFrame(tick);

  // Add event listeners for camera controls
  document.addEventListener('keydown', function(ev) {
      console.log(ev.key);
      switch (ev.key) {
          case 'W':
          case 'w':
              camera.moveForward(1);
              break;
          case 'S':
          case 's':
              camera.moveBackward(1);
              break;
          case 'A':
          case 'a':
              camera.moveLeft(1.5);
              break;
          case 'D':
          case 'd':
              camera.moveRight(1.5);
              break;
          case 'Q':
          case 'q':
              camera.panLeft(1.5);
              break;
          case 'E':
          case 'e':
              camera.panRight(1.5);
              break;
      }
      renderScene();
  });
}

var g_startTime = performance.now() / 1000.0;
var g_seconds = performance.now() / 1000.0-g_startTime;

var g_lastFrameTime = performance.now(); // Track last frame time

var g_lastFpsUpdateTime = performance.now(); // Track last FPS update time
var g_fps = 0;

function tick() {
  var now = performance.now();
  var deltaTime = now - g_lastFrameTime; // Time elapsed since last frame
  g_lastFrameTime = now;

  g_fps = 1000 / deltaTime; // Calculate FPS
  g_seconds = now / 1000.0 - g_startTime;

  updateAnimationAngles();

  // Update FPS display only once per second
  if (now - g_lastFpsUpdateTime >= 1000) {
    document.getElementById("FPS").innerText = g_fps.toFixed(2);
    g_lastFpsUpdateTime = now; // Reset FPS update timer
  }

  // Draw everything
  renderScene();

  // Request next frame
  requestAnimationFrame(tick);
}

function updateAnimationAngles() {
    if (g_animation) {
      g_lightPos[1] = 0.5 * Math.cos(g_seconds) + 1;
      g_lightPos[0] = 2 * Math.sin(g_seconds);
      g_lightPos[2] = 3 * Math.cos(g_seconds);
    }
    
}

var g_shapesList = [];

function click(ev) {

    // Extract the event click and turn it into WebGL coordinates
    let [x, y] = convertCoordinatesEventToGL(ev);
    
    // Create and store the new point
    let point;
    if (g_selectedType == POINT) {
        point = new Point();
    } else if (g_selectedType == TRIANGLE) {
        point = new Triangle();
    }
    else {
        point = new Circle();
        point.segments = numCircleSegs;
    }
    point.position = [x, y];
    point.color = g_selectedColor.slice();
    point.size = g_selected_size;
    g_shapesList.push(point);

    // Draw every shape that is supposed to be in the canvas
    renderScene();
}

function convertCoordinatesEventToGL (ev) {
    var x = ev.clientX; // x coordinate of a mouse pointer
    var y = ev.clientY; // y coordinate of a mouse pointer
    var rect = ev.target.getBoundingClientRect();
    x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
    y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);
    return [x, y];
}


function initTextures(gl, n) {

  var u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
  if (!u_Sampler0) {
    console.log('Failed to get the storage location of u_Sampler0');
    return false;
  }

  var image = new Image();  // Create the image object
  if (!image) {
    console.log('Failed to create the image object');
    return false;
  }
  // Register the event handler to be called on loading an image
  image.onload = function(){ sendImageToTEXTURE0(image); };
  // Tell the browser to load an image
  image.src = '../resources/sky.jpg';

  // Add more textures here (More image JPG resource files required)

  return true;
}

// Sends texture to GLSL
function sendImageToTEXTURE0(image){
  var texture = gl.createTexture();   // Create a texture object
  if (!texture) {
    console.log('Failed to create the texture object');
    return false;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis
  // Enable the texture unit 0
  gl.activeTexture(gl.TEXTURE0);
  // Bind the texture object to the target
  gl.bindTexture(gl.TEXTURE_2D, texture);
  // Set the texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  // Set the texture image
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  // Set the texture unit 0 to the sampler
  gl.uniform1i(u_Sampler0, 0);
  
 
  }

  var g_eye=[0,0,4]; // Eye position
  var g_at=[0,0,-100];
  var g_up=[0,1,0];




    
  function renderScene() {
    // Pass the projection matrix
    gl.uniformMatrix4fv(u_ProjectionMatrix, false, camera.projectionMatrix.elements);
  
    // Pass the view matrix
    gl.uniformMatrix4fv(u_ViewMatrix, false, camera.viewMatrix.elements);
  
    var globalRotMat = new Matrix4()
        .rotate(g_globalAngleY + 180, 0, 1, 0)  // Rotate around Y-axis
        .rotate(g_globalAngleX, 1, 0, 0); // Rotate around X-axis
  
    if (g_globalAngle > 0) {
        globalRotMat.rotate(g_globalAngle, 0, 1, 0);
    }
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);
  
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.clear(gl.COLOR_BUFFER_BIT);
  
    // Update the camera position uniform
    gl.uniform3f(u_cameraPos, camera.eye[0], camera.eye[1], camera.eye[2]);
  
    // Update the light state uniform
    gl.uniform1i(u_lightOn, g_lightOn);
  
    // Draw the light source only if the light is on
    if (g_lightOn) {
      gl.uniform3f(u_lightPos, g_lightPos[0], g_lightPos[1], g_lightPos[2]);
      gl.uniform3f(u_lightPos2, 7.5, 7.5, 7.5); // Fixed position near the corner of the sky cube
  
      var light = new Cube();
      light.textureNum = g_normalOn ? -3 : -2;
      light.color = [2, 2, 0, 1];
      light.matrix.translate(g_lightPos[0], g_lightPos[1], g_lightPos[2]);
      light.matrix.scale(-0.1, -0.1, -0.1);
      light.matrix.translate(-.5, -.5, -.5);
      light.render();
  
      var spotlight = new Cube();
      spotlight.textureNum = g_normalOn ? -3 : -2;
      // white colo
      spotlight.color = [2, 2, 1, 1];
      spotlight.matrix.translate(7.5, 7.5, 7.5); // Fixed position near the corner of the sky cube
      spotlight.matrix.scale(-2.5, -2.5, -2.5);
      spotlight.matrix.translate(.5, .5, .5);
      spotlight.matrix.rotate(30, 0, 0, 1);
      spotlight.render();
    } else {
      gl.uniform3f(u_lightPos, 0, 0, 0); // Set light position to zero when light is off
      gl.uniform3f(u_lightPos2, 0, 0, 0);
    }
  
    // Draw the ground using a cube
    var ground = new Cube();
    ground.color = [0.76, 0.70, 0.50, 1];
    ground.textureNum = g_normalOn ? -3 : 0;
    ground.matrix.setTranslate(-10, -1, -10);
    ground.matrix.scale(50, 0.06, 50);
    ground.matrix.rotate(g_seconds * 36, g_seconds * 36, g_seconds * 36, g_seconds * 36);
    ground.render();
  
    // Draw the blue sky box
    var sky = new Cube();
    sky.textureNum = g_normalOn ? -3 : -2;
    sky.color = [0.529, 0.808, 0.922, 1];
    sky.matrix.setTranslate(-10, -10, -10);
    sky.matrix.scale(15, 15, 15);
    sky.render();
  
    // Draw a left arm
    var leftArm = new Cube();
    leftArm.textureNum = g_normalOn ? -3 : -2;
    leftArm.color = [0.6, 0.27, 0.07, 1];
    leftArm.matrix.setTranslate(.18, 0.1, 0.3);
    if (g_animation === true) {
        leftArm.matrix.rotate(45 * Math.sin(g_seconds * 6) - 35 - g_YellowAngle - g_MagentaAngle, 1, 0, 1);
    } else {
        leftArm.matrix.rotate(g_YellowAngle, 0, 0, 1);
    }
    var yellowCoordinatesMat = new Matrix4(leftArm.matrix);
    leftArm.matrix.scale(0.1, 0.5, 0.15);
    leftArm.render();
  
    // right Arm
    var rightArm = new Cube();
    rightArm.textureNum = g_normalOn ? -3 : -2;
    rightArm.color = [0.6, 0.27, 0.07, 1];
    rightArm.matrix.setRotate(135, 0, 0, 1);
    rightArm.matrix.setTranslate(-.4, -0.5, 0.3);
    rightArm.matrix.scale(0.1, 0.5, 0.15);
    if (g_animation === true) {
        rightArm.matrix.rotate(g_rightArmAngle, 1, 1, 0);
        rightArm.matrix.rotate(Math.abs((45 + g_rightArmAngle) * Math.sin(g_seconds)), 1, 1, 0);
    } else {
        rightArm.matrix.rotate(g_rightArmAngle, 1, 1, 0);
    }
    rightArm.render();
  
    // Draw box --> Left tiny forearm
    var box = new Cube();
    box.textureNum = g_normalOn ? -3 : -2;
    box.color = [1, 1, 1, 1];
    box.matrix = yellowCoordinatesMat;
    box.matrix.translate(0, -0.1, 0);
    box.matrix.rotate(g_MagentaAngle, 1, 0, 0);
    box.matrix.scale(0.09, 0.1, 0.1);
    box.render();
  
    // leftLeg cube
    var leftLeg = new Cube();
    leftLeg.textureNum = g_normalOn ? -3 : -2;
    leftLeg.color = [0.54, 0.27, 0.07, 1];
    leftLeg.matrix.translate(-0.3, -1, 0.3);
    leftLeg.matrix.scale(0.1, 0.5, 0.15);
    if (g_animation === true) {
        leftLeg.matrix.rotate(-45 * Math.sin(g_seconds * 6), 1, 1, 1);
    }
    leftLeg.render();
  
    // rightLeg cube
    var rightLeg = new Cube();
    rightLeg.textureNum = g_normalOn ? -3 : -2;
    rightLeg.color = [0.54, 0.27, 0.07, 1];
    rightLeg.matrix.translate(0.1, -1, 0.4);
    rightLeg.matrix.scale(0.1, 0.5, 0.15);
    if (g_animation === true) { }
    rightLeg.render();
  
    // Fox ears
    var leftEar = new Cube();
    leftEar.textureNum = g_normalOn ? -3 : -2;
    leftEar.color = [0.54, 0.27, 0.07, 1];
    leftEar.matrix.rotate(45, 0, 0, 1);
    leftEar.matrix.translate(0.3, 0.2, 0.3);
    leftEar.matrix.scale(0.2, 0.2, 0.2);
    if (g_animation === true) { }
    leftEar.render();
  
    // Left inner ear (red part)
    var leftInnerEar = new Cube();
    leftInnerEar.textureNum = g_normalOn ? -3 : -2;
    leftInnerEar.color = [1, 0, 0, 1];
    leftInnerEar.matrix.rotate(45, 0, 0, 1);
    leftInnerEar.matrix.translate(0.35, 0.25, 0.29);
    leftInnerEar.matrix.scale(0.1, 0.1, 0.1);
    if (g_animation === true) { }
    leftInnerEar.render();
  
    // right ear
    var rightEar = new Cube();
    rightEar.textureNum = g_normalOn ? -3 : -2;
    rightEar.color = [0.54, 0.27, 0.07, 1];
    rightEar.matrix.translate(-0.2, 0.35, 0.3);
    rightEar.matrix.rotate(45, 0, 0, 1);
    rightEar.matrix.scale(0.2, 0.2, 0.2);
    if (g_animation === true) { }
    rightEar.render();
  
    // right inner ear (red part)
    var rightInnerEar = new Cube();
    rightInnerEar.textureNum = g_normalOn ? -3 : -2;
    rightInnerEar.color = [1, 0, 0, 1];
    rightInnerEar.matrix.translate(-0.2, 0.45, 0.29);
    rightInnerEar.matrix.rotate(45, 0, 0, 1);
    rightInnerEar.matrix.scale(0.1, 0.1, 0.1);
    if (g_animation === true) { }
    rightInnerEar.render();
  
    // body or torso
    var body = new Cube();
    body.textureNum = g_normalOn ? -3 : -2;
    body.color = [0.54, 0.27, 0.07, 1];
    body.matrix.translate(-0.3, -0.5, 0.2);
    body.matrix.scale(0.5, 1, 0.3);
    if (g_animation === true) { }
    body.render();
  
    // left eye
    var leftEye = new Cube();
    leftEye.textureNum = g_normalOn ? -3 : -2;
    leftEye.color = [0, 0, 0, 1];
    leftEye.matrix.translate(-0.2, 0.1, -0.5);
    leftEye.matrix.translate(0, 0.2, 0.67);
    leftEye.matrix.scale(.1, .1, .1);
    if (g_animation === true) { }
    leftEye.render();
  
    // right eye
    var rightEye = new Cube();
    rightEye.textureNum = g_normalOn ? -3 : -2;
    rightEye.color = [0, 0, 0, 1];
    rightEye.matrix.translate(-0.2, 0.1, -0.5);
    rightEye.matrix.translate(0.2, 0.2, 0.67);
    rightEye.matrix.scale(.1, .1, .1);
    if (g_animation === true) { }
    rightEye.render();
  
    // mouth
    var mouth = new Cube();
    mouth.textureNum = g_normalOn ? -3 : -2;
    mouth.color = [1, 0, 0, 1];
    mouth.matrix.translate(-0.4, -0.3, 0.1);
    mouth.matrix.scale(.3, .1, .1);
    mouth.matrix.translate(0.65, 2.5, 0.3);
    if (g_animation === true) { }
    mouth.render();
  
    // teeth
    var teeth = new Cube();
    teeth.textureNum = g_normalOn ? -3 : -2;
    teeth.color = [1, 1, 1, 1];
    teeth.matrix.translate(-0.4, -0.3, 0.1);
    teeth.matrix.scale(.3, .05, .05);
    teeth.matrix.translate(0.65, 6.5, 0.2);
    if (g_animation === true) { }
    teeth.render();
  
    // Bear nose
    var nose = new Sphere();
    nose.textureNum = 0;
    nose.textureNum = g_normalOn ? -3 : nose.textureNum;
    nose.color = [0, 0, 0, 1];
    nose.matrix.translate(0.1, 1.9, 1.45);
    nose.render();
  }



