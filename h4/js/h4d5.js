window.onload = () => {
    initWebGL();
    initData();
    initEventListeners();
    render();
}

// ----- WebGL ---- //

let gl, program;
let sceneRotation, translation, rotation, scaling;
let lastTime;

let rotX = 0, rotY = 0; // °
let rotEarthY = 0, rotEarthD = 0,
    rotMoonY  = 0, rotMoonD  = 0,
    rotSatY   = 0, rotSatD   = 0; // °

let speed = 5 // °/s (rétt gildi er ~1/240)
const earthY = 10; // dagar (rétt gildi er ~365.242)
const moonY = 27.32; // dagar (rétt gildi er ~27.32)
const moonD = 27.32; // dagar (rétt gildi er ~27.32)
const satY = 50; // tungldagar
const satD = 30; // tungldagar

const earthObliq = 23.44; // °
const lunarObliq = 1.54; // °
const lunarOrbitalIncl = 5.14; // °
const satObliq = 45; // °
const satOrbitalIncl = 90; // °

function initWebGL() {
    const canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) alert("WebGL is not available");

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.9, 1, 1, 1);

    gl.enable(gl.DEPTH_TEST);

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);
}

function render(timestamp) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if (!timestamp || !lastTime) lastTime = timestamp;
    else {
        const dt = (timestamp - lastTime) / 1000;
        lastTime = timestamp
        
        rotEarthY += speed*dt;
        rotEarthD += earthY*speed*dt;
        rotMoonY  += moonD*speed*dt;
        rotMoonD  += moonY*speed*dt;
        rotSatY   += satD*speed*dt;
        rotSatD   += satY*speed*dt;

        rotEarthD %= 360, rotEarthY %= 360;
        rotMoonY  %= 360, rotSatY   %= 360;
        rotSatY   %= 360, rotSatD   %= 360;
    }

    const sceneRotM = mult(rotateX(rotX), rotateY(rotY));
    gl.uniformMatrix4fv(sceneRotation, false, flatten(sceneRotM));

    drawSun();
    drawEarth();
    drawMoon();
    drawSattelite();

    requestAnimationFrame(render);
}

function drawSun() {
    drawCuboid(
        vec3(0, 0, 0),
        vec3(0, 0, 0),
        vec3(0.5, 0.5, 0.5)
    );
}

const earthPos = () => {
    const start = vec4(0.9, 0, 0, 0),
          rot = rotateY(rotEarthY),
          pos = mult(rot, start);
    return pos;
};

function drawEarth() {
    const pos = earthPos();
    drawCuboid(
        vec3(pos[0], pos[1], pos[2]),
        vec3(0, rotEarthD, earthObliq),
        vec3(0.1, 0.1, 0.1)
    );
}

const moonPos = () => {
    const start = vec4(0.18, 0, 0, 0),
          rot = mult(rotateZ(lunarOrbitalIncl), rotateY(rotMoonY)),
          pos = mult(rot, start);
    return add(pos, earthPos());
};

function drawMoon() {
    const pos = moonPos();
    drawCuboid(
        vec3(pos[0], pos[1], pos[2]),
        vec3(0, rotMoonD, lunarObliq),
        vec3(0.04, 0.04, 0.04)
    );
}

const satPos = () => {
    const start = vec4(0.09, 0, 0, 0),
          rot = mult(rotateZ(satOrbitalIncl), rotateY(rotSatY)),
          pos = mult(rot, start);
    return add(pos, moonPos());
};

function drawSattelite() {
    const pos = satPos();
    drawCuboid(
        vec3(pos[0], pos[1], pos[2]),
        vec3(0, rotSatD, satObliq),
        vec3(0.02, 0.02, 0.02)
    );
}

function drawCuboid(t, r, s) {
    const transM = translate(t),
          rotM = mult(rotateZ(r[2]), mult(rotateY(r[1]), rotateX(r[0])));
          scaleM = scalem(s);

    gl.uniformMatrix4fv(translation, false, flatten(transM));
    gl.uniformMatrix4fv(rotation, false, flatten(rotM));
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

    sceneRotation = gl.getUniformLocation(program, "sceneRotation");
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

    window.addEventListener("keydown", (e) => {
        switch (e.code) {
            case "ArrowUp":   speed *= 1.1; break;
            case "ArrowDown": speed /= 1.1; break;
        }
    });
}

