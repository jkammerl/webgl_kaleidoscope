WebGLVideo = function (containerEl) {
    this.container_ = containerEl;
    this.scene_;
    this.camera_;
    this.controls_;
    this.renderer_;
    this.effect_;
    this.mesh_;
    this.shader_;
    this.videoEl_;
    this.videoAspect_;
    this.videoTexture_;
    this.lastFrameTimestamp_ = 0.0;
    this.animationTime_ = 0.0;

    this.config_ = new WebGLConfig();

    if (this.initWebGL(containerEl)) {
        this.animate();
    }
}

WebGLVideo.FOCAL_LENGTH = 90;

WebGLVideo.NUM_VERTICES = 32;

WebGLVideo.VERTEX_SHADER = 'shaders/vertex.vsh';

WebGLVideo.FRAGMENT_SHADER = 'shaders/fragment.fsh';

WebGLVideo.prototype.initWebGL = function (containerEl) {
    if (Detector.webgl) {
        this.renderer_ = new THREE.WebGLRenderer({
            antialias: true, // to get smoother output
            preserveDrawingBuffer: true, // to allow screenshot
            doubleSided: true
        });
    } else {
        Detector.addGetWebGLMessage();
        return false;
    }

    this.renderer_.setSize(window.innerWidth, window.innerHeight);

    this.renderer_.gammaInput = true;
    this.renderer_.gammaOutput = true;

    this.renderer_.shadowMapEnabled = true;
    this.renderer_.shadowMapCullFace = THREE.CullFaceBack;

    this.effect_ = new THREE.StereoEffect(this.renderer_);

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
        this.videoAspect_ = videoEl.height / videoEl.width;

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

    function setOrientationControls(e) {
        if (!e.alpha) {
          return;
        }
        if (this.controls_ == null) {
            this.controls_ = new THREE.DeviceOrientationControls(this.camera_ , true);
            this.controls_.connect();
            this.controls_.update();
        }
        window.removeEventListener('deviceorientation', setOrientationControls.bind(this));
    }
    window.addEventListener('deviceorientation', setOrientationControls, true);
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
        side: THREE.DoubleSide,
        wireframe: false
    });

    var geom = new THREE.CircleGeometry(3, WebGLVideo.NUM_VERTICES);
    var newMesh = new THREE.Mesh(geom, material);
    newMesh.position.set(0, 0, 3);
    this.camera_.lookAt(newMesh.position);

    // replace mesh if is already exists
    if (this.mesh_) {
        this.scene_.remove(this.mesh_);
    }
    this.scene_.add(newMesh);
    this.mesh_ = newMesh;
}

WebGLVideo.prototype.render = function () {
    if (this.videoTexture_ && this.videoEl_ && this.videoEl_.readyState === this.videoEl_.HAVE_ENOUGH_DATA) {
        this.videoTexture_.needsUpdate = true;
    }
    // actually render the scene
    this.effect_.render(this.scene_, this.camera_);
}

WebGLVideo.prototype.update = function() {
  this.onWindowResize();
  if (this.controls_) {
      this.controls_.update();
  }
}

WebGLVideo.prototype.onWindowResize = function () {
    this.camera_.aspect = window.innerWidth / window.innerHeight;
    this.camera_.updateProjectionMatrix();

    this.renderer_.setSize(window.innerWidth, window.innerHeight);
    this.effect_.setSize(window.innerWidth, window.innerHeight);
}

WebGLVideo.prototype.animate = function () {

    if (this.mesh_) {
        var time_passed = Date.now() - this.lastFrameTimestamp_;
        this.lastFrameTimestamp_ = Date.now();
        this.animationTime_ += time_passed * this.config_.speed * 0.0005;

        this.mesh_.rotation.z = this.animationTime_;
    }

    this.update();
    this.render();

    requestAnimationFrame(this.animate.bind(this));
}