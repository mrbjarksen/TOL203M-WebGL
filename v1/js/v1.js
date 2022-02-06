const colors = {
    red:     vec4(1, 0, 0, 1),
    yellow:  vec4(1, 1, 0, 1),
    purple:  vec4( 87/255,  8/255,  97/255, 1),
    skyblue: vec4( 97/255, 133/255, 248/255, 1),
    ground:  vec4(149/255,  75/255,  12/255, 1)
};

// ----- Terrain ----- //

const groundY = -0.6;
const numPlatforms = 2;

let terrain = {
    ground: [
        vec2(-1, -1),
        vec2(-1, groundY),
        vec2(1, -1),
        vec2(1, groundY)
    ],
    platforms: Array.from({length: numPlatforms}, getPlatform),
    color: colors.ground
};

function getPlatform() {
    const minX = -1,   maxX = 1,
          minW =  0.1, maxW = 0.8,
          minH =  0.1, maxH = 0.5;
    const xPos   = minX + (maxX - minX)*Math.random(),
          width  = minW + (maxW - minW)*Math.random(),
          height = minH + (maxH - minH)*Math.random();
    return [
        vec2(xPos - width/2, groundY),
        vec2(xPos - width/2, groundY + height),
        vec2(xPos + width/2, groundY),
        vec2(xPos + width/2, groundY + height)
    ]
}



// ----- Maríus ----- //

let marius = {
    points: [
        vec2(-0.03, 0  ),
        vec2( 0.03, 0.1),
        vec2(-0.03, 0.2)
    ],
    color: colors.red,
    pos: vec2(0, groundY),
    vel: vec2(0, 0),
    dir: 1,
    airbourne: false,
    width: 0.06,
    height: 0.2
};

function updateMarius(dt) {
    const g = 15;

    if (held.left === held.right) 
        marius.vel[0] = 0;
    else if (held.left)  
        marius.vel[0] = marius.dir = -1;
    else if (held.right) 
        marius.vel[0] = marius.dir = 1;

    if (marius.airbourne) 
        marius.vel[1] -= g * dt;
    if (held.jump && !marius.airbourne)
        marius.vel[1] = 5;
    if (!held.jump && marius.vel[1] >= 1)
        marius.vel[1] /= 2;

    marius.pos[0] += marius.vel[0] * dt;
    marius.pos[1] += marius.vel[1] * dt;

    handleCollisions();
}




// ----- Coins + score lines ----- //

const maxCoins = 6;
const coinGoal = 10;
let collectedCoins = 0;
const outside = vec2(10, 10);

let coins = {
    points: [
        vec2(-0.02, -0.02),
        vec2(-0.02,  0.02),
        vec2( 0.02, -0.02),
        vec2( 0.02,  0.02)
    ],
    color: colors.yellow,
    positions: new Array(maxCoins).fill(outside),
    lifetimes: Array.from({length: maxCoins}, getNewLifetime)
};

function getNewLifetime() {
    const minTime = 3, maxTime = 20;
    return minTime + (maxTime - minTime)*Math.random();
}

function getNewPosition() {
    const minX = -0.9, maxX = 0.9,
          minY = -0.2, maxY = 0.5;
    const xPos = minX + (maxX - minX)*Math.random(),
          yPos = minY + (maxY - minY)*Math.random();
    return vec2(xPos, yPos);
}

function updateCoins(dt) {
    for (let i = 0; i < maxCoins; i++) {
        coins.lifetimes[i] -= dt;
        if (coins.lifetimes[i] <= 0) {
            coins.lifetimes[i] = getNewLifetime();
            coins.positions[i] = 
                coins.positions[i] === outside 
                ? getNewPosition() 
                : outside;
        }
    }
}

let scoreLines = {
    points: Array.from({length: coinGoal}, (v, i) => [
        vec2(0.95 - 0.02*i, 0.95),
        vec2(0.95 - 0.02*i, 0.85)
    ]).flat(),
    color: colors.yellow
};



// ---- Enemies ---- //

const maxEnemies = 3;
const minScale = 0.5;
      maxScale = 1.5;
const minVel = 0.01;
      maxVel = 0.4;

function createEnemy() {
    const scale = minScale + (maxScale - minScale)*Math.random();
    const xvel = minVel + (maxVel - minVel)*Math.random();
    const side = Math.floor(2*Math.random());
    const xPos = side === 0 ? -1 : 1 - scale*0.08;

    return {
        points: [
            vec2(-scale*0.03, 0),
            vec2(0, scale*0.08),
            vec2(scale*0.03, 0)
        ],
        color: colors.purple,
        width:  scale*0.06,
        height: scale*0.08,
        pos: vec2(xPos, groundY),
        vel: vec2((1-2*side)*xvel, 0),
        airbourne: false
    };
}

let enemies = { data: Array.from({length: maxEnemies}, createEnemy) };

function updateEnemies(dt) {
    const g = 15;

    for (let i = 0; i < maxEnemies; i++) {
        if (enemies.data[i].airbourne) 
            enemies.data[i].vel[1] -= g * dt;

        enemies.data[i].pos[0] += enemies.data[i].vel[0] * dt;
        enemies.data[i].pos[1] += enemies.data[i].vel[1] * dt;

        wallCollision(enemies.data[i]);
    }
}



// ---- Collision handlers ---- //

function handleCollisions() {
    wallCollision(marius);
    coinCollision();
    enemyCollision();
}

function wallCollision(entity) {
    const eps = 1e-6;
    let standing = false;

    const eL = entity.pos[0] - entity.width/2,
          eR = entity.pos[0] + entity.width/2,
          eD = entity.pos[1];

    if (eL < -1) {
        entity.pos[0] = -1 + entity.width/2;
        if (entity !== marius) entity.vel[0] *= -1;
    }
    if (eR >  1) {
        entity.pos[0] =  1 - entity.width/2;
        if (entity !== marius) entity.vel[0] *= -1;
    }

    for (const terr of [terrain.ground, ...terrain.platforms]) {
        const tL = terr[0][0], tR = terr[3][0], tU = terr[3][1];
        
        if (eD - eps < tU && eL < tR && eR > tL) standing = true;

        if (eL >= tR || eR <= tL || eD >= tU) continue;

        if (eD < tU && entity.vel[1] < 0)
            entity.pos[1] = tU, entity.vel[1] = 0, entity.airbourne = false;

        if (eR > tR) {
            entity.pos[0] = tR + entity.width/2;
            if (entity !== marius) entity.vel[0] *= -1;
        }
        else if (eL < tL) {
            entity.pos[0] = tL - entity.width/2;
            if (entity !== marius) entity.vel[0] *= -1;
        }
        else entity.pos[1] = tU;
    }

    if (!standing) entity.airbourne = true;
}

function coinCollision() {
    const mL = marius.pos[0] - marius.width/2,
          mR = marius.pos[0] + marius.width/2,
          mD = marius.pos[1],
          mU = marius.pos[1] + marius.height;

    coins.positions.forEach((coinpos, i) => {
        const cL = coins.points[0][0] + coinpos[0],
              cR = coins.points[3][0] + coinpos[0],
              cD = coins.points[0][1] + coinpos[1],
              cU = coins.points[3][1] + coinpos[1];
        if (mL >= cR || mR <= cL || mD >= cU || mU <= cD) return;
        coins.positions[i] = outside;
        coins.lifetimes[i] = getNewLifetime();
        collectedCoins++;
        if (collectedCoins === coinGoal)
            if (!alert("Maríus sigrar!")) window.location.reload();
    })
}

function enemyCollision() {
    const mL = marius.pos[0] - marius.width/2,
          mR = marius.pos[0] + marius.width/2,
          mD = marius.pos[1],
          mU = marius.pos[1] + marius.height;

    enemies.data.forEach((enemy) => {
        const eL = enemy.pos[0] - enemy.width/2,
              eR = enemy.pos[0] + enemy.width/2,
              eD = enemy.pos[1],
              eU = enemy.pos[1] + enemy.height;
        if (mL >= eR || mR <= eL || mD >= eU || mU <= eD) return;
        if (!alert("Maríus tapaði...")) window.location.reload();
    })
}



// ---- WebGL ---- //

let gl, program;
let uniforms;
let lastTime;
let held = { left: false, right: false, jump: false };

window.onload = () => {
    initWebGL();
    initBuffers();
    initAttributes();
    initUniforms();
    initEventListeners();
    render();
}

function initWebGL() {
    const canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) alert("WebGL is not available");

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(...colors.skyblue);
    gl.lineWidth(3);

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);
}

function initBuffers() {
    const initBuffer = (obj, verts) => {
        obj.buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, obj.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(verts), gl.STATIC_DRAW);
    }

    initBuffer(terrain, [terrain.ground, ...terrain.platforms].flat());
    initBuffer(marius, marius.points);
    initBuffer(coins, new Array(maxCoins).fill(coins.points).flat(1));
    initBuffer(scoreLines, scoreLines.points);
    initBuffer(enemies, Array.from({length: maxEnemies}, (v, i) => enemies.data[i].points).flat(1))
}

function initAttributes() {
    const vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
}

function initUniforms() {
    uniforms = {
        pos:   { type: "2fv", value: marius.pos   },
        dir:   { type: "1f",  value: marius.dir   },
        color: { type: "4fv", value: marius.color }
    };
    for (const u in uniforms)
        uniforms[u].location = gl.getUniformLocation(program, u);
}

function setUniform({location, type, value}) {
    switch (type) {
        case "1f":  gl.uniform1f (location,         value ); break;
        case "2fv": gl.uniform2fv(location, flatten(value)); break;
        case "4fv": gl.uniform4fv(location, flatten(value)); break;
        default: console.log("type \"" + type + "\" not recognized");
    }
}

function initEventListeners() {
    const setheld = { keydown: true, keyup: false };
    for (const target in setheld)
        window.addEventListener(target, (e) => {
            if (e.repeat) return;
            switch (e.code) {
                case "KeyA":
                case "ArrowLeft":
                    held.left = setheld[target];
                    break;
                case "KeyD":
                case "ArrowRight":
                    held.right = setheld[target];
                    break;
                case "KeyW":
                case "ArrowUp":
                case "Space":
                    held.jump = setheld[target];
                    break;
            }
        })
}

function render(timestamp) {
    gl.clear(gl.COLOR_BUFFER_BIT);
    drawTerrain();

    if (lastTime !== undefined) {
        const dt = (timestamp - lastTime) / 1000
        updateMarius(dt);
        updateCoins(dt);
        updateEnemies(dt);
    }
    lastTime = timestamp

    drawMarius();
    for (let i = 0; i < maxCoins; i++)
        if (coins.positions[i] !== outside) drawCoin(i);
    drawScoreLines();
    for (let i = 0; i < maxEnemies; i++)
        drawEnemy(i);

    window.requestAnimationFrame(render);
}

function drawTerrain() {
    uniforms.pos.value   = vec2(0, 0);
    uniforms.dir.value   = 1;
    uniforms.color.value = terrain.color;
    for (const u in uniforms)
        setUniform(uniforms[u])

    const gpts = terrain.ground.length,
          ppts = terrain.platforms[0].length;

    gl.bindBuffer(gl.ARRAY_BUFFER, terrain.buffer);
    initAttributes();

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, gpts);
    for (let i = 0; i < numPlatforms; i++)
        gl.drawArrays(gl.TRIANGLE_STRIP, gpts + ppts*i, ppts);
}

function drawMarius() {
    uniforms.pos.value   = marius.pos;
    uniforms.dir.value   = marius.dir;
    uniforms.color.value = marius.color;
    for (const u in uniforms)
        setUniform(uniforms[u]);

    const mpts = marius.points.length;

    gl.bindBuffer(gl.ARRAY_BUFFER, marius.buffer);
    initAttributes();

    gl.drawArrays(gl.TRIANGLES, 0, mpts);
}

function drawCoin(i) {
    uniforms.pos.value   = coins.positions[i];
    uniforms.dir.value   = 1;
    uniforms.color.value = coins.color;
    for (const u in uniforms)
        setUniform(uniforms[u]);

    const cpts = coins.points.length;

    gl.bindBuffer(gl.ARRAY_BUFFER, coins.buffer);
    initAttributes();

    gl.drawArrays(gl.TRIANGLE_STRIP, cpts*i, cpts);
}

function drawScoreLines() {
    uniforms.pos.value   = vec2(0, 0);
    uniforms.dir.value   = 1;
    uniforms.color.value = scoreLines.color;
    for (const u in uniforms)
        setUniform(uniforms[u]);

    gl.bindBuffer(gl.ARRAY_BUFFER, scoreLines.buffer);
    initAttributes();

    gl.drawArrays(gl.LINES, 0, 2*collectedCoins);
}

function drawEnemy(i) {
    uniforms.pos.value   = enemies.data[i].pos;
    uniforms.dir.value   = 1;
    uniforms.color.value = enemies.data[i].color;
    for (const u in uniforms)
        setUniform(uniforms[u]);

    const epts = enemies.data[0].points.length;

    gl.bindBuffer(gl.ARRAY_BUFFER, enemies.buffer);
    initAttributes();

    gl.drawArrays(gl.TRIANGLES, epts*i, epts);
}
