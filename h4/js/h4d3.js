window.onload = () => {
    initWebGL();
    initData();
    initEventListeners();
    render();
}

// ----- WebGL ---- //

let gl, program;
let translation, rotation, scaling;
let rotX = 0, rotY = 0;

function initWebGL() {
    const canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) alert("WebGL is not available");

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1, 1, 1, 1);

    gl.enable(gl.DEPTH_TEST);

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    const rotM = mult(rotateX(rotX), rotateY(rotY));
    gl.uniformMatrix4fv(rotation, false, flatten(rotM));

    drawCuboid(0,  0   , -0.1, /**/ 1  , 9/16, 0.1); // Skjárinn
    drawCuboid(0, -0.25,  0  , /**/ 0.1, 0.5 , 0.1); // Botninn
    drawCuboid(0, -0.55,  0  , /**/ 0.5, 0.1 , 0.5); // Stöngin

    requestAnimationFrame(render);
}

function drawCuboid(x, y, z, w, h, l) {
    const transM = translate(x, y, z),
          scaleM = scalem(w, h, l);
    gl.uniformMatrix4fv(translation, false, flatten(transM));
    gl.uniformMatrix4fv(scaling, false, flatten(scaleM));
    gl.drawArrays(gl.TRIANGLES, 0, 36);
}

// ---- Data ---- //

const cuboid = {
    vertices: [
        vec3(-0.5, -0.5,  0.5),
        vec3(-0.5,  0.5,  0.5),
        vec3( 0.5,  0.5,  0.5),
        vec3( 0.5, -0.5,  0.5),
        vec3(-0.5, -0.5, -0.5),
        vec3(-0.5,  0.5, -0.5),
        vec3( 0.5,  0.5, -0.5),
        vec3( 0.5, -0.5, -0.5)
    ],
    colors: [
        [0.0, 0.0, 0.0, 1.0],  // black
        [1.0, 0.0, 0.0, 1.0],  // red
        [1.0, 1.0, 0.0, 1.0],  // yellow
        [0.0, 1.0, 0.0, 1.0],  // green
        [0.0, 0.0, 1.0, 1.0],  // blue
        [1.0, 0.0, 1.0, 1.0],  // magenta
        [0.0, 1.0, 1.0, 1.0],  // cyan
        [1.0, 1.0, 1.0, 1.0]   // white
    ],
    indexOrder: [
        [1, 0, 3, 1, 3, 2],
        [2, 3, 7, 2, 7, 6],
        [3, 0, 4, 3, 4, 7],
        [6, 5, 1, 6, 1, 2],
        [4, 5, 6, 4, 6, 7],
        [5, 4, 0, 5, 0, 1]
    ],
}

function initData() {
    const pc = makeCube();
    const points = pc[0], colors = pc[1];

    initBuffer(colors, "color", 4);
    initBuffer(points, "coordinates", 3);

    translation = gl.getUniformLocation(program, "translation");
    rotation = gl.getUniformLocation(program, "rotation");
    scaling = gl.getUniformLocation(program, "scaling" );
}

function makeCube() {
    let points = [], colors = [];
    for (const side of cuboid.indexOrder)
        for (const i of side)
            points.push(cuboid.vertices[i]),
            colors.push(cuboid.colors[side[0]]);
    return [points, colors]
}

function initBuffer(data, name, size) {
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(data), gl.STATIC_DRAW);

    const location = gl.getAttribLocation(program, name);
    gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(location);
}

// ---- Mouse ---- //

function initEventListeners() {
    let move = false;
    let refX, refY;

    window.addEventListener("mousedown", (e) => {
        e.preventDefault();
        move = true;
        refX = e.offsetX, refY = e.offsetY;
    });

    window.addEventListener("mouseup", (e) => {
        move = false;
    });

    window.addEventListener("mousemove", (e) => {
        if (!move) return;
        rotX += e.offsetY - refY;
        rotY += e.offsetX - refX;
        rotX %= 360, rotY %= 360;
        refX = e.offsetX, refY = e.offsetY;
    });
}

