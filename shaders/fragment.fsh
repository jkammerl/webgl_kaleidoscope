uniform sampler2D texture;
varying vec2 vUv;

void main(void) {
    vec2 sample_pos = vUv;
    if (sample_pos.x > 0.5) {
    	sample_pos.x = 1.0 - sample_pos.x;
    }
    if (sample_pos.y > 0.5) {
    	sample_pos.y = 1.0 - sample_pos.y;
    }
    if (sample_pos.y > sample_pos.x) {
        float temp = sample_pos.x;
    	sample_pos.x = sample_pos.y;
    	sample_pos.y = temp;
    }

    gl_FragColor = texture2D(texture, sample_pos);
}
