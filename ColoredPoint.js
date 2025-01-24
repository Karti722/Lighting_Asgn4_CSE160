// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform float u_Size;
  void main() {
    gl_Position = a_Position;
    gl_PointSize = u_Size;
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

  u_Size = gl.getUniformLocation(gl.program, 'u_Size');
  if (!u_Size) {
    console.log('Failed to get the storage location of u_Size');
    return;
  }
}
// Constants
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

// Globals related to HTML UI elements
let g_selectedColor = [1.0, 1.0, 1.0, 1.0];
let g_selected_size = 5;
let g_selectedType = POINT;
let numCircleSegs = 10;
function addActionsForHtmlUI () {
    // Button events (Shape type)
    document.getElementById("green").onclick = function() { g_selectedColor = [0.0, 1.0, 0.0, 1.0] };
    document.getElementById("red").onclick = function() { g_selectedColor = [1.0, 0.0, 0.0, 1.0] };
    document.getElementById("clearButton").onclick = function() { g_shapesList = []; renderAllShapes() };

    // Type of point
    document.getElementById("pointButton").onclick = function() {g_selectedType = POINT};
    document.getElementById("triButton").onclick = function() {g_selectedType = TRIANGLE};
    document.getElementById("circleButton").onclick = function() {g_selectedType = CIRCLE};

    //Slider events
    document.getElementById('redSlide').addEventListener('mouseup', function() { g_selectedColor[0] = this.value/100; });
    document.getElementById('blueSlide').addEventListener('mouseup', function() { g_selectedColor[1] = this.value/100; });
    document.getElementById('greenSlide').addEventListener('mouseup', function() { g_selectedColor[2] = this.value/100; });
    document.getElementById("circleSlide").addEventListener('mouseup', function() { numCircleSegs = this.value; });

    // Size Slider elements
    document.getElementById('sizeSlide').addEventListener('mouseup', function(){ g_selected_size = this.value });

    // A button to toggle a sunset made using CSS by the file sunset.css --> This is my submission for part 13
    let sunsetButton = document.getElementById('toggleSunsetButton');
      // Define theme names in the order of transition
      const themes = ['afternoon', 'sunset', 'nightfall', 'sunrise'];
      let currentThemeIndex = 0; // Track the current theme index
      sunsetButton.onclick = function () {
      // Get the current and next themes
      const currentTheme = themes[currentThemeIndex];
      const nextThemeIndex = (currentThemeIndex + 1) % themes.length;
      const nextTheme = themes[nextThemeIndex];
      // Remove the current theme class
      document.body.classList.remove(currentTheme);
      // If we are transitioning from sunrise to afternoon, use the special transition class from sunset.css
      if (currentTheme === 'sunrise' && nextTheme === 'afternoon') {
        document.body.classList.add('afternoon-transition');
      } else {
        document.body.classList.remove('afternoon-transition');
        document.body.classList.add(nextTheme);
      }
      // Update the button text
      sunsetButton.textContent = `Switch to ${themes[(nextThemeIndex + 1) % themes.length]}`;
      // Update the theme index
      currentThemeIndex = nextThemeIndex;
      };    
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
  gl.clear(gl.COLOR_BUFFER_BIT);
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
    renderAllShapes();
}

function convertCoordinatesEventToGL (ev) {
    var x = ev.clientX; // x coordinate of a mouse pointer
    var y = ev.clientY; // y coordinate of a mouse pointer
    var rect = ev.target.getBoundingClientRect();
    x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
    y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);
    return [x, y];
}

function renderAllShapes () {
      // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  var len = g_shapesList.length;
  for(var i = 0; i < len; i++) {
    g_shapesList[i].render();
  }
}