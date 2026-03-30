PASTELRED = "#d20000";
PASTELBLUE = "#007aff";
PASTELPURPLE = "#6E66BA";
PASTELYELLOW = "#FBC05E";
PASTELGREEN = "#8fc34f";

function norm(x, y) {
  return Math.sqrt(x * x + y * y);
}

function clip(x, min, max) {
  return Math.min(Math.max(x, min), max);
}

function square_loss(h, y) {
  return (h - y) ** 2;
}

function hinge_loss(h, y) {
  return Math.max(0, 1 - y * h);
}

function perceptron_loss(h, y) {
  return Math.max(0, -y * h);
}

class ClassificationPlot {
  constructor(
    sketch,
    width,
    height,
    data_x1 = [],
    data_x2 = [],
    data_labels = [],
  ) {
    this.data_x1 = data_x1;
    this.data_x2 = data_x2;
    this.data_labels = data_labels;

    this.w0 = 0;
    this.w1 = 1;
    this.w2 = 0;

    this.sketch = sketch;
    this.dragged_point = -1;

    this.options = {
      background: "white",
      draw_grid: true,
      grid_interval: 1,
      grid_weight: 1.5,
      grid_color: sketch.color(230),
      x1_range: [-5, 5],
      x2_range: [-5, 5],
      width: width,
      height: height,

      point_size: 27,

      draw_tooltip: false,

      draw_loss: false,
      loss_function: null,
      loss_stroke_weight: 12,

      always_show_tooltip: false,

      draw_decision_boundary: false,
      decision_boundary_color: "black",
      decision_boundary_weight: 4,
      draw_margin: false,

      pos_class_color: PASTELYELLOW,
      neg_class_color: PASTELBLUE,

      // controls the gap between the grid edge and the edge of the canvas. this is useful
      // to ensure that tooltips for points on the edge of the grid stay on the canvas.
      padding: 75,
    };

    sketch.createCanvas(
      width + 2 * this.options.padding,
      height + 2 * this.options.padding,
    );
  }

  draw() {
    this.sketch.background(this.options.background);

    if (!this.sketch.mouseIsPressed) {
      this.dragged_point = -1;
    }

    if (this.options.draw_grid) {
      this._draw_grid();
    }

    if (this.options.draw_decision_boundary) {
      this._draw_decision_boundary();
    }

    if (this.options.draw_margin) {
      this._draw_decision_boundary(this.w0, this.w1, this.w2, 1);
      this._draw_decision_boundary(this.w0, this.w1, this.w2, -1);
    }

    for (let i = 0; i < this.data_x1.length; i++) {
      this._draw_data_point(i);
    }
  }

  sx(x) {
    // computes the screen x coordinate from a plot x coordinate, where (0,0)
    // is the center of the plot
    let x_resolution =
      this.options.width /
      (this.options.x1_range[1] - this.options.x1_range[0]);
    return this.options.padding + this.options.width / 2 + x * x_resolution;
  }

  sy(y) {
    // computes the screen y coordinate from a plot y coordinate, where (0,0)
    // is the center of the plot
    let y_resolution =
      this.options.height /
      (this.options.x2_range[1] - this.options.x2_range[0]);
    return this.options.padding + this.options.height / 2 - y * y_resolution;
  }

  px(x) {
    // computes the plot x coordinate from a screen x coordinate
    let x_resolution =
      this.options.width /
      (this.options.x1_range[1] - this.options.x1_range[0]);
    return (x - this.options.padding - this.options.width / 2) / x_resolution;
  }

  py(y) {
    // computes the plot y coordinate from a screen y coordinate
    let y_resolution =
      this.options.height /
      (this.options.x2_range[1] - this.options.x2_range[0]);
    return (this.options.padding + this.options.height / 2 - y) / y_resolution;
  }

  _draw_grid() {
    let step = 0;
    while (true) {
      let line_drawn = false;

      let x = step * this.options.grid_interval;
      let y = step * this.options.grid_interval;

      this.sketch.stroke(this.options.grid_color);
      this.sketch.strokeWeight(this.options.grid_weight);

      if (x <= this.options.x1_range[1]) {
        this.sketch.line(
          this.sx(x),
          this.sy(this.options.x2_range[0]),
          this.sx(x),
          this.sy(this.options.x2_range[1]),
        );
        line_drawn = true;
      }

      if (-x >= this.options.x1_range[0] && step != 0) {
        this.sketch.line(
          this.sx(-x),
          this.sy(this.options.x2_range[0]),
          this.sx(-x),
          this.sy(this.options.x2_range[1]),
        );
        line_drawn = true;
      }

      if (y <= this.options.x2_range[1]) {
        this.sketch.line(
          this.sx(this.options.x1_range[0]),
          this.sy(y),
          this.sx(this.options.x1_range[1]),
          this.sy(y),
        );
        line_drawn = true;
      }

      if (-y >= this.options.x2_range[0] && step != 0) {
        this.sketch.line(
          this.sx(this.options.x1_range[0]),
          this.sy(-y),
          this.sx(this.options.x1_range[1]),
          this.sy(-y),
        );
        line_drawn = true;
      }

      step += 1;

      if (!line_drawn) {
        break;
      }
    }
  }

  _baseline_loss() {
    let points = [
      [this.options.x1_range[0], this.options.x2_range[0]],
      [this.options.x1_range[1], this.options.x2_range[0]],
      [this.options.x1_range[0], this.options.x2_range[1]],
      [this.options.x1_range[1], this.options.x2_range[1]],
    ];

    let losses = [];
    let loss_function = this._get_loss_function();

    for (let pt of points) {
      let prediction = this.w0 + this.w1 * pt[0] + this.w2 * pt[1];
      losses.push(loss_function(prediction, 1));
      losses.push(loss_function(prediction, -1));
    }

    return Math.max(...losses);
  }

  _draw_halo(x, y, loss_factor, color = PASTELRED) {
    let halo = new p5.Image(100, 100);

    halo.loadPixels();

    let xc = 50;
    let yc = 50;

    let red = this.sketch.color(color);

    let core_radius = this.options.point_size / 2.75;

    let sigma = core_radius + 200 * Math.min(loss_factor, 1);

    // make a red Gaussian halo, red at distance
    for (let i = 0; i < halo.width; i++) {
      for (let j = 0; j < halo.height; j++) {
        let dist = Math.sqrt((i - xc) ** 2 + (j - yc) ** 2);
        if (dist < core_radius) {
          red.setAlpha(255);
          halo.set(i, j, red);
        } else {
          let delta = dist - core_radius;
          let alpha = 255 * Math.exp(-(delta ** 2) / sigma);
          red.setAlpha(alpha);
          halo.set(i, j, red);
        }
      }
    }

    this.sketch.rectMode(this.sketch.CENTER);
    halo.updatePixels();
    this.sketch.image(halo, this.sx(x - 1)-.5, this.sy(y + 1) - .5);
    this.sketch.rectMode(this.sketch.CORNER);
  }

  _draw_data_point(i) {
    // draw the ith data point
    let x = this.sx(this.data_x1[i]);
    let y = this.sy(this.data_x2[i]);
    let label = this.data_labels[i];

    let is_mouse_over =
      this.find_point(this.sketch.mouseX, this.sketch.mouseY) == i;

    let color;
    if (label == 1) {
      color = this.options.pos_class_color;
    } else {
      color = this.options.neg_class_color;
    }

    if (is_mouse_over) {
      color = this.sketch.lerpColor(
        this.sketch.color(color),
        this.sketch.color("white"),
        0.5,
      );
    }

    // draw a background circle to make the point easier to see
    // determine its color from the loss
    let loss = this.loss_of_point(i);
    if (
      loss > 0 &&
      this.options.draw_loss &&
      this.options.loss_function != null
    ) {
      this._draw_halo(
        this.data_x1[i],
        this.data_x2[i],
        loss / this._baseline_loss(),
      );
      this._draw_halo(
        this.data_x1[i],
        this.data_x2[i],
        1 * (loss / this._baseline_loss()),
        this.sketch.lerpColor(
          this.sketch.color("white"),
          this.sketch.color(PASTELRED),
          0.3,
        ),
      );
    }

    // draw the point itself
    this.sketch.fill(
      this.sketch.lerpColor(
        this.sketch.color(color),
        this.sketch.color("white"),
        0.5,
      ),
    );
    this.sketch.stroke(
      this.sketch.lerpColor(
        this.sketch.color(color),
        this.sketch.color("black"),
        0.3,
      ),
    );
    this.sketch.strokeWeight(2);
    this.sketch.circle(x, y, this.options.point_size);

    // draw the point label
    this.sketch.textSize(16);
    this.sketch.fill("black");
    this.sketch.noStroke();
    this.sketch.textAlign(this.sketch.CENTER, this.sketch.CENTER);
    if (label == 1) {
      this.sketch.text("+", x, y);
    } else {
      this.sketch.textSize(22);
      this.sketch.text("-", x, y);
    }

    if (
      (is_mouse_over && this.options.draw_tooltip) ||
      this.options.always_show_tooltip
    ) {
      this._draw_tooltip(i);
    }
  }

  find_point(x, y) {
    // returns the index of the point, or -1 if no point is found
    for (let i = 0; i < this.data_x1.length; i++) {
      let px = this.sx(this.data_x1[i]);
      let py = this.sy(this.data_x2[i]);
      if (norm(x - px, y - py) < this.options.point_size / 2) {
        return i;
      }
    }
    return -1;
  }

  prediction_at_point(i, w_0 = null, w_1 = null, w_2 = null) {
    // returns the prediction of the ith point

    if (w_0 === null) {
      w_0 = this.w0;
    }

    if (w_1 === null) {
      w_1 = this.w1;
    }

    if (w_2 === null) {
      w_2 = this.w2;
    }

    let x1 = this.data_x1[i];
    let x2 = this.data_x2[i];
    return w_0 + w_1 * x1 + w_2 * x2;
  }

  _get_loss_function() {
    if (this.options.loss_function == "square") {
      return square_loss;
    } else if (this.options.loss_function == "hinge") {
      return hinge_loss;
    } else if (this.options.loss_function == "perceptron") {
      return perceptron_loss;
    }
  }

  loss_of_point(i) {
    // returns the loss of the ith point
    let y = this.data_labels[i];
    let h = this.prediction_at_point(i);

    let loss_function = this._get_loss_function();
    return loss_function(h, y);
  }

  drag_point_at_mouse() {
    // moves the point that is currently being dragged
    if (this.dragged_point == -1) {
      this.dragged_point = this.find_point(
        this.sketch.mouseX,
        this.sketch.mouseY,
      );
    }
    let new_x;
    let new_y;

    if (this.dragged_point != -1) {
      new_x = this.px(this.sketch.mouseX);
      new_y = this.py(this.sketch.mouseY);
    }

    // keep the point within the plot bounds
    this.data_x1[this.dragged_point] = clip(
      new_x,
      this.options.x1_range[0],
      this.options.x1_range[1],
    );

    this.data_x2[this.dragged_point] = clip(
      new_y,
      this.options.x2_range[0],
      this.options.x2_range[1],
    );
  }

  add_or_delete_point_at_mouse() {
    let ix = this.find_point(this.sketch.mouseX, this.sketch.mouseY);
    if (ix == -1) {
      this.data_x1.push(this.px(this.sketch.mouseX));
      this.data_x2.push(this.py(this.sketch.mouseY));
      if (this.prediction_at_point(this.data_x1.length - 1) > 0) {
        this.data_labels.push(1);
      } else {
        this.data_labels.push(-1);
      }
    } else {
      this.data_x1.splice(ix, 1);
      this.data_x2.splice(ix, 1);
      this.data_labels.splice(ix, 1);
    }
  }

  _draw_decision_boundary(w_0 = null, w_1 = null, w_2 = null, offset = 0) {
    if (w_0 === null) {
      w_0 = this.w0;
    }

    if (w_1 === null) {
      w_1 = this.w1;
    }

    if (w_2 === null) {
      w_2 = this.w2;
    }

    // find the y value when x = -5
    let x1 = -5;
    let y1 = (offset - w_0 - w_1 * -5) / w_2;

    if (y1 > 5) {
      y1 = 5;
      x1 = (offset - w_0 - w_2 * 5) / w_1;
    } else if (y1 < -5) {
      y1 = -5;
      x1 = (offset - w_0 - w_2 * -5) / w_1;
    }

    // find the y value when x = 5
    let x2 = 5;
    let y2 = (offset - w_0 - w_1 * 5) / w_2;

    if (y2 > 5) {
      y2 = 5;
      x2 = (offset - w_0 - w_2 * 5) / w_1;
    } else if (y2 < -5) {
      y2 = -5;
      x2 = (offset - w_0 - w_2 * -5) / w_1;
    }

    x1 = this.sx(x1);
    y1 = this.sy(y1);
    x2 = this.sx(x2);
    y2 = this.sy(y2);
    this.sketch.stroke(this.options.decision_boundary_color);
    this.sketch.strokeWeight(this.options.decision_boundary_weight);

    if (offset !== 0) {
      // dashed line
      this.sketch.drawingContext.setLineDash([10, 15]);

      if (offset > 0) {
        this.sketch.stroke(this.options.pos_class_color);
      } else {
        this.sketch.stroke(this.options.neg_class_color);
      }
    } else {
      this.sketch.drawingContext.setLineDash([]);
    }

    this.sketch.line(x1, y1, x2, y2);

    // clear the dash
    this.sketch.drawingContext.setLineDash([]);
  }

  _draw_tooltip(i) {
    // draw a rounded rectangle with the loss value
    let x = this.sx(this.data_x1[i]);
    let y = this.sy(this.data_x2[i]);

    // offset
    x += 30;
    y += 30;

    let loss = this.loss_of_point(i);
    let max_loss = this._baseline_loss();

    let color = this.sketch.color("white");
    color.setAlpha(255);
    this.sketch.fill(color);
    this.sketch.stroke("black");
    this.sketch.strokeWeight(2);
    this.sketch.rect(x - 32.5, y - 15, 65, 30, 10);

    this.sketch.fill("black");
    this.sketch.noStroke();
    this.sketch.textSize(12);
    this.sketch.textAlign(this.sketch.CENTER, this.sketch.CENTER);
    this.sketch.text("loss: " + loss.toFixed(2), x, y);
  }

  _subgradient_at_point(i, w_0, w_1, w_2) {
    let x1 = this.data_x1[i];
    let x2 = this.data_x2[i];
    let y = this.data_labels[i];
    let pred = this.prediction_at_point(i, w_0, w_1, w_2);

    if (this.options.loss_function == "square") {
      return [2 * (pred - y), 2 * (pred - y) * x1, 2 * (pred - y) * x2];
    } else if (this.options.loss_function == "hinge") {
      if (y * pred < 1) {
        return [-y, -y * x1, -y * x2];
      } else {
        return [0, 0, 0];
      }
    } else if (this.options.loss_function == "perceptron") {
      if (y * pred < 0) {
        return [-y, -y * x1, -y * x2];
      } else {
        return [0, 0, 0];
      }
    }
  }

  _overall_subgradient(w_0, w_1, w_2) {
    let grad_w0 = 0;
    let grad_w1 = 0;
    let grad_w2 = 0;

    for (let i = 0; i < this.data_x1.length; i++) {
      let grad = this._subgradient_at_point(i, w_0, w_1, w_2);
      grad_w0 += grad[0];
      grad_w1 += grad[1];
      grad_w2 += grad[2];
    }

    // divide by the number of points
    grad_w0 /= this.data_x1.length;
    grad_w1 /= this.data_x1.length;
    grad_w2 /= this.data_x1.length;

    // if we're working with hinge loss, we need to add a regularization term
    if (this.options.loss_function == "hinge") {
      grad_w0 += 1 * w_0;
      grad_w1 += 1 * w_1;
      grad_w2 += 1 * w_2;
    }

    return [grad_w0, grad_w1, grad_w2];
  }

  optimize() {
    let w_0 = this.w0;
    let w_1 = this.w1;
    let w_2 = this.w2;

    let initial_step_size = 1;
    let max_steps = 5000;

    for (let step = 0; step < max_steps; step++) {
      let step_size = initial_step_size / Math.sqrt(step + 1);

      let grad = this._overall_subgradient(w_0, w_1, w_2);

      w_0 -= step_size * grad[0];
      w_1 -= step_size * grad[1];
      w_2 -= step_size * grad[2];

      if (grad[0] ** 2 + grad[1] ** 2 + grad[2] ** 2 < 0.000001) {
        break;
      }
    }

    return [w_0, w_1, w_2];
  }
}
