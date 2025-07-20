import { x64hash128 } from "../../technicalServices/Hash";
import Log from '../../technicalServices/log/Logger';

/**
 * WebGLFingerprint class for generating unique browser fingerprints based on WebGL capabilities
 * and rendering characteristics.
 */
export class WebGLFingerprint {
  /**
   * Creates a new WebGLFingerprint instance and initializes the fingerprinting process.
   */
  constructor() {
    // List of potential WebGL context names in order of preference
    this.contextNames = [
      "webgl2",
      "experimental-webgl2",
      "webgl",
      "experimental-webgl",
      "moz-webgl",
      "webkit-3d",
      "webgl2-compute"
    ];

    // Store gathered context data
    this.data = {};
    // Keep track of context names that returned a valid context
    this.availableContexts = [];
    
    // Cache for computed hashes
    this._hashCache = {
      json: null,
      image: null
    };
    
    // Flag to track initialization status
    this._initialized = false;
  }
  
  /**
   * Start the WebGL fingerprinting process asynchronously
   * @returns {Promise<void>} A promise that resolves when fingerprinting is complete
   */
  async start() {
    if (this._initialized) {
      return; // Already initialized
    }
    
    try {
      // Gather info for each context
      await this._initializeContexts();
      
      // Compute hashes
      this._computeHashes();
      
      this._initialized = true;
    } catch (error) {
      Log.debug("Error during WebGL fingerprinting:", error);
      throw error;
    }
  }

  /**
   * Initialize WebGL contexts and gather data
   * @private
   * @returns {Promise<void>} A promise that resolves when initialization is complete
   */
  async _initializeContexts() {
    const contextPromises = this.contextNames.map(async (ctxName) => {
      try {
        const info = await this.getContextData(ctxName);
        if (info) {
          this.availableContexts.push(ctxName);
          this.data[ctxName] = info;
        }
      } catch (error) {
        Log.debug(`Error retrieving context data for ${ctxName}:`, error);
      }
    });
    
    // Wait for all context initializations to complete
    await Promise.all(contextPromises);
    
    Log.debug("WebGL fingerprint data:", this.data);
  }
  
  /**
   * Compute JSON and image hashes from collected data
   * @private
   */
  _computeHashes() {
    // Compute JSON hash from the collected data
    this.jsonString = JSON.stringify(this.data);
    this._hashCache.json = x64hash128(this.jsonString);

    // Compute image hash from a rendered canvas if at least one valid context is available
    this._hashCache.image = this.availableContexts.length > 0 ? this.computeImageHash() : null;
  }

  /**
   * Get the JSON hash of the WebGL fingerprint data
   * @returns {string} The computed hash
   */
  get jsonHash() {
    return this._hashCache.json;
  }

  /**
   * Get the image hash of the WebGL fingerprint data
   * @returns {string|null} The computed hash or null if not available
   */
  get imageHash() {
    return this._hashCache.image;
  }

  /**
   * Creates a canvas, gets a WebGL context, and gathers various parameters,
   * including additional hardware limits to boost uniqueness.
   *
   * @param {string} contextType - A potential WebGL context name.
   * @returns {Promise<Object|null>} A promise that resolves to collected WebGL parameters or null.
   */
  async getContextData(contextType) {
    return new Promise((resolve) => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 256;
        canvas.height = 128;
        canvas.style = canvas.style ?? {};
        canvas.style.backgroundColor = "#555";
        canvas.style.borderRadius = "4px";

        const gl = canvas.getContext(contextType);
        if (!gl) {
          resolve(null);
          return;
        }

        const info = {};

        // Capture and group context attributes
        const attrs = gl.getContextAttributes();
        if (attrs && Object.keys(attrs).length > 0) {
          info.contextAttributes = attrs;
        }

        // Additional color space info
        info.drawingBufferColorSpace = gl.drawingBufferColorSpace;
        info.unpackColorSpace = gl.unpackColorSpace;

        // Debug renderer info
        const debugExt = gl.getExtension("WEBGL_debug_renderer_info");
        if (debugExt) {
          info.UNMASKED_RENDERER_WEBGL = gl.getParameter(debugExt.UNMASKED_RENDERER_WEBGL);
          info.UNMASKED_VENDOR_WEBGL = gl.getParameter(debugExt.UNMASKED_VENDOR_WEBGL);
        }

        // Shader precision formats
        info.VERTEX_SHADER_PRECISION = this.getShaderPrecision(gl, gl.VERTEX_SHADER);
        info.FRAGMENT_SHADER_PRECISION = this.getShaderPrecision(gl, gl.FRAGMENT_SHADER);

        // Additional extensions and limits
        const drawBuffersExt = gl.getExtension("WEBGL_draw_buffers");
        info.MAX_DRAW_BUFFERS_WEBGL = drawBuffersExt
          ? gl.getParameter(drawBuffersExt.MAX_DRAW_BUFFERS_WEBGL)
          : null;
        const anisoExt =
          gl.getExtension("EXT_texture_filter_anisotropic") ||
          gl.getExtension("WEBKIT_EXT_texture_filter_anisotropic") ||
          gl.getExtension("MOZ_EXT_texture_filter_anisotropic");
        info.MAX_TEXTURE_MAX_ANISOTROPY_EXT = anisoExt
          ? gl.getParameter(anisoExt.MAX_TEXTURE_MAX_ANISOTROPY_EXT)
          : null;

        // Query additional hardware limits
        info.MAX_TEXTURE_IMAGE_UNITS = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
        info.MAX_VERTEX_TEXTURE_IMAGE_UNITS = gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS);
        info.MAX_COMBINED_TEXTURE_IMAGE_UNITS = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);
        info.ALIASED_LINE_WIDTH_RANGE = gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE);
        info.ALIASED_POINT_SIZE_RANGE = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE);
        info.SAMPLES = gl.getParameter(gl.SAMPLES);
        info.RENDERER = gl.getParameter(gl.RENDERER);
        info.VENDOR = gl.getParameter(gl.VENDOR);
        info.VERSION = gl.getParameter(gl.VERSION);
        info.SHADING_LANGUAGE_VERSION = gl.getParameter(gl.SHADING_LANGUAGE_VERSION);

        // More hardware details
        info.MAX_CUBE_MAP_TEXTURE_SIZE = gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE);
        info.MAX_TEXTURE_SIZE = gl.getParameter(gl.MAX_TEXTURE_SIZE);
        info.MAX_RENDERBUFFER_SIZE = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE);
        info.DEPTH_BITS = gl.getParameter(gl.DEPTH_BITS);
        info.STENCIL_BITS = gl.getParameter(gl.STENCIL_BITS);
        info.MAX_VERTEX_ATTRIBS = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
        info.MAX_VIEWPORT_DIMS = gl.getParameter(gl.MAX_VIEWPORT_DIMS);
        info.MAX_FRAGMENT_UNIFORM_VECTORS = gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS);
        info.MAX_VERTEX_UNIFORM_VECTORS = gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS);

        // Supported extensions sorted for consistency
        const extensions = gl.getSupportedExtensions();
        info.extensions = extensions ? extensions.sort() : [];

        resolve(info);
      } catch (error) {
        Log.debug(`Error in getContextData for ${contextType}:`, error);
        resolve(null);
      }
    });
  }

  /**
   * Returns shader precision details for a given shader type.
   *
   * @param {WebGLRenderingContext} gl - The WebGL context.
   * @param {number} shaderType - gl.VERTEX_SHADER or gl.FRAGMENT_SHADER.
   * @returns {Object|null} Precision details or null.
   */
  getShaderPrecision(gl, shaderType) {
    try {
      const high = gl.getShaderPrecisionFormat(shaderType, gl.HIGH_FLOAT);
      const medium = gl.getShaderPrecisionFormat(shaderType, gl.MEDIUM_FLOAT);
      const used = high.precision !== 0 ? high : medium;
      return {
        rangeMin: used.rangeMin,
        rangeMax: used.rangeMax,
        precision: used.precision
      };
    } catch (e) {
      return null;
    }
  }

  /**
   * Renders a complex scene (arc and rectangle) and returns a hash
   * based on the pixel data and WebGL-specific parameters.
   *
   * @returns {string|null} The computed hash or an error string.
   */
  computeImageHash() {
    if (this.availableContexts.length === 0) return null;

    // Use the first available context
    const contextType = this.availableContexts[0];
    const canvas = document.createElement("canvas");
    // Increase resolution for finer differences
    canvas.width = 512;
    canvas.height = 256;
    
    const gl = canvas.getContext(contextType);
    if (!gl) return null;

    // Resources to clean up
    const resources = {
      program: null,
      vertexShader: null,
      fragmentShader: null,
      buffer: null
    };

    try {
      gl.viewport(0, 0, canvas.width, canvas.height);

      // Vertex shader
      const vertexShaderSource = `
        attribute vec2 attrVertex;
        attribute vec4 attrColor;
        varying vec4 varyinColor;
        uniform mat4 transform;
        void main(){
          varyinColor = attrColor;
          gl_Position = transform * vec4(attrVertex, 0.0, 1.0);
        }
      `;

      // Fragment shader
      const fragmentShaderSource = `
        precision mediump float;
        varying vec4 varyinColor;
        void main(){
          gl_FragColor = varyinColor;
        }
      `;

      // Helper to compile a shader
      const compileShader = (type, source) => {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          Log.debug((type === gl.VERTEX_SHADER ? "Vertex" : "Fragment") +
            " shader error:", gl.getShaderInfoLog(shader));
        }
        return shader;
      };

      // Compile and link shaders
      const program = gl.createProgram();
      resources.program = program;
      
      const vShader = compileShader(gl.VERTEX_SHADER, vertexShaderSource);
      resources.vertexShader = vShader;
      
      const fShader = compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
      resources.fragmentShader = fShader;
      
      gl.attachShader(program, vShader);
      gl.attachShader(program, fShader);
      gl.linkProgram(program);
      
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        Log.debug("Program link error:", gl.getProgramInfoLog(program));
      }
      
      gl.useProgram(program);

      // Locate attributes and uniforms
      const vertexPosAttrib = gl.getAttribLocation(program, "attrVertex");
      const colorAttrib = gl.getAttribLocation(program, "attrColor");
      const transformUniform = gl.getUniformLocation(program, "transform");

      gl.enableVertexAttribArray(vertexPosAttrib);
      gl.enableVertexAttribArray(colorAttrib);

      // Set a uniform transform
      gl.uniformMatrix4fv(
        transformUniform,
        false,
        new Float32Array([
          1.5, 0, 0, 0,
          0, 1.5, 0, 0,
          0, 0, 1, 0,
          0.5, 0, 0, 1
        ])
      );

      // --- Build vertex data ---
      // 1. Arc geometry (arc fan with 128 iterations)
      const arcCenter = [-0.25, 0.0];
      const steps = 128;
      const vertices = [];

      // The center vertex for the arc
      vertices.push(arcCenter[0], arcCenter[1], 1, 0.7, 0, 1);
      for (let i = 0; i < steps; i++) {
        const angle1 = ((45 + (i / steps) * 270) / 360) * 2 * Math.PI;
        const angle2 = ((45 + ((i + 1) / steps) * 270) / 360) * 2 * Math.PI;
        // First point on the arc
        vertices.push(
          arcCenter[0] + 0.5 * Math.cos(angle1),
          arcCenter[1] + 0.5 * Math.sin(angle1),
          2, 1 - i / steps, 0, 1
        );
        // Second point on the arc
        vertices.push(
          arcCenter[0] + 0.5 * Math.cos(angle2),
          arcCenter[1] + 0.5 * Math.sin(angle2),
          1, 1 - (i + 1) / steps, 0, 1
        );
      }

      // 2. Additional geometry: a rectangle (drawn as two triangles) in the top-right quadrant
      // Each vertex: [x, y, r, g, b, a]
      const rectVertices = [
        // First triangle
        0.2, 0.2, 0.8, 0.2, 0.2, 1,
        0.8, 0.2, 0.2, 0.8, 0.8, 1,
        0.2, 0.8, 0.5, 0.5, 0.2, 1,
        // Second triangle
        0.8, 0.2, 0.2, 0.8, 0.8, 1,
        0.8, 0.8, 0.8, 0.8, 0.8, 1,
        0.2, 0.8, 0.5, 0.5, 0.2, 1
      ];

      // Combine the vertex data
      const combinedVertices = new Float32Array([...vertices, ...rectVertices]);

      // Create and bind buffer
      const buffer = gl.createBuffer();
      resources.buffer = buffer;
      
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, combinedVertices, gl.STATIC_DRAW);

      // Each vertex has 6 floats (2 for position, 4 for color)
      gl.vertexAttribPointer(vertexPosAttrib, 2, gl.FLOAT, false, 6 * 4, 0);
      gl.vertexAttribPointer(colorAttrib, 4, gl.FLOAT, false, 6 * 4, 2 * 4);

      // Clear and render the scene
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      // Draw the arc using a LINE_STRIP
      const arcVertexCount = vertices.length / 6;
      gl.drawArrays(gl.LINE_STRIP, 0, arcVertexCount);

      // Draw the rectangle using TRIANGLES
      const rectVertexCount = rectVertices.length / 6;
      gl.drawArrays(gl.TRIANGLES, arcVertexCount, rectVertexCount);

      // --- Read and process pixel data ---
      const pixelBuffer = new Uint8Array(canvas.width * canvas.height * 4);
      try {
        gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, pixelBuffer);
      } catch (e) {
        return "gl.readPixels: " + e;
      }

      // Helper: Convert ArrayBuffer to Base64 string
      function arrayBufferToBase64(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
      }

      const pixelBase64 = arrayBufferToBase64(pixelBuffer.buffer);

      // Incorporate WebGL parameters for enhanced uniqueness
      const vendor = gl.getParameter(gl.VENDOR) || '';
      const renderer = gl.getParameter(gl.RENDERER) || '';
      const extensions = (gl.getSupportedExtensions() || []).join(',');

      // Concatenate the pixel data with WebGL parameters
      const fingerprintData = pixelBase64 + vendor + renderer + extensions;

      // Compute and return the hash
      return x64hash128(fingerprintData);
    } catch (error) {
      Log.debug("Error computing WebGL image hash:", error);
      return null;
    } finally {
      // Clean up WebGL resources
      this._cleanupWebGLResources(gl, resources);
    }
  }
  
  /**
   * Clean up WebGL resources to prevent memory leaks
   * @param {WebGLRenderingContext} gl - The WebGL context
   * @param {Object} resources - Resources to clean up
   * @private
   */
  _cleanupWebGLResources(gl, resources) {
    if (!gl) return;
    
    try {
      // Delete shaders
      if (resources.vertexShader) {
        gl.deleteShader(resources.vertexShader);
      }
      
      if (resources.fragmentShader) {
        gl.deleteShader(resources.fragmentShader);
      }
      
      // Delete program
      if (resources.program) {
        gl.deleteProgram(resources.program);
      }
      
      // Delete buffer
      if (resources.buffer) {
        gl.deleteBuffer(resources.buffer);
      }
    } catch (e) {
      Log.debug("Error cleaning up WebGL resources:", e);
    }
  }
}

import DataCollector from '../DataCollector';

const featureSettings = {
  configKey: 'isWebglFeature',
  isDefault: false,
  shouldRunPerContext: false,
  shouldRunPerSession: true,
  shouldRun: false,
  isFrameRelated: false,
  runInUns: false,
  runInSlave: true,
  runInLean: false,
  isRunning: false,
  instance: null,
};

/**
 * WebglCollector class for collecting WebGL fingerprint data
 * and sending it to the data queue.
 */
export default class WebglCollector extends DataCollector {
  /**
   * Get the default settings for the WebGL collector
   * @returns {Object} The default settings
   */
  static getDefaultSettings() {
    return featureSettings;
  }

  /**
   * Create a new WebglCollector instance
   * @param {Object} dataQ - The data queue to send data to
   */
  constructor(dataQ) {
    super();
    this._dataQ = dataQ;
  }

  /**
   * Start the WebGL fingerprinting feature
   * @returns {Promise<void>} A promise that resolves when fingerprinting is complete
   */
  async startFeature() {
    const webGLFingerprint = new WebGLFingerprint();
    
    try {
      // Wait for the fingerprinting process to complete
      await webGLFingerprint.start();
      
      Log.debug("WebGL JSON Hash:" + webGLFingerprint.jsonHash);
      Log.debug("WebGL Image Hash:" + webGLFingerprint.imageHash);

      this._dataQ.addToQueue('static_fields', ['webgl', [
        webGLFingerprint.jsonHash,
        webGLFingerprint.imageHash
      ]], false);
    } catch (error) {
      Log.debug("Error in WebGL fingerprinting:", error);
    }
  }
}
