WebGLVideo = function (containerEl) {
    this.container_ = containerEl;
    this.scene_;
    this.camera_;
    this.renderer_;
    this.mesh_;
    this.shader_;
    this.videoEl_;
    this.videoTexture_;
    this.lastFrameTimestamp_ = 0.0;
    this.animationTime_ = 0.0;

    this.config_ = new WebGLConfig();

    if (this.initWebGL(containerEl)) {
        this.animate();
    }
}

WebGLVideo.FOCAL_LENGTH = 90;

WebGLVideo.NUM_VERTICES = 64;

WebGLVideo.VERTEX_SHADER = 'shaders/vertex.vsh';

WebGLVideo.FRAGMENT_SHADER = 'shaders/fragment.fsh';

WebGLVideo.prototype.initWebGL = function (containerEl) {
    if (Detector.webgl) {
        this.renderer_ = new THREE.WebGLRenderer({
            antialias: true, // to get smoother output
            preserveDrawingBuffer: true // to allow screenshot
        });
    } else {
        Detector.addGetWebGLMessage();
        return false;
    }

    this.renderer_.setSize(window.innerWidth, window.innerHeight);

    this.container_.appendChild(this.renderer_.domElement);

    // create a scene
    this.scene_ = new THREE.Scene();

    // put a camera in the scene
    this.camera_ = new THREE.PerspectiveCamera(WebGLVideo.FOCAL_LENGTH, window.innerWidth / window.innerHeight, 0.001, 1000);
    this.camera_.position.set(0, 0, 0);
    this.scene_.add(this.camera_);

    var webrtc_init_callback = function (videoEl) {
        this.videoTexture_ = new THREE.Texture(videoEl);
        this.videoEl_ = videoEl;
        
        this.shader_ = {
            uniforms: {
                'texture': {
                    type: 't',
                    value: this.videoTexture_
                }
            },
            vertexShader: this.loadShader(WebGLVideo.VERTEX_SHADER),
            fragmentShader: this.loadShader(WebGLVideo.FRAGMENT_SHADER)
        };
        this.createScene();
    };
    var webrtc_video = new WebRtcVideo(document, webrtc_init_callback.bind(this));

    window.addEventListener('resize', this.onWindowResize.bind(this), false);
    this.container_.addEventListener('click', this.onClickFullscreen.bind(this), false);

    return true;
}

WebGLVideo.prototype.onClickFullscreen = function () {
  if (this.container_.requestFullscreen) {
    this.container_.requestFullscreen();
  } else if (this.container_.msRequestFullscreen) {
    this.container_.msRequestFullscreen();
  } else if (this.container_.mozRequestFullScreen) {
    this.container_.mozRequestFullScreen();
  } else if (this.container_.webkitRequestFullscreen) {
    this.container_.webkitRequestFullscreen();
  }
}

WebGLVideo.prototype.loadShader = function (url) {
    var shaderSrc;
    var result = jQuery.ajax(url, {
        async: false,
        success: function (data, status) {
            shaderSrc = data;
        },
        error: function (jqXHR, status, error) {
            console.error(status + " " + error);
        }
    });
    return shaderSrc;
}

WebGLVideo.prototype.createScene = function () {
    var material = new THREE.ShaderMaterial({
        uniforms: this.shader_.uniforms,
        vertexShader: this.shader_.vertexShader,
        fragmentShader: this.shader_.fragmentShader,
        wireframe: false
    });

    var geom = new THREE.CircleGeometry(3, WebGLVideo.NUM_VERTICES);
    this.mesh_ = new THREE.Mesh(geom, material);
    this.mesh_.position.set(0, 0, -3);
    this.camera_.lookAt(this.mesh_.position);

    this.scene_.add(this.mesh_);
}

WebGLVideo.prototype.render = function () {
    if (this.videoTexture_ && this.videoEl_ && this.videoEl_.readyState === this.videoEl_.HAVE_ENOUGH_DATA) {
        this.videoTexture_.needsUpdate = true;
    }
    // actually render the scene
    this.renderer_.render(this.scene_, this.camera_);
}

WebGLVideo.prototype.onWindowResize = function () {
    this.camera_.aspect = window.innerWidth / window.innerHeight;
    this.camera_.updateProjectionMatrix();

    this.renderer_.setSize(window.innerWidth, window.innerHeight);
}

WebGLVideo.prototype.animate = function () {

    if (this.mesh_) {
        var time_passed = Date.now() - this.lastFrameTimestamp_;
        this.lastFrameTimestamp_ = Date.now();
        this.animationTime_ += time_passed * this.config_.speed * 0.0005;

        this.mesh_.rotation.z = this.animationTime_;
    }

    this.render();

    requestAnimationFrame(this.animate.bind(this));
}