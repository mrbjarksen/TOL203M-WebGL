var canvas;
var gl;

var box = vec2( 0.0, 0.0 );

var dX;
var dY;

var maxX = 1.0;
var maxY = 1.0;

var boxRad = 0.05;

var vertices = new Float32Array([-0.05, -0.05, 0.05, -0.05, 0.05, 0.05, -0.05, 0.05]);

window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.8, 0.8, 0.8, 1.0 );
    
    dX = Math.random()*0.1-0.05;
    dY = Math.random()*0.1-0.05;

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.DYNAMIC_DRAW );

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    locBox = gl.getUniformLocation(program, "boxPos");
    locRad = gl.getUniformLocation(program, "scale");

    window.addEventListener("keydown", function(e){
        switch(e.code) {
            case "ArrowLeft":  dX     -= 0.01; break;
            case "ArrowRight": dX     += 0.01; break;
            case "ArrowUp":    boxRad *= 1.1;  break;
            case "ArrowDown":  boxRad /= 1.1;  break;
        }
    } );

    render();
}


function render() {
    
    if (Math.abs(box[0] + dX) > maxX - boxRad) dX = -dX;
    if (Math.abs(box[1] + dY) > maxY - boxRad) dY = -dY;

    box[0] += dX;
    box[1] += dY;
    
    gl.clear( gl.COLOR_BUFFER_BIT );

    gl.uniform2fv(locBox, flatten(box));
    gl.uniform1f(locRad, boxRad/0.05);

    gl.drawArrays( gl.TRIANGLE_FAN, 0, 4 );

    window.requestAnimFrame(render);
}
