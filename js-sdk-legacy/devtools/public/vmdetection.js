var VMDetectionGPU = function () {
    function VMDetectionGPUClass() {

        var _I = this;
        var addedCanvasForVm = false;
        var info = { vmType: "", graphicCard: "", angle: ""};
        function addCanvasForVM() {
            if (addedCanvasForVm) {
                return;
            }
            //if (isUndefinedNull(document.body)) { return -1; }
            var mycanvas = document.createElement("canvas");
            mycanvas.id = "webgl";
            mycanvas.height = 1;
            mycanvas.width = 1;
            mycanvas.opacity = "0.003";
            mycanvas.style.position = 'absolute';
            mycanvas.style.zIndex = '-1';
            mycanvas.style.display = 'none';
            document.body.appendChild(mycanvas);
            addedCanvasForVm = true;

        }

        function browser_detect_WebGL() {
            if (window.WebGLRenderingContext || window.WebGL2RenderingContext) {
                return true;
            }
            return false;

        }

        function shaderProgram(gl, vs, fs) {
            var prog = gl.createProgram();
            var addshader = function (type, source) {
                var s = gl.createShader(type == "vertex" ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER);
                gl.shaderSource(s, source);
                gl.compileShader(s);
                if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
                    return 'Protocol.VMResult.Not_processed_compiled';
                }
                gl.attachShader(prog, s);
            };
            addshader("vertex", vs);
            addshader("fragment", fs);
            gl.linkProgram(prog);
            if (!gl.getProgramParameter(prog, gl.LINK_STATUS))
                return 'Not_processed_linking';
            return prog;
        }

        function attributeSetFloats(gl, prog, attr_name, rsize, arr) {
            gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(arr), gl.STATIC_DRAW);
            var attr = gl.getAttribLocation(prog, attr_name);
            gl.enableVertexAttribArray(attr);
            gl.vertexAttribPointer(attr, rsize, gl.FLOAT, false, 0, 0);
        }

        function  draw() {
            var gl;
            try {
                gl = document.getElementById("webgl").getContext("experimental-webgl");
                if (!gl) {
                    info.vmType = 'Not_processed';
                    return;
                }
            } catch (err) {
                info.vmType = 'Vm_found';
                return;
            }
            gl.clearColor(0.8, 0.8, 0.8, 1);
            gl.clear(gl.COLOR_BUFFER_BIT);
            var prog = shaderProgram(gl, "attribute vec3 pos;" + "void main() {" + "\tgl_Position = vec4(pos, 2.0);" + "}", "void main() {" + "\tgl_FragColor = vec4(0.5, 0.5, 1.0, 1.0);" + "}");
            gl.useProgram(prog);
            attributeSetFloats(gl, prog, "pos", 3, [-1, 0, 0, 0, 1, 0, 0, -1, 0, 1, 0, 0]);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            var dbgRenderInfo = gl.getExtension("WEBGL_debug_renderer_info");
            if (dbgRenderInfo != null) {
                info.graphicCard = gl.getParameter(dbgRenderInfo.UNMASKED_RENDERER_WEBGL);
            }
            info.vmType = 'NotVM';
            info.angle = getAngle(gl);
        }

        //getAngle taken from - http://analyticalgraphicsinc.github.io/webglreport/?v=1
        function describeRange(value) {
            return '[' + value[0] + ', ' + value[1] + ']';
        }
        function isPowerOfTwo(n) {
            return (n !== 0) && ((n & (n - 1)) === 0);
        }

        function getAngle(gl) {
            var lineWidthRange = describeRange(gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE));

            // Heuristic: ANGLE is only on Windows, not in IE, and does not implement line width greater than one.
            var angle = (navigator.platform === 'Win32') &&
                (gl.getParameter(gl.RENDERER) !== 'Internet Explorer') &&
                (lineWidthRange === describeRange([1,1]));

            if (angle) {
                // Heuristic: D3D11 backend does not appear to reserve uniforms like the D3D9 backend, e.g.,
                // D3D11 may have 1024 uniforms per stage, but D3D9 has 254 and 221.
                //
                // We could also test for WEBGL_draw_buffers, but many systems do not have it yet
                // due to driver bugs, etc.
                if (isPowerOfTwo(gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS)) && isPowerOfTwo(gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS))) {
                    return 'D3D11';
                } else {
                    return 'D3D9';
                }
            }

            return 'No';
        }

        _I.getVM = function () {
            try {
                if (browser_detect_WebGL() == 'undefined') {
                    info.vmType = 'WebGL_not_supported';
                }
                else {
                    addCanvasForVM();
                    draw();
                }
            } catch (e) {
                info.vmType = 'UnknownError';
                return info;
            }
            return info;
        }

        _I.removeCanvas = function () {
            var webgl = document.getElementById('webgl');
            document.body.removeChild(webgl);
            addedCanvasForVm = false;
        }

    }
    return new VMDetectionGPUClass();
}();

function getVM () {
    var res = document.getElementById('result');
    //document.getElementById('result').innerHTML = JSON.stringify(VMDetectionGPU.getVM());
    console.log(JSON.stringify(VMDetectionGPU.getVM()));

    setTimeout(function () {
        VMDetectionGPU.removeCanvas();
    }, 5000);


}