window.onload = () => {
    initWebGL();
    initData();
    initEventListeners();
    render();
}

// ----- WebGL ---- //

let gl, program;
let modelView, rotation;
let rotX = 0, rotY = 0;

function initWebGL() {
    const canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) alert("WebGL is not available");

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.9, 1, 1, 1);

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    const rotM  = mult(rotateX(rotX), rotateY(rotY));
    gl.uniformMatrix4fv(rotation, false, flatten(rotM));

    gl.drawArrays(gl.TRIANGLES, 0, 36);

    requestAnimationFrame(render);
}

// ---- Data ---- //

const light = {
    direction: { type: "vec3", value: vec3(0, 0, 1)       },
    ambient:   { type: "vec4", value: vec4(0.4, 0.4, 0.4, 1) },
    diffuse:   { type: "vec4", value: vec4(0.8, 0.8, 0.8, 1)       },
    specular:  { type: "vec4", value: vec4(1, 1, 1, 1)       }
};

const cube = {
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
    indexOrder: [
        [1, 0, 3, 1, 3, 2],
        [2, 3, 7, 2, 7, 6],
        [3, 0, 4, 3, 4, 7],
        [6, 5, 1, 6, 1, 2],
        [4, 5, 6, 4, 6, 7],
        [5, 4, 0, 5, 0, 1]
    ],
    normals: [
        vec3(0, 0, 1),
        vec3(1, 0, 0),
        vec3(0, -1, 0),
        vec3(0, 1, 0),
        vec3(0, 0, -1),
        vec3(-1, 0, 0)
    ],
    material: {
        ambient:   { type: "vec4",  value: vec4(1, 0.8, 0, 1)   },
        diffuse:   { type: "vec4",  value: vec4(1, 0.8, 0, 1) },
        specular:  { type: "vec4",  value: vec4(1, 1, 1, 1)   },
        shininess: { type: "float", value: 10                 }
    }
};

/*
cube.normals = cube.indexOrder.map(vs => {
    const p1 = cube.vertices[vs[0]], p2 = cube.vertices[vs[1]], p3 = cube.vertices[vs[2]];
    const v1 = subtract(p2, p1), v2 = subtract(p3, p1);
    return cross(v1, v2);
});
*/

function initData() {
    const pn = makeCube();
    const points = pn[0], normals = pn[1];

    console.log(points, normals);

    initBuffer("coordinates", points, 3);
    initBuffer("normal", normals, 3);

    modelView = gl.getUniformLocation(program, "modelView");
    rotation  = gl.getUniformLocation(program, "rotation");

    initUniform("projection", "mat4", perspective(50, 1, 0.2, 100))
    initUniform("modelView", "mat4", lookAt(vec3(0, 0, -5), vec3(0, 0, 0), vec3(0, 1, 0)));
    initUniform("viewer", "vec3", vec3(0, 0, -5));

    initUniformStruct("light", light);
    initUniformStruct("material", cube.material);
}

function makeCube() {
    let points = [], normals = [];
    for (let i = 0; i < 6; i++) {
        const side = cube.indexOrder[i];
        for (const j of side)
            points.push(cube.vertices[j]),
            normals.push(cube.normals[i]);
    }
    return [points, normals]
}

function initBuffer(name, data, size) {
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(data), gl.STATIC_DRAW);

    const location = gl.getAttribLocation(program, name);
    gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(location);
}

function initUniform(name, type, value) {
    const location = gl.getUniformLocation(program, name);
    switch (type) {
        case "vec3":  gl.uniform3fv(location, flatten(value)); break;
        case "vec4":  gl.uniform4fv(location, flatten(value)); break;
        case "float": gl.uniform1f(location, value); break;
        case "mat4":  gl.uniformMatrix4fv(location, false, flatten(value)); break;
        default: console.log(`\`initUniformStruct' not implemented for type ${type}`);
    }
}

function initUniformStruct(name, struct) {
    for (const [key, {type, value}] of Object.entries(struct))
        initUniform(`${name}.${key}`, type, value)
}

// ---- Mouse ---- //

function initEventListeners() {
    let move = false;
    let refX, refY;

    window.addEventListener("mousedown", (e) => {
        e.preventDefault();
        move = true;
        refX = e.clientX, refY = e.clientY;
    });

    window.addEventListener("mouseup", (e) => {
        move = false;
    });

    window.addEventListener("mousemove", (e) => {
        if (!move) return;
        rotX += e.clientY - refY;
        rotY -= e.clientX - refX;
        rotX %= 360, rotY %= 360;
        refX = e.clientX, refY = e.clientY;
    });
}

