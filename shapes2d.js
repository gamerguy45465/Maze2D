function drawCircle(gl, shaderProgram, x, y, radius, color=[0,0,1,1]){
    const sides = 64;
    const vertices = CreateCircleVertices(x,y,radius,sides);
    drawVertices(gl, shaderProgram, vertices, color, gl.TRIANGLE_FAN);
}

function CreateCircleVertices(x,y,radius,sides){
    const vertices = [];
    vertices.push(x);
    vertices.push(y);
    for(let i=0; i<sides+1; i++){
        const radians = i/sides *2*Math.PI;
        vertices.push(x+radius*Math.cos(radians));
        vertices.push(y+radius*Math.sin(radians));
    }
    return vertices;
}

function drawRectangle(gl, shaderProgram, x1, y1, x2, y2, color=[0,1,0,1]){
    const vertices = [x1,y1, x2,y1, x1,y2, x2,y2]; // triangle strip order
    drawVertices(gl, shaderProgram, vertices, color, gl.TRIANGLE_STRIP);
}

function drawTriangle(gl, shaderProgram, x1, y1, x2, y2, x3, y3, color=[1,1,0,1]){
    const vertices = [x1, y1, x2, y2, x3, y3];
    drawVertices(gl, shaderProgram, vertices, color, gl.TRIANGLES);
}

function drawLineStrip(gl, shaderProgram, vertices, color=[0,0,0,1]){
    drawVertices(gl, shaderProgram, vertices, color, gl.LINE_STRIP);
}

function drawLineLoop(gl, shaderProgram, vertices, color=[0,0,0,1]){
    drawVertices(gl, shaderProgram, vertices, color, gl.LINE_LOOP);
}

function drawLines(gl, shaderProgram, vertices, color=[0,0,0,1]){
    drawVertices(gl, shaderProgram, vertices, color, gl.LINES);
}


function drawVertices(gl, shaderProgram, vertices, color, style){
    const vertexBufferObject = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferObject);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    const positionAttribLocation = gl.getAttribLocation(shaderProgram, 'vertPosition');
    gl.vertexAttribPointer(
        positionAttribLocation, // Attribute location
        2, // Number of elements per attribute
        gl.FLOAT, // Type of elements
        gl.FALSE,
        2 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
        0 // Offset from the beginning of a single vertex to this attribute
    );
    gl.enableVertexAttribArray(positionAttribLocation);

    const colorUniformLocation = gl.getUniformLocation(shaderProgram, "uColor");
    gl.uniform4fv(colorUniformLocation, color);

    gl.drawArrays(style, 0, vertices.length/2);
}

export {drawCircle, drawRectangle, drawTriangle, drawLineStrip, drawLineLoop, drawLines};