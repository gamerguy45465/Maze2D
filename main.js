import { initShaderProgram } from "./shaders.js";
import { Maze } from "./maze.js";
import { drawCircle, drawRectangle, drawTriangle, drawLineStrip, drawLines } from "./shapes2d.js";

main();
async function main() {
    console.log('This is working');

    //
    // start gl
    //
    const canvas = document.getElementById('glcanvas');
    const gl = canvas.getContext('webgl');
    if (!gl) {
        alert('Your browser does not support WebGL');
    }
    gl.clearColor(0.1, 0.3, 0.5, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //
    // Create shaders
    //
    const vertexShaderText = await (await fetch("vertex.glsl")).text();
    const fragmentShaderText = await (await fetch("fragment.glsl")).text();
    const shaderProgram = initShaderProgram(gl, vertexShaderText, fragmentShaderText);
    gl.useProgram(shaderProgram);

    const w = 20;
    const h = 20;
    const m = new Maze(w, h);


    console.log(m.cells);

    //
    // load a projection matrix onto the shader
    //
    const projectionMatrixUniformLocation = gl.getUniformLocation(shaderProgram, "uProjectionMatrix");
    const projectionMatrix = mat4.create();
    const MARGIN = .5;
    let xlow = -MARGIN;
    let xhigh = w + MARGIN;
    let ylow = -MARGIN;
    let yhigh = h + MARGIN;

    mat4.ortho(projectionMatrix, xlow, xhigh, ylow, yhigh, -1, 1);
    gl.uniformMatrix4fv(projectionMatrixUniformLocation, false, projectionMatrix);
    const worldAspect = (xhigh - xlow) / (yhigh - ylow);

    // Choose just one of these resizing functions:
    let resizingFunction;
    //resizingFunction = resizeWorldToViewportsAspectRatio;
    resizingFunction = resizeViewportToWorldsAspectRatio;

    window.addEventListener('resize', resizingFunction);
    resizingFunction();

    function resizeWorldToViewportsAspectRatio() {
        // See explanation comments for resizeViewport().
        let physicalToCSSPixelsRatio = 1;
        physicalToCSSPixelsRatio = window.devicePixelRatio; // Do this for no pixelation. Comment out for better speed.
        canvas.width = canvas.clientWidth * physicalToCSSPixelsRatio;
        canvas.height = canvas.clientHeight * physicalToCSSPixelsRatio;

        gl.viewport(0, 0, canvas.width, canvas.height);
        const clientAspect = canvas.width / canvas.height;
        const adjustedAspect = clientAspect / worldAspect;
        if (adjustedAspect >= 1) {
            const xmid = (xlow + xhigh) / 2;
            const xHalfLengh = (xhigh - xlow) / 2 * adjustedAspect;
            mat4.ortho(projectionMatrix, xmid - xHalfLengh, xmid + xHalfLengh, ylow, yhigh, -1, 1);
            gl.uniformMatrix4fv(projectionMatrixUniformLocation, false, projectionMatrix);
        }
        else {
            const ymid = (ylow + yhigh) / 2;
            const yHalfLengh = (yhigh - ylow) / 2 / adjustedAspect;
            mat4.ortho(projectionMatrix, xlow, xhigh, ymid - yHalfLengh, ymid + yHalfLengh, -1, 1);
            gl.uniformMatrix4fv(projectionMatrixUniformLocation, false, projectionMatrix);
        }
    }


    function resizeViewportToWorldsAspectRatio() {
        // canvas.clientWidth is the current width in css pixels
        // css pixels are true pixels on old small monitors, but there might be 2 or 4 true pixels on a modern monitor.
        // canvas.width is the actual width of the underlying draw buffer.
        // canvas.width can be set in index.html. If not it gets default values of 300 by 150
        // Making canvas.width the same as canvas.clientWidth reduces pixelation.
        // We also need canvas.width = canvas.clientWidth to fix aspect ratio problems.
        // Further multiplying canvas.width by window.devicePixelRatio as below will eliminate pixelation entirely,
        //		but it will run MUCH SLOWER!
        // In MS Windows, "window.devicePixelRatio" is controlled by:
        //		Right click on desktop / Display settings / Scale and layout.
        //		That is, setting your scale to 300% results in windows.devicePixelRatio = 3

        let physicalToCSSPixelsRatio = 1;
        physicalToCSSPixelsRatio = window.devicePixelRatio; // Do this for no pixelation. Comment out for better speed.
        canvas.width = canvas.clientWidth * physicalToCSSPixelsRatio;
        canvas.height = canvas.clientHeight * physicalToCSSPixelsRatio;

        const clientAspect = canvas.width / canvas.height;
        let desiredWidth = canvas.width;
        let xOffset = 0;
        let desiredHeight = canvas.height;
        let yOffset = 0;
        if (clientAspect >= worldAspect) {
            desiredWidth = canvas.height * worldAspect;
            const xOverflow = canvas.width - desiredWidth;

            // PICK ONE OF THESE THREE STYLES:
            //xOffset = 0; 				// flush left;
            xOffset = xOverflow / 2; 		// centered;
            //xOffset = xOverflow; 		// flush right;
        }
        else {
            desiredHeight = canvas.width / worldAspect;
            const yOverflow = canvas.height - desiredHeight;

            yOffset = yOverflow / 2; // centered;
        }

        gl.viewport(0 + xOffset, 0 + yOffset, desiredWidth, desiredHeight); // (left, bottom, width, height)
        // Note that the gl.viewport parameters are very different from mat4.ortho, which go xlow, xhigh, ylow, yhigh
        // gl.viewport goes x,y,x,y. ortho goes x,x,y,y
        // gl.viewport uses two positions and two distances. ortho uses 4 positions.
    }


    //
    // load a modelview matrix onto the shader
    //
    const modelViewMatrixUniformLocation = gl.getUniformLocation(shaderProgram, "uModelViewMatrix");
    const modelViewMatrix = mat4.create();
    gl.uniformMatrix4fv(modelViewMatrixUniformLocation, false, modelViewMatrix);

    let triCenter = [19.5, 0.5];
    let triAngle = 0;
    let moveSpeed = 0.05;
    //let rotateSpeed = Math.PI / 12;
    let rotateSpeed = 0.08726646;


    function makeTriangleCoords(cx, cy, angle) {
        const localVerts = [
            [0.0, 0.5],
            [0.25, -0.3],
            [-0.25, -0.3]
        ];

        const result = [];
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);

        for (const [x,y] of localVerts) {
            const rx = x * cosA - y * sinA;
            const ry = x * sinA + y * cosA;
            result.push(cx + rx, cy + ry);
        }

        return result;
    }

    let tri_coords = makeTriangleCoords(triCenter[0], triCenter[1], triAngle);
    console.log(tri_coords);



    addEventListener('keydown', (event) => {
        const forwardX = -Math.sin(triAngle);
        const forwardY = Math.cos(triAngle);

        const rightX = Math.cos(triAngle);
        const rightY = -Math.sin(triAngle);

        let nextX = triCenter[0];
        let nextY = triCenter[1];
        let nextAngle = triAngle;

        if (event.key === 'w') {
            nextX += forwardX * moveSpeed;
            nextY += forwardY * moveSpeed;
        }

        if (event.key === 's') {
            nextX -= forwardX * moveSpeed;
            nextY -= forwardY * moveSpeed;
        }

        if (event.key === 'd') {
            nextX += rightX * moveSpeed;
            nextY += rightY * moveSpeed;
        }

        if (event.key === 'a') {
            nextX -= rightX * moveSpeed;
            nextY -= rightY * moveSpeed;
        }

        if (event.key === 'q') {
            nextAngle += rotateSpeed;
        }

        if (event.key === 'e') {
            nextAngle -= rotateSpeed;
        }

        const nextTriCoords = makeTriangleCoords(nextX, nextY, nextAngle);

        const canMove =
            m.canMoveToWorld(tri_coords[0], tri_coords[1], nextTriCoords[0], nextTriCoords[1]) &&
            m.canMoveToWorld(tri_coords[2], tri_coords[3], nextTriCoords[2], nextTriCoords[3]) &&
            m.canMoveToWorld(tri_coords[4], tri_coords[5], nextTriCoords[4], nextTriCoords[5]);

        if (canMove) {
            triCenter[0] = nextX;
            triCenter[1] = nextY;
            triAngle = nextAngle;
            tri_coords = nextTriCoords;
        }
    });


    //
    // Create content to displayw
    //



    //
    // Main render loop
    //
    let previousTime = 0;
    function redraw(currentTime) {
        currentTime *= .001; // milliseconds to seconds
        let DT = currentTime - previousTime;
        if (DT > .1)
            DT = .1;
        previousTime = currentTime;

        gl.clearColor(0.1, 0.3, 0.5, 1.0);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        // This will always fill the whole canvas with whatever was specified in gl.clearColor.

        // Reset the ModelViewMatrix to Identity (or something else) for each item you draw:
        gl.uniformMatrix4fv(gl.getUniformLocation(shaderProgram, "uModelViewMatrix"), false, mat4.create());
        const nearWhite = [.9, .9, .9, 1];
        drawRectangle(gl, shaderProgram, -100, -100, 100, 100, nearWhite);
        // for demonstrative purposes.
        // 		This rectangle will fill only the smaller viewport when altering gl.viewport to fix aspect ratio.
        //		This rectangle will fill the whole canvas when altering ortho to fix aspect ratio.


        //drawLines(gl, shaderProgram, [-100, -100, 100, -100, -100, 100], nearWhite);

        //drawCircle(gl, shaderProgram, coords[0], coords[1], 0.5, [1, 0, 0, 1] );

        drawTriangle(gl, shaderProgram, tri_coords[0], tri_coords[1], tri_coords[2], tri_coords[3], tri_coords[4], tri_coords[5], [1, 0,0, 1]);

        m.draw(gl, shaderProgram);

        //drawCircle(gl, shaderProgram, 40, 40, 5, [1, 0, 0, 1] );

        //drawCircle(gl, shaderProgram, 19.5, 1, 0.1, [0, 1, 0, 1]);
        //drawCircle(gl, shaderProgram, 19.75, 0.2, 0.1, [0, 0, 1, 1]);
        //drawCircle(gl, shaderProgram, 19.25, 0.2, 0.1, [0, 0, 1, 1]);

        requestAnimationFrame(redraw);
    }
    requestAnimationFrame(redraw);
};