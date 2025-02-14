class Camera {
    constructor(fov, eye, target, up) {
        this.fov = fov;
        this.eye = eye;
        this.target = target;
        this.up = up;
        this.viewMatrix = new Matrix4();
        this.projectionMatrix = new Matrix4();
        this.updateViewMatrix();
        this.updateProjectionMatrix();
    }

    updateViewMatrix() {
        this.viewMatrix.setLookAt(
            this.eye[0], this.eye[1], this.eye[2],
            this.target[0], this.target[1], this.target[2],
            this.up[0], this.up[1], this.up[2]
        );
    }

    updateProjectionMatrix() {
        this.projectionMatrix.setPerspective(this.fov, canvas.width / canvas.height, 0.1, 100);
    }

    moveForward(distance) {
        let forward = [
            this.target[0] - this.eye[0],
            this.target[1] - this.eye[1],
            this.target[2] - this.eye[2]
        ];
        forward = this.normalize(forward);
        this.eye[0] += forward[0] * distance;
        this.eye[1] += forward[1] * distance;
        this.eye[2] += forward[2] * distance;
        this.target[0] += forward[0] * distance;
        this.target[1] += forward[1] * distance;
        this.target[2] += forward[2] * distance;
        this.updateViewMatrix();
    }

    moveBackward(distance) {
        this.moveForward(-distance);
    }

    moveLeft(distance) {
        let left = this.cross(this.up, [
            this.target[0] - this.eye[0],
            this.target[1] - this.eye[1],
            this.target[2] - this.eye[2]
        ]);
        left = this.normalize(left);
        this.eye[0] += left[0] * distance;
        this.eye[1] += left[1] * distance;
        this.eye[2] += left[2] * distance;
        this.target[0] += left[0] * distance;
        this.target[1] += left[1] * distance;
        this.target[2] += left[2] * distance;
        this.updateViewMatrix();
    }

    moveRight(distance) {
        this.moveLeft(-distance);
    }

    panLeft(angle) {
        let rotationMatrix = new Matrix4().setRotate(angle, this.up[0], this.up[1], this.up[2]);
        let direction = [
            this.target[0] - this.eye[0],
            this.target[1] - this.eye[1],
            this.target[2] - this.eye[2]
        ];
        direction = this.transformVector(rotationMatrix, direction);
        this.target[0] = this.eye[0] + direction[0];
        this.target[1] = this.eye[1] + direction[1];
        this.target[2] = this.eye[2] + direction[2];
        this.updateViewMatrix();
    }

    panRight(angle) {
        this.panLeft(-angle);
    }

    normalize(vector) {
        let length = Math.sqrt(vector[0] ** 2 + vector[1] ** 2 + vector[2] ** 2);
        return [vector[0] / length, vector[1] / length, vector[2] / length];
    }

    cross(a, b) {
        return [
            a[1] * b[2] - a[2] * b[1],
            a[2] * b[0] - a[0] * b[2],
            a[0] * b[1] - a[1] * b[0]
        ];
    }

    transformVector(matrix, vector) {
        let result = matrix.multiplyVector3(new Vector3(vector));
        return [result.elements[0], result.elements[1], result.elements[2]];
    }
}