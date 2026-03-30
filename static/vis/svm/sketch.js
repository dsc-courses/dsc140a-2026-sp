PASTELRED = "#d20000";
PASTELBLUE = "#007aff";
PASTELPURPLE = "#6E66BA";
PASTELYELLOW = "#FBC05E";
PASTELGREEN = "#8fc34f";

// an n x 2 array of data points, arranged into two classes
let data;

// the n x 1 array of labels; either 1 or -1
let labels;

let w_0;
let w_1;
let w_2;

sketch_3d = function (sketch) {

    function sx (x) {
        return 50*x-250;
    }

    function sy (y) {
        return -50*y+250;
    }

    function sz (z) {
        return 30*z;
    }


    function draw_data () {

        let [xs, ys, labels] = data;

        for (let i=0; i<xs.length; i++) {
            let x = xs[i];
            let y = ys[i];
            let label = labels[i];

            if (label == 1) {
                sketch.stroke(PASTELBLUE);
            } else {
                sketch.stroke(PASTELRED);
            }
            sketch.strokeWeight(10);
            sketch.point(sx(x), sy(y), sz(0));
        }

    }

    function draw_decision_boundary () {
        sketch.stroke('black');
        sketch.strokeWeight(3);

        let y1 = 0;
        let y2 = 10;
        let x1 = -w_0 / w_1;
        let x2 = -(w_2 * 10 + w_0) / w_1;

        sketch.line(sx(x1), sy(y1), sz(0), sx(x2), sy(y2), sz(0));

    }

    function draw_margin () {
        sketch.stroke('black');
        sketch.strokeWeight(3);

        // make line dashed
        // sketch.drawingContext.setLineDash([4, 4]);
        sketch.stroke(PASTELBLUE);

        let y1 = 0;
        let y2 = 10;
        let x1 = (-w_0 + 1) / w_1;
        let x2 = (-(w_2 * 10 + w_0) + 1) / w_1;

        sketch.line(sx(x1), sy(y1), sz(0), sx(x2), sy(y2), sz(0));

        x1 = (-w_0 - 1) / w_1;
        x2 = (-(w_2 * 10 + w_0) - 1) / w_1;

        sketch.stroke(PASTELRED);
        sketch.line(sx(x1), sy(y1), sz(0), sx(x2), sy(y2), sz(0));
    }


    function draw_prediction_surface (w_0, w_1, w_2) {
        function h(x, y) {
            return w_0 + w_1 * x + w_2 * y;
        }

        let geom = new p5.Geometry(1, 1, function create() {
            // Define vertices
            this.vertices.push(new p5.Vector(sx(0), sy(0), sz(h(0,0))));   // Vertex 0
            this.vertices.push(new p5.Vector(sx(0), sy(10), sz(h(0,10)))); // Vertex 1
            this.vertices.push(new p5.Vector(sx(10), sy(0), sz(h(10,0))));  // Vertex 2
            this.vertices.push(new p5.Vector(sx(10), sy(10), sz(h(10,10))));  // Vertex 2

            // Define the face using vertex indices
            this.computeFaces();

            // Compute normals
            this.computeNormals();

            this.gid = "something-" + sketch.millis();
        })

        sketch.fill('#c0c0ff');
        sketch.noStroke();
        sketch.model(geom);
    }

    function generate_blobs(n_samples) {
        // generates two blobs of data in two dimensions
        let xs = [];
        let ys = [];
        let labels = [];

        for (let i=0; i<n_samples/2; i++) {
            let x = 3 + sketch.randomGaussian(0, 1);
            let y = 3 + sketch.randomGaussian(0, 1);
            xs.push(x);
            ys.push(y);
            labels.push(1);
        }

        for (let i=0; i<n_samples/2; i++) {
            let x = 7 + sketch.randomGaussian(0, 1);
            let y = 7 + sketch.randomGaussian(0, 1);
            xs.push(x);
            ys.push(y);
            labels.push(-1);
        }

        return [xs, ys, labels];
    }

    sketch.setup = function() {
        sketch.randomSeed(42);
        sketch.textFont(inconsolata);

        margin_checkbox = sketch.createCheckbox('show h=1', false);
        h_checkbox = sketch.createCheckbox('show prediction surface', false);

        camera_button = sketch.createButton('reset camera');
        sketch.createP('w_0');
        w_0_slider = sketch.createSlider(-20, 20, 5, .05);
        w_0_label = sketch.createP('');

        sketch.createP('w_1');
        w_1_slider = sketch.createSlider(-1, 2, -.75, .01);
        w_1_label = sketch.createP('');

        sketch.createP('w_2');
        w_2_slider = sketch.createSlider(-1, 2, -.5, .01);
        w_2_label = sketch.createP('');

        sketch.createP('gamma');
        gamma_slider = sketch.createSlider(.1, 20, 1, .1);
        gamma_label = sketch.createP('');

        data = generate_blobs(20);

        sketch.createCanvas(500, 500, sketch.WEBGL);
        cam = sketch.createCamera();
        cam.setPosition(0, 0, 600);
        cam.lookAt(0, 0, 0);

        camera_button.mousePressed(function () {
            cam.setPosition(0, 0, 600);
            cam.lookAt(0, 0, 0);
        })

    }

    let inconsolata;
    sketch.preload = function () {
        inconsolata = sketch.loadFont('../assets/inconsolata.ttf');
    }


    function draw_grid() {
        // draw a grid from 0 to 10 in x and y
        let xticks = linspace(0, 10, 10);
        let yticks = linspace(0, 10, 10);

        sketch.stroke('#000000');
        sketch.strokeWeight(1);

        for (let x of xticks) {
            sketch.line(sx(x), sy(0), sz(0), sx(x), sy(10), sz(0));
        }

        for (let y of yticks) {
            sketch.line(sx(0), sy(y), sz(0), sx(10), sy(y), sz(0));
        }
    }

    sketch.draw = function() {
        sketch.background('white');
        sketch.orbitControl(2, 1, 0.1);

        draw_data();
        draw_grid();

        sketch.push();
        sketch.textFont(inconsolata);
        sketch.stroke('black');
        sketch.fill('black');
        sketch.scale(3,3,3);
        sketch.text("x_1", -5, 95);
        sketch.text("x_2", 85, 5);
        sketch.pop();

        w_0 = w_0_slider.value();
        w_1 = w_1_slider.value();
        w_2 = w_2_slider.value();
        gamma = gamma_slider.value();

        w_0 = w_0 * gamma;
        w_1 = w_1 * gamma;
        w_2 = w_2 * gamma;

        draw_decision_boundary();
        if (margin_checkbox.checked()) {
            draw_margin();
        }
        if (h_checkbox.checked()) {
            draw_prediction_surface(w_0, w_1, w_2);
        }

        sketch.fill("#00000022");
        sketch.noStroke();
        sketch.plane(500, 500);

    }

}

// new p5(sketch_2d, 'canvas-2d');
new p5(sketch_3d, 'canvas-3d');
