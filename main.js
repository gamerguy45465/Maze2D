import {initShaderProgram} from "./shaders.js";












main();




async function main()
{
    const canvas = document.getElementById("glcanvas");
    const gl = canvas.getContext("webgl");

    if(!gl)
    {
        alert("WebGL not supported");
    }


    gl.clearColor(0.75, 0.85, 0.8, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);




    const vertexShaderText = await (await fetch("vertex.glsl")).text();
    const fragmentShaderText = await (await fetch("fragment.glsl")).text();



    let shaderProgram = initShaderProgram(gl, vertexShaderText, fragmentShaderText);

    gl.useProgram(shaderProgram);






    const projectionMatrixUniformLocation = gl.getUniformLocation(shaderProgram, "uProjectionMatrix");




}