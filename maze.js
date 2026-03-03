import { drawCircle, drawRectangle, drawTriangle, drawLineStrip, drawLines } from "./shapes2d.js";
import { randomDouble, randomIntExclusive } from "./random.js";

class Cell {
    constructor() {
        this.left = true;
        this.bottom = true;
        this.right = true;
        this.top = true;
        this.visited = false;
    }

    // Remember that x is the column number and y is the row number.
    // So (x,y) is passed in from (c,r), not the standard cell ordring of (r,c).
    draw(gl, shaderProgram, x, y) {
        const modelViewMatrixUniformLocation = gl.getUniformLocation(shaderProgram, "uModelViewMatrix");
        const modelViewMatrix = mat4.create();
        gl.uniformMatrix4fv(modelViewMatrixUniformLocation, false, modelViewMatrix);

        const vertices = [];

        if (this.left) {
            vertices.push(x, y, x, y + 1);
        }
        if (this.bottom) {
            vertices.push(x, y, x + 1, y);
        }
        if (this.right) {
            vertices.push(x + 1, y, x + 1, y + 1);
        }
        if (this.top) {
            vertices.push(x, y + 1, x + 1, y + 1);
        }

        drawLines(gl, shaderProgram, vertices, [0, 0, 0, 1]);

    }
}

class Maze {
    constructor(width, height) {
        this.WIDTH = width;
        this.HEIGHT = height;
        this.cells = [];
        for (let r = 0; r < height; r++) {
            this.cells.push([]);
            for (let c = 0; c < width; c++) {
                this.cells[r].push(new Cell());
            }
        }
        this.carvePaths(0, 0)
    }

    carvePaths(c, r) {
        this.cells[r][c].visited = true; // don't move to here again

        // Gather all possible moves
        const RIGHT = 0;
        const LEFT = 1;
        const UP = 2;
        const DOWN = 3;
        while (true) {
            const possibleMoves = [];
            if (c + 1 < this.WIDTH && !this.cells[r][c + 1].visited) // can I move right?
            {
                possibleMoves.push(RIGHT)
            }

            // You do likewise for 3 other directions

            if (c - 1 >= 0 && !this.cells[r][c - 1].visited)
            {
                possibleMoves.push(LEFT)
            }

            if (r + 1 < this.HEIGHT && !this.cells[r + 1][c].visited)
            {
                possibleMoves.push(UP)
            }
            if (r - 1 >= 0 && !this.cells[r - 1][c].visited)
            {
                possibleMoves.push(DOWN)
            }


            if (possibleMoves.length === 0)
                return;
            /*let myChoice = possibleMoves[0]; // only 1
            if (possibleMoves.length >= 2) // multiple choice
                console.log(possibleMoves);*/
            const myChoice = possibleMoves[randomIntExclusive(0, possibleMoves.length)];

            if (myChoice === RIGHT) {
                this.cells[r][c].right = false;
                this.cells[r][c + 1].left = false;
                this.carvePaths(c + 1, r);
            }

            // You do likewise for other 3 directions
            if (myChoice === LEFT) {
                this.cells[r][c].left = false;
                this.cells[r][c - 1].right = false;
                this.carvePaths(c - 1, r);
            }


            if (myChoice === UP) {
                this.cells[r][c].top = false;
                this.cells[r + 1][c].bottom = false;
                this.carvePaths(c, r + 1);
            }

            if (myChoice === DOWN) {
                this.cells[r - 1][c].top = false;
                this.cells[r][c].bottom = false;
                this.carvePaths(c, r - 1);
            }
        }



    }

    draw(gl, shaderProgram) {
        for (let r = 0; r < this.HEIGHT; r++) {
            for (let c = 0; c < this.WIDTH; c++) {
                if(r === 0 && c === this.WIDTH-1)
                {
                    continue;
                }
                if(r === this.HEIGHT-1 && c === 0)
                {
                    continue;
                }
                this.cells[r][c].draw(gl, shaderProgram, c, r);
            }
        }
    }

} // end of class Maze

export { Maze };