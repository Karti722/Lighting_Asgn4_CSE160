// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  void main() {
    gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    }`

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;  // uniform
  void main() {
    gl_FragColor = u_FragColor;
  }`

//   Global Variables
  let canvas;
  let gl;
  let a_Position;
  let u_FragColor;
  let u_Size;
  let u_ModelMatrix;
  let u_GlobalRotateMatrix;

function setUpWebGL() {
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
//   gl = getWebGLContext(canvas);
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
  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  // u_Size = gl.getUniformLocation(gl.program, 'u_Size');
  // if (!u_Size) {
  //   console.log('Failed to get the storage location of u_Size');
  //   return;
  // }

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

  // Register function (event handler) to be called on a mouse press
  canvas.onmousedown = click;
  canvas.onmousemove = function(ev) { if (ev.buttons == 1) { click(ev) }  };

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  // gl.clear(gl.COLOR_BUFFER_BIT);
  // renderScene();
  requestAnimationFrame(tick);
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

// Rename this function to renderAllScene()
function renderScene () {
      // Clear <canvas>

  var globalRotMat = new Matrix4().rotate(g_globalAngle, 0, 1, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  // var len = g_shapesList.length;
  // for(var i = 0; i < len; i++) {
  //   g_shapesList[i].render();
  // }


  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.clear(gl.COLOR_BUFFER_BIT);


  var globalRotMat = new Matrix4()
  .rotate(g_globalAngleY, 0, 1, 0)  // Rotate around Y-axis
  .rotate(g_globalAngleX, 1, 0, 0); // Rotate around X-axis

  if (g_globalAngle > 0) {
    globalRotMat.rotate(g_globalAngle, 0, 1, 0)
  }

gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  // Draw a left arm
  var leftArm = new Cube();
  leftArm.color =  [0.6, 0.27, 0.07, 1];
  leftArm.matrix.setTranslate(.18, 0.1,0.3);
  if (g_animation === true) {
    leftArm.matrix.rotate(45*Math.sin(g_seconds * 6) - 35 - g_YellowAngle - g_MagentaAngle, 1, 0, 1);
  }
  else {
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
  }
  else {
    rightArm.matrix.rotate(g_rightArmAngle, 1, 1, 0);
  }
  rightArm.render();

  // Draw box --> Left tiny forearm
  var box = new Cube();
  box.color = [1, 1, 1, 1];
  box.matrix = yellowCoordinatesMat;
  box.matrix.translate(0,-0.1,0);
  box.matrix.rotate(g_MagentaAngle, 1, 0, 0);
  box.matrix.scale(0.09,0.1,0.1);
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
  if (g_animation === true) {
    rightLeg.matrix.rotate(45 * Math.sin(g_seconds), 1, 1, 1);
  }  
  rightLeg.render();

  // Fox ears
  var leftEar = new Cube();
  leftEar.color = [0.54, 0.27, 0.07, 1];
  leftEar.matrix.rotate(45, 0, 0, 1);
  leftEar.matrix.translate(0.3, 0.2, 0.3);
  leftEar.matrix.scale(0.2,0.2,0.2);
  if (g_animation === true) {
    leftEar.matrix.translate(0.04 * Math.sin(g_seconds * 6), 0 , 0.2);
  }
  leftEar.render();

  // Left inner ear (red part)
  var leftInnerEar = new Cube();
  leftInnerEar.color = [1, 0, 0, 1];
  leftInnerEar.matrix.rotate(45, 0, 0, 1);
  leftInnerEar.matrix.translate(0.35, 0.25, 0.29);
  leftInnerEar.matrix.scale(0.1,0.1,0.1);
  if (g_animation === true) {
    leftInnerEar.matrix.translate(0.04 * Math.sin(g_seconds * 6), 0 ,0);
  }
  leftInnerEar.render();

  // right ear
  var rightEar = new Cube();
  rightEar.color = [0.54, 0.27, 0.07, 1];
  rightEar.matrix.translate(-0.2, 0.35, 0.3);
  rightEar.matrix.rotate(45, 0, 0, 1);
  rightEar.matrix.scale(0.2,0.2,0.2);
  if (g_animation === true) {
    rightEar.matrix.translate(0.04 * Math.sin(g_seconds * 6), 0 ,0);
  }
  rightEar.render();

  // right inner ear (red part)
  var rightInnerEar = new Cube();
  rightInnerEar.color = [1, 0, 0, 1];
  rightInnerEar.matrix.translate(-0.2, 0.45, 0.29);
  rightInnerEar.matrix.rotate(45, 0, 0, 1);
  rightInnerEar.matrix.scale(0.1,0.1,0.1);
  if (g_animation === true) {
    rightInnerEar.matrix.translate(0.04 * Math.sin(g_seconds * 6), 0 ,0);
  }
  rightInnerEar.render();

  // body or torso
  var body = new Cube();
  body.color = [0.54, 0.27, 0.07, 1];
  body.matrix.translate(-0.3, -0.5, 0.2);
  body.matrix.scale(0.5, 1, 0.3);
  if (g_animation === true) {
    body.matrix.translate(0.04 * Math.sin(g_seconds * 6), 0, 0);
  }
  body.render();

    // left eye
   var leftEye = new Cube();
   leftEye.color = [0, 0, 0, 1];
   leftEye.matrix.translate(-0.2, 0.1, -0.5);
   leftEye.matrix.translate(0, 0.2, 0.67);
   leftEye.matrix.scale(.1, .1, .1);
   leftEye.render();

  //  right eye
   var rightEye = new Cube();
   rightEye.color = [0, 0, 0, 1];
   rightEye.matrix.translate(-0.2, 0.1, -0.5);
   rightEye.matrix.translate(0.2, 0.2, 0.67);
   rightEye.matrix.scale(.1, .1, .1);
   rightEye.render();

  //  mouth
  var mouth = new Cube ();
  mouth.color = [1, 0, 0, 1];
  mouth.matrix.translate(-0.4, -0.3, 0.1);
  mouth.matrix.scale(.3, .1, .1);
  mouth.matrix.translate(0.65, 2.5, 0.3);
  mouth.render();

  // teeth 
  var teeth = new Cube();
  teeth.color = [1, 1, 1,1];
  teeth.matrix.translate(-0.4, -0.3, 0.1);
  teeth.matrix.scale(.3, .05, .05);
  teeth.matrix.translate(0.65, 6.5, 0.2);
  teeth.render();

  // Bear nose
  var nose = new Sphere()
  nose.color = [0,0,0,1];
  nose.matrix.scale(.1, .1, .1);
  nose.matrix.translate(0.1, 1.9, 1.45);
  nose.render();


  // Static Sphere visual
  // This sphere visual effect is supposed to mimick a bad TV static filter you would see when editing a video on tiktok
  var staticSphere = new Sphere(); 
  staticSphere.color = [1, 1, 1, 1]; 
  staticSphere.matrix.setTranslate(0.0, -1.5, 0.0); 
  staticSphere.matrix.scale(0.3, 0.3, 0.3); 

  if (shiftPressed === true && clicked === true) {
    // Animates visual TV static visual effect if shift key is pressed, also the bear starts to act a little horror creepy
   staticSphere.matrix.translate(0, 5, 1)
   staticSphere.matrix.scale(Math.abs(15 * Math.cos(g_seconds * 6)), Math.abs(25 * Math.cos(g_seconds * 4)), Math.abs(25 * Math.cos(g_seconds * 4)));
   staticSphere.matrix.rotate(g_seconds * 30, 0, 1, 0);
    // Rest of if statement is devoted to distorting body parts so it looks like a horror movie
    leftEye.matrix.translate( .5 * Math.sin(g_seconds * 2), 0, 0);
    leftEye.render(); 
    rightEye.matrix.translate( -.5 * Math.sin(g_seconds * 2), 0, 0);
    rightEye.render();

    rightArm.matrix.translate(180* Math.sin(g_seconds * 4), 1, 1, 1);
    rightArm.matrix.rotate(Math.cos(g_seconds * 6), 1, 1,1);
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
    teeth.color = [1, 1, 1,1];
    teeth.render();

    mouth.matrix.scale(.05 * Math.cos(g_seconds * 6), 1, 1);
    mouth.render();

    nose.matrix.scale(1.25 * Math.cos(g_seconds * 6), 1, 1);
    nose.render();

  }
  staticSphere.render(); 

 


}