// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  precision mediump float;
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  varying vec2 v_UV;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;

    }`

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  uniform vec4 u_FragColor;  // uniform
  uniform sampler2D u_Sampler0;
  uniform int u_whichTexture;
  void main() {
    
    if (u_whichTexture == -2) {
    gl_FragColor = u_FragColor;
    } else if (u_whichTexture == -1) {
     gl_FragColor = vec4(v_UV, 1.0, 1.0);
    } else if (u_whichTexture == 0) {
      gl_FragColor = texture2D(u_Sampler0, v_UV);
    } else {
      gl_FragColor = vec4(1, .2, .2, 1);
    }

  }`

//   Global Variables
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

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
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


function addActionsForHtmlUI() {
  document.getElementById('yellowSlide').addEventListener('mousemove', function() {
      g_YellowAngle = -1 * this.value;
      renderScene();
  });

  document.getElementById('magentaSlide').addEventListener('mousemove', function() {
      g_MagentaAngle = this.value;
      renderScene();
  });

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

    // Draw the ground using a cube
    var ground = new Cube();
    ground.color = [0.76, 0.70, 0.50, 1];
    ground.textureNum = -2;
    ground.matrix.setTranslate(-10, -1, -10);
    ground.matrix.scale(50, 0.06, 50);
    ground.matrix.rotate(g_seconds * 36, g_seconds * 36, g_seconds * 36, g_seconds * 36);
    ground.render();

    var ocean = new Cube();
    ocean.color = [0.0, 0.0, 1.0, 1];
    ocean.textureNum = -2;
    ocean.matrix.setTranslate(-10, -1, -10);
    ocean.matrix.scale(100, 0.06, 100);

    // Draw the blue sky box
    var sky = new Cube();
    sky.color = [0.529, 0.808, 0.922, 1];
    sky.textureNum = -2;
    sky.matrix.setTranslate(-10, -10, -10);
    sky.matrix.scale(75, 75, 75);
    sky.matrix.rotate(g_seconds * 12, g_seconds * 12, g_seconds * 12, g_seconds * 12);
    sky.render();

    // Draw houses and roofs
    drawHouse(-5, -1, -5);
    drawHouse(5, -1, -5);
    drawHouse(-5, -1, 5);
    drawHouse(5, -1, 5);

    // Draw rain
    drawRain();

    // Draw clouds
    drawClouds();

    // Draw a left arm
    var leftArm = new Cube();
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
    box.color = [1, 1, 1, 1];
    box.matrix = yellowCoordinatesMat;
    box.matrix.translate(0, -0.1, 0);
    box.matrix.rotate(g_MagentaAngle, 1, 0, 0);
    box.matrix.scale(0.09, 0.1, 0.1);
    box.render();

    // leftLeg cube
    var leftLeg = new Cube();
    leftLeg.color = [0.54, 0.27, 0.07, 1];
    leftLeg.matrix.translate(-0.3, -1, 0.3);
    leftLeg.matrix.scale(0.1, 0.5, 0.15);
    if (g_animation === true) {
        leftLeg.matrix.rotate(-45 * Math.sin(g_seconds * 6), 1, 1, 1);
    }
    leftLeg.render();

    // rightLeg cube
    var rightLeg = new Cube();
    rightLeg.color = [0.54, 0.27, 0.07, 1];
    rightLeg.matrix.translate(0.1, -1, 0.4);
    rightLeg.matrix.scale(0.1, 0.5, 0.15);
    if (g_animation === true) { }
    rightLeg.render();

    // Fox ears
    var leftEar = new Cube();
    leftEar.color = [0.54, 0.27, 0.07, 1];
    leftEar.matrix.rotate(45, 0, 0, 1);
    leftEar.matrix.translate(0.3, 0.2, 0.3);
    leftEar.matrix.scale(0.2, 0.2, 0.2);
    if (g_animation === true) { }
    leftEar.render();

    // Left inner ear (red part)
    var leftInnerEar = new Cube();
    leftInnerEar.color = [1, 0, 0, 1];
    leftInnerEar.matrix.rotate(45, 0, 0, 1);
    leftInnerEar.matrix.translate(0.35, 0.25, 0.29);
    leftInnerEar.matrix.scale(0.1, 0.1, 0.1);
    if (g_animation === true) { }
    leftInnerEar.render();

    // right ear
    var rightEar = new Cube();
    rightEar.color = [0.54, 0.27, 0.07, 1];
    rightEar.matrix.translate(-0.2, 0.35, 0.3);
    rightEar.matrix.rotate(45, 0, 0, 1);
    rightEar.matrix.scale(0.2, 0.2, 0.2);
    if (g_animation === true) { }
    rightEar.render();

    // right inner ear (red part)
    var rightInnerEar = new Cube();
    rightInnerEar.color = [1, 0, 0, 1];
    rightInnerEar.matrix.translate(-0.2, 0.45, 0.29);
    rightInnerEar.matrix.rotate(45, 0, 0, 1);
    rightInnerEar.matrix.scale(0.1, 0.1, 0.1);
    if (g_animation === true) { }
    rightInnerEar.render();

    // body or torso
    var body = new Cube();
    body.color = [0.54, 0.27, 0.07, 1];
    body.matrix.translate(-0.3, -0.5, 0.2);
    body.matrix.scale(0.5, 1, 0.3);
    if (g_animation === true) { }
    body.render();

    // left eye
    var leftEye = new Cube();
    leftEye.color = [0, 0, 0, 1];
    leftEye.matrix.translate(-0.2, 0.1, -0.5);
    leftEye.matrix.translate(0, 0.2, 0.67);
    leftEye.matrix.scale(.1, .1, .1);
    if (g_animation === true) { }
    leftEye.render();

    // right eye
    var rightEye = new Cube();
    rightEye.color = [0, 0, 0, 1];
    rightEye.matrix.translate(-0.2, 0.1, -0.5);
    rightEye.matrix.translate(0.2, 0.2, 0.67);
    rightEye.matrix.scale(.1, .1, .1);
    if (g_animation === true) { }
    rightEye.render();

    // mouth
    var mouth = new Cube();
    mouth.color = [1, 0, 0, 1];
    mouth.matrix.translate(-0.4, -0.3, 0.1);
    mouth.matrix.scale(.3, .1, .1);
    mouth.matrix.translate(0.65, 2.5, 0.3);
    if (g_animation === true) { }
    mouth.render();

    // teeth
    var teeth = new Cube();
    teeth.color = [1, 1, 1, 1];
    teeth.matrix.translate(-0.4, -0.3, 0.1);
    teeth.matrix.scale(.3, .05, .05);
    teeth.matrix.translate(0.65, 6.5, 0.2);
    if (g_animation === true) { }
    teeth.render();

    // Bear nose
    var nose = new Sphere();
    nose.color = [0, 0, 0, 1];
    nose.matrix.scale(.1, .1, .1);
    nose.matrix.translate(0.1, 1.9, 1.45);
    if (g_animation === true) { }
    nose.render();

    // Static Sphere visual
    var staticSphere = new Sphere();
    staticSphere.color = [1, 1, 1, 1];
    staticSphere.matrix.setTranslate(0.0, -1.5, 0.0);
    staticSphere.matrix.scale(0.3, 0.3, 0.3);

    if (shiftPressed === true && clicked === true) {
        staticSphere.matrix.translate(0, 5, 1)
        staticSphere.matrix.scale(Math.abs(15 * Math.cos(g_seconds * 6)), Math.abs(25 * Math.cos(g_seconds * 4)), Math.abs(25 * Math.cos(g_seconds * 4)));
        staticSphere.matrix.rotate(g_seconds * 30, 0, 1, 0);
        leftEye.matrix.translate(.5 * Math.sin(g_seconds * 2), 0, 0);
        leftEye.render();
        rightEye.matrix.translate(-.5 * Math.sin(g_seconds * 2), 0, 0);
        rightEye.render();

        rightArm.matrix.translate(180 * Math.sin(g_seconds * 4), 1, 1, 1);
        rightArm.matrix.rotate(Math.cos(g_seconds * 6), 1, 1, 1);
        rightArm.render();

        leftEar.matrix.rotate(Math.abs(22 * Math.sin(g_seconds * 4)), 1, 1, 1);
        leftEar.render();

        rightEar.matrix.rotate(-1 * Math.abs(22 * Math.sin(g_seconds * 4)), 1, 1, 1);
        rightEar.render();

        body.matrix.rotate(-1 * Math.abs(12 * Math.sin(g_seconds * 4)), 1, 1, 1);
        body.matrix.scale(1.2 * Math.cos(g_seconds * 4), 1.2 * Math.cos(g_seconds * 4), 0);
        body.render();

        leftLeg.matrix.rotate(-1 * Math.abs(12 * Math.sin(g_seconds * 4)), 1, 0, 0);
        leftLeg.matrix.scale(1 * Math.cos(g_seconds * 6), 1, Math.sin(g_seconds * 25));
        leftLeg.render();

        rightLeg.matrix.rotate(1 * Math.abs(12 * Math.sin(g_seconds * 4)), 1, 1, 1);
        rightLeg.matrix.scale(-1 * Math.cos(g_seconds * 6), 1, Math.sin(g_seconds * 25));
        rightLeg.render();

        teeth.matrix.scale(.1 * Math.cos(g_seconds * 6), 1, Math.sin(g_seconds * 25));
        teeth.color = [1, 1, 1, 1];
        teeth.render();

        mouth.matrix.scale(.05 * Math.cos(g_seconds * 6), 1, 1);
        mouth.render();

        nose.matrix.scale(1.25 * Math.cos(g_seconds * 6), 1, 1);
        nose.render();
    }
}

function drawHouse(x, y, z) {
    var house = new Cube();
    house.color = [0.8, 0.5, 0.2, 1];
    house.textureNum = -2;
    house.matrix.setTranslate(x, y, z);
    house.matrix.scale(2, 2, 2);
    house.render();

    var roof = new Cube();
    roof.color = [0.5, 0.2, 0.2, 1];
    roof.textureNum = -2;
    roof.matrix.setTranslate(x, y + 2, z);
    roof.matrix.scale(2.2, 0.5, 2.2);
    roof.render();
}

function drawRain() {
    for (let i = 0; i < 50; i++) { // Reduced number of raindrops
        var rainDrop = new Sphere();
        rainDrop.color = [0.0, 0.0, 1.0, 1];
        rainDrop.matrix.setTranslate(Math.random() * 20 - 10, Math.random() * 10 - (g_seconds % 10), Math.random() * 20 - 10);
        rainDrop.matrix.scale(0.05, 0.05, 0.05);
        rainDrop.render();
    }
}

function drawClouds() {
    for (let i = 0; i < 3; i++) { // Reduced number of clouds
        var cloud = new Sphere();
        cloud.color = [1.0, 1.0, 1.0, 1];
        var angle = g_seconds * 20 + i * 120; // 120 degrees apart for 3 clouds
        var x = 10 * Math.cos(angle * Math.PI / 180);
        var z = 10 * Math.sin(angle * Math.PI / 180);
        cloud.matrix.setTranslate(x, 5, z);
        cloud.matrix.scale(2, 1, 1.5); // Distort the sphere to look like a cloud
        cloud.render();
    }
}