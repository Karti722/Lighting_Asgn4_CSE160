// Cube.js

class Cube {
    constructor() {
        this.type = 'cube';
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.matrix = new Matrix4();
    }

    render() {
        var rgba = this.color;
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        // let vertices = [
            
            

            
        //     // Left face
        //     0.0, 0.0, 0.0,   0.0, 1.0, 1.0,   0.0, 1.0, 0.0,
        //     0.0, 0.0, 0.0,   0.0, 0.0, 1.0,   0.0, 1.0, 1.0,
            
        //     // Right face
        //     1.0, 0.0, 0.0,   1.0, 1.0, 0.0,   1.0, 1.0, 1.0,
        //     1.0, 0.0, 0.0,   1.0, 1.0, 1.0,   1.0, 0.0, 1.0
        // ];
        
        // Front of cube
        drawTriangle3DUV([0,0,0, 1,1,0, 1,0,0 ], [0,0, 1,1, 1,0]);
        drawTriangle3DUV([0,0,0, 0,1,0, 1,1,0], [0,0, 0,1, 1,1]);
  
        // Pass the color of a point to u_FragColor variable
        gl.uniform4f(u_FragColor, rgba[0]*0.9, rgba[1]*0.9, rgba[2]*0.9, rgba[3]);

        // Top of cube
        drawTriangle3D([0,1,0, 0,1,1, 1,1,1]);
        drawTriangle3D([0,1,0, 1,1,1, 1,1,0]);

        // Back of cube
        drawTriangle3D([0,0,1, 1,0,1, 1,1,1]);
        drawTriangle3D([0,0,1, 1,1,1, 0,1,1]);

        // Bottom of cube
        drawTriangle3D([0, 0, 0, 1, 0, 0, 1, 0, 1]);
        drawTriangle3D([0, 0, 0, 1, 0, 1, 0, 0, 1]);

        // left of cube
        drawTriangle3D([0.0, 0.0, 0.0,   0.0, 1.0, 1.0,   0.0, 1.0, 0.0]);
        drawTriangle3D([0.0, 0.0, 0.0,   0.0, 0.0, 1.0,   0.0, 1.0, 1.0]);

        // right of cube
        drawTriangle3D([ 1.0, 0.0, 0.0,   1.0, 1.0, 0.0,   1.0, 1.0, 1.0]);
        drawTriangle3D([1.0, 0.0, 0.0,   1.0, 1.0, 1.0,   1.0, 0.0, 1.0]);
    

    }
}
