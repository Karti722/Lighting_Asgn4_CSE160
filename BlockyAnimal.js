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

function addActionsForHtmlUI () {



    // yellow joint
    document.getElementById('yellowSlide').addEventListener('mousemove', function(){
       g_YellowAngle = this.value;
       renderScene();
       });

    // 
    document.getElementById('magentaSlide').addEventListener('mousemove', function(){
      g_MagentaAngle = this.value;
        renderScene();
      });

    // Camera angle
    document.getElementById('angleSlide').addEventListener('mousemove', function () {
      g_globalAngle = this.value;
      renderScene();
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

function tick() {
  // console.log(performance.now());

  g_seconds = performance.now() / 1000.0-g_startTime;

  // Draw everything
  renderScene();

  // Tell the browser to update when it has time
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

  // Draw triangle test
  // drawTriangle3D( [-1.0,0.0,0.0, -0.5,-1.0,0.0, 0.0,0.0,0.0] );
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  // gl.clear(gl.COLOR_BUFFER_BIT);



  // Draw a left arm
  var leftArm = new Cube();
  leftArm.color =  [0.6, 0.27, 0.07, 1];
  leftArm.matrix.setTranslate(.18, 0.1,0.3);
  // leftArm.matrix.rotate(g_YellowAngle, 0, 0, 1);
  leftArm.matrix.rotate(45*Math.sin(g_seconds) - 35 - g_YellowAngle - g_MagentaAngle, 1, 0, 1);
  // leftArm.matrix.translate((0.3 * Math.sin(-g_seconds/4) % 2), 0, 0, 0);
  // 90*Math.sin(g_seconds)
  var yellowCoordinatesMat = new Matrix4(leftArm.matrix);
  leftArm.matrix.scale(0.1, 0.5, 0.15);
  leftArm.render();

  // right Arm
  var rightArm = new Cube();
  rightArm.color = [0.6, 0.27, 0.07, 1];
  rightArm.matrix.setRotate(135, 0, 0, 1);
  rightArm.matrix.setTranslate(-.4, -0.5, 0.3);
  
  rightArm.matrix.scale(0.1, 0.5, 0.15);
  rightArm.render();

  // Draw box
  var box = new Cube();
  box.color = [1, 0, 1, 1];
  box.matrix = yellowCoordinatesMat;
  box.matrix.translate(0,-0.1,0);
  box.matrix.rotate(g_MagentaAngle, 1, 0, 0);
  box.matrix.scale(0.09,0.1,0.1);
  box.render();

  // leftLeg cube
  var leftLeg = new Cube();
  leftLeg.color = [0.54, 0.27, 0.07, 1];
  // -0.3 * Math.sin(g_seconds) % 3
  leftLeg.matrix.translate(-0.3, -1, 0.3);
  leftLeg.matrix.scale(0.1, 0.5, 0.15);
  leftLeg.render();

  // rightLeg cube
  var rightLeg = new Cube();
  rightLeg.color = [0.54, 0.27, 0.07, 1];
  rightLeg.matrix.translate(0.1, -1, 0.4);
  rightLeg.matrix.scale(0.1, 0.5, 0.15);  
  rightLeg.render();

  // Fox ears
  var leftEar = new Cube();
  leftEar.color = [0.54, 0.27, 0.07, 1];
  leftEar.matrix.rotate(45, 0, 0, 1);
  leftEar.matrix.translate(0.3, 0.2, 0.3);
  leftEar.matrix.scale(0.2,0.2,0.2);
  leftEar.render();

  var rightEar = new Cube();
  rightEar.color = [0.54, 0.27, 0.07, 1];
  rightEar.matrix.translate(-0.2, 0.35, 0.3);
  rightEar.matrix.rotate(45, 0, 0, 1);
  rightEar.matrix.scale(0.2,0.2,0.2);
  rightEar.render();


  // red = [1, 0, 0, 1]

    var body = new Cube();
    body.color = [0.54, 0.27, 0.07, 1];
    body.matrix.translate(-0.3, -0.5, 0.2);
    body.matrix.scale(0.5, 1, 0.3);
    body.render();



}