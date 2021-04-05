
var GeoCanvas;

(function () {

  const STYLE = {
    CONTAINER : {
      position: "relative"
    },
    CANVAS: {
      backgroundColor: "transparent",
      width: "100%",
      height: "100%",
      position: "absolute",
      top: 0,
      left: 0
    }
  }
  Object.prototype.set_style = function(style) {
    for (let a in style) {
      this.style[a] = style[a];
    }
  }


  const OBJ_TYPES = ['circle'];




  var Circle = function(args, style) {
    args = args || {};
    this.center = args.center || {x:0, y:0};
    this.radius = args.radius || 1;
    this.movable = args.movable || false;
    this.layer = args.layer || 1;
    this.style = args.style || {};
  }
  Circle.prototype.draw = function(ctx) {
    ctx.beginPath();
    ctx.arc(this.center.x, this.center.y, this.radius, 0, 2 * Math.PI, false);
    if (this.style.fill_color) {
      ctx.fillStyle = this.style.fill_color;
      ctx.fill();
    }
    ctx.lineWidth = this.style.line_width || 1;
    ctx.strokeStyle = this.style.color || 'black';
    ctx.stroke();
  }
  


  GeoCanvas = function(container) {
    this.container = container;
    this.container.set_style(STYLE.CONTAINER);

    // add canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = 1000;
    this.canvas.height = 1000 * (this.container.height / this.container.width);
    this.canvas.set_style(STYLE.CANVAS);
    this.container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');

    // set up circles
    this.circles = [];

  }
  GeoCanvas.prototype.add_circle = function(args) {
    this.circles.push(new Circle(args));
  }
  GeoCanvas.prototype.draw = function() {
    for (let circle of this.circles) {
      circle.draw(this.ctx);
    }
  }


})();


7177962334

7177675355
