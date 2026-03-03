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

    const w = 5;
    const h = 4;
    const m = new Maze(w, h);

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

    //
    // Create content to display
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

        m.draw(gl, shaderProgram);

        requestAnimationFrame(redraw);
    }
    requestAnimationFrame(redraw);
};