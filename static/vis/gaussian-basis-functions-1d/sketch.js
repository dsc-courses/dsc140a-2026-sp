PASTELRED = "#d20000";
PASTELBLUE = "#007aff";
PASTELPURPLE = "#6E66BA";
PASTELYELLOW = "#FBC05E";
PASTELGREEN = "#8fc34f";

let figure;
let data = [];

let w_0 = 0;
let w_1 = 1;
let w_2 = 1;
let w_3 = 1;

let p_1, p_2, p_3, p_h;

function gaussian(x, mu, sigma) {
    return Math.exp(-((x - mu)**2) / sigma**2) * (Math.sqrt(2*Math.PI) * sigma)**(-1);
}


function generate_data (n) {
    // generate data from a noisy sine wave
   

    // sample n x values from 0 to 5
    let xx = [];
    for (let i=0; i<n; i++) {
        xx.push(5 * Math.random());
    }

    for (let i=0; i<xx.length; i++) {
        let x = xx[i] + Math.random() * .1;
        let y = .5*Math.sin(.5*x * Math.PI) + Math.random() * .2;
        // append to data
        data.push([x, y]);
    }


}


function sketch_gaussians (sketch) {

    sketch.setup = function() {
        let div = sketch.select('#canvas-h');
        let scale = div.width / 8;

        generate_data(40);

        // put setup code here
        sketch.createCanvas(div.width, .6 * scale * 9);
        figure = new Figure(sketch, [10, 10], [-.1, 6], [-.7, .7], scale, scale*3);

        // make sliders for w_1, w_2, w_3
        p_1 = sketch.createP('w_1');
        sketch.w_1_slider = sketch.createSlider(-2, 2, 1, .01);

        p_2 = sketch.createP('w_2');
        sketch.w_2_slider = sketch.createSlider(-2, 2, 1, .01);

        p_3 = sketch.createP('w_3');
        sketch.w_3_slider = sketch.createSlider(-2, 2, 1, .01);

        p_h = sketch.createP('h(x) = w_0 + w_1 * N(x; 1, 1) + w_2 * N(x; 3, 1) + w_3 * N(x; 5, 1)');
    }


    sketch.draw = function() {
        sketch.background('#fff');

        w_1 = sketch.w_1_slider.value();
        w_2 = sketch.w_2_slider.value();
        w_3 = sketch.w_3_slider.value();

        p_1.html(`w_1: ${w_1}`);
        p_2.html(`w_2: ${w_2}`);
        p_3.html(`w_3: ${w_3}`);

        p_h.html(`h(x) = ${w_1} * N(x; 1, 1) + ${w_2} * N(x; 3, 1) + ${w_3} * N(x; 5, 1)`);

        sketch.stroke('black');
        figure.draw_axes();

        draw_data();

        sketch.strokeWeight(4);
        sketch.stroke(PASTELRED);
        draw_f(h_1);

        sketch.stroke(PASTELPURPLE);
        draw_f(h_2);

        sketch.stroke(PASTELYELLOW);
        draw_f(h_3);

        sketch.stroke('black');
        // make dashed line
        draw_f(h);
        sketch.strokeWeight(2);

    }

    function draw_data () {
        sketch.fill(PASTELBLUE);
        figure.scatter(data.map(d => d[0]), data.map(d => d[1]));
        sketch.strokeWeight(2);
    }


    function h_1 (x) {
        return w_1 * gaussian(x, 1, 1);
    }

    function h_2 (x) {
        return w_2 * gaussian(x, 3, 1);
    }

    function h_3 (x) {
        return w_3 * gaussian(x, 5, 1);
    }

    function h (x) {
        return w_0 + h_1(x) + h_2(x) + h_3(x);
    }

    function draw_f (f) {
        let xx = linspace(0, 6, 300);
        let yy = xx.map(f);
        figure.plot(xx, yy);
    }

}

new p5(sketch_gaussians, 'canvas-h');
