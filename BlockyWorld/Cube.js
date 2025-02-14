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
        
        
        // Define vertices for each face of the cube
        let vertices = [
            // Front face
            0.0, 0.0, 0.0,   1.0, 1.0, 0.0,   1.0, 0.0, 0.0,
            0.0, 0.0, 0.0,   0.0, 1.0, 0.0,   1.0, 1.0, 0.0,
            
            // Back face
            0.0, 0.0, 1.0,   1.0, 0.0, 1.0,   1.0, 1.0, 1.0,
            0.0, 0.0, 1.0,   1.0, 1.0, 1.0,   0.0, 1.0, 1.0,
            
            // Top face
            0.0, 1.0, 0.0,   0.0, 1.0, 1.0,   1.0, 1.0, 1.0,
            0.0, 1.0, 0.0,   1.0, 1.0, 1.0,   1.0, 1.0, 0.0,
            
            // Bottom face
            0.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 1.0,
            0.0, 0.0, 0.0,   1.0, 0.0, 1.0,   0.0, 0.0, 1.0,
            
            // Left face
            0.0, 0.0, 0.0,   0.0, 1.0, 1.0,   0.0, 1.0, 0.0,
            0.0, 0.0, 0.0,   0.0, 0.0, 1.0,   0.0, 1.0, 1.0,
            
            // Right face
            1.0, 0.0, 0.0,   1.0, 1.0, 0.0,   1.0, 1.0, 1.0,
            1.0, 0.0, 0.0,   1.0, 1.0, 1.0,   1.0, 0.0, 1.0
        ];

        // Draw the cube using triangles
        for (let i = 0; i < vertices.length; i += 9) {
            drawTriangle3D(vertices.slice(i, i + 9));
            // This line adds the lighting for each side of the cube
            if (i % 2 == 1 && i > 18) {
                gl.uniform4f(u_FragColor, rgba[0]*.9, rgba[1]*.9, rgba[2]*.9, rgba[3]);
            }
        }

    

    }
}
