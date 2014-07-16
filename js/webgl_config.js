WebGLConfig = function () {
    this.speed = WebGLConfig.INIT_SPEED;

    this.createGUI();
}

// Configuration
WebGLConfig.INIT_SPEED = 1.0;

WebGLConfig.MAX_SPEED = 5.0;

WebGLConfig.GUI_WIDTH = 300;

WebGLConfig.prototype.createGUI = function () {
    var gui = new dat.GUI();
    gui.width = WebGLConfig.GUI_WIDTH;
    gui.open();

    var configGui = gui.addFolder("Config");

    configGui.add(this, "speed").min(0.0).max(WebGLConfig.MAX_SPEED).step(0.1);
    configGui.open();
}
