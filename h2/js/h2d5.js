var canvas;
var gl;


var maxNumPoints = 200;
var index = 0;

const triRadius = 0.03

window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.0, 0.0, 1.0, 1.0 );

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, 8*3*maxNumPoints, gl.DYNAMIC_DRAW);
    
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    canvas.addEventListener("mousedown", (e) => {
        switch (e.button) {
            case 0:
                gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer);
                var center = vec2(2*e.offsetX/canvas.width-1, 2*(canvas.height-e.offsetY)/canvas.height-1);
                const angle = (2*Math.PI/3)*Math.random()
                let ts = [];
                for (let k = 0; k < 3; k++) {
                    const u = vec2(Math.cos(angle + k*2*Math.PI/3), Math.sin(angle + k*2*Math.PI/3));
                    const t = add(center, scale(triRadius, u));
                    ts.push(t);
                }
                gl.bufferSubData(gl.ARRAY_BUFFER, 8*index, flatten(ts));
                index += 3;
                break;
            case 2:
                index = 0;
        }
    });

    render();
}


function render() {
    
    gl.clear( gl.COLOR_BUFFER_BIT );
    gl.drawArrays( gl.TRIANGLES, 0, index );

    window.requestAnimFrame(render);
}

