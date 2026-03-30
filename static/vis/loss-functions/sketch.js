function sketch_data(sketch) {
  function reset() {
    plot = new ClassificationPlot(sketch, 500, 500);

    plot.data_x1 = [2, 4, 3, -2, -3, -5];
    plot.data_x2 = [2, -2, 3, 4, -2, 3];
    plot.data_labels = [1, 1, 1, -1, -1, -1];

    return plot;
  }

  sketch.setup = function () {
    plot = reset();

    let optimize_button = sketch.select("#minimize");
    optimize_button.mousePressed(() => {
      let w = plot.optimize(sketch);

      plot.w0 = w[0];
      plot.w1 = w[1];
      plot.w2 = w[2];

      sketch.select("#w0").value(w[0]);
      sketch.select("#w1").value(w[1]);
      sketch.select("#w2").value(w[2]);

    });

    let reset_button = sketch.select("#reset");
    reset_button.mousePressed(() => {
      reset();
    });
  };

  sketch.draw = function () {
    plot.w0 = sketch.select("#w0").value();
    plot.w1 = sketch.select("#w1").value();
    plot.w2 = sketch.select("#w2").value();

    plot.options.loss_function = sketch.select("#loss").value();

    plot.options.draw_decision_boundary = true;
    plot.options.always_show_tooltip = true;
    plot.options.draw_margin = false;
    plot.options.draw_loss = true;
    plot.options.draw_tooltip = true;
    plot.draw();
  };

  sketch.mouseDragged = function () {
    plot.drag_point_at_mouse();
  };

  sketch.mousePressed = function () {
    // if shift is pressed, add a point
    if (sketch.keyIsDown(16)) {
      plot.add_or_delete_point_at_mouse();
    }
  };
}

new p5(sketch_data, "canvas-data");
