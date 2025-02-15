class Sphere {
    constructor() {
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.matrix = new Matrix4();
        this.segments = 16; // Number of latitude/longitude divisions
        this.textureNum = -2;
    }

    render() {
        var rgba = this.color;

        gl.uniform1i(u_whichTexture, this.textureNum);

        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        let vertices = this.generateSphereVertices(this.segments);
        let texCoords = this.generateSphereTexCoords(this.segments);

        let vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);

        let texCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

        gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_TexCoord);

        gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 3);
    }

    generateSphereVertices(segments) {
        let vertices = [];
        for (let lat = 0; lat <= segments; lat++) {
            let theta1 = (lat * Math.PI) / segments;
            let theta2 = ((lat + 1) * Math.PI) / segments;

            for (let lon = 0; lon <= segments; lon++) {
                let phi1 = (lon * 2 * Math.PI) / segments;
                let phi2 = ((lon + 1) * 2 * Math.PI) / segments;

                let p1 = this.sphereVertex(theta1, phi1);
                let p2 = this.sphereVertex(theta2, phi1);
                let p3 = this.sphereVertex(theta1, phi2);
                let p4 = this.sphereVertex(theta2, phi2);

                vertices.push(...p1, ...p2, ...p3);
                vertices.push(...p3, ...p2, ...p4);
            }
        }
        return vertices;
    }

    generateSphereTexCoords(segments) {
        let texCoords = [];
        for (let lat = 0; lat <= segments; lat++) {
            for (let lon = 0; lon <= segments; lon++) {
                let u = lon / segments;
                let v = lat / segments;

                texCoords.push(u, v);
                texCoords.push(u, v);
                texCoords.push(u, v);
                texCoords.push(u, v);
            }
        }
        return texCoords;
    }

    sphereVertex(theta, phi) {
        return [
            Math.sin(theta) * Math.cos(phi),
            Math.cos(theta),
            Math.sin(theta) * Math.sin(phi)
        ];
    }
}
