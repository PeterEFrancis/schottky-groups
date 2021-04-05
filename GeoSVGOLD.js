
var GeoSVG;

// var Mobbius;

// complex operations
function add(a,b) {
  return {
    x: a.x + b.x,
    y: a.y + b.y
  }
}
function multiply(a,b) {
  return {
    x: a.x * b.x - a.y * b.y,
    y: a.x * b.y + a.y * b.x
  }
}
function divide(a,b) {
  return {
    x: (a.x * b.x + a.y * b.y) / (b.x**2 + b.y**2),
    y: (a.y * b.y - a.x * b.y) / (b.x**2 + b.y**2)
  };
}
function negate(a) {
  return {
    x: -a.x,
    y: -a.y
  };
}
function subtract(a,b) {
  return {
    x: a.x - b.x,
    y: a.y - b.y
  };
}
function conjugate(a) {
  return {
    x: a.x,
    y: -a.y
  };
}




(function () {

  const STYLE = {};

  Object.prototype.set_style = function(style) {
    for (let a in style) {
      this.style[a] = style[a];
    }
  }


  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }


  // var Mobius = function(a, b, c, d) {
  //   this.a = a;
  //   this.b = b;
  //   this.c = c;
  //   this.d = d;
  // }
  // Mobius.prototype.apply = function(z) {
  //   return divide(subtract(multiply(this.a, z), this.b), subtract(multiply(this.c, z), this.d));
  // }



  GeoSVG = function(svg, args) {
    args = args || {};
    this.dom = svg;
    this.center = args.center || {x: 0, y: 0};
    this.zoom = args.zoom || 1;
    this.circles = [];
  };
  GeoSVG.prototype.get_hk = function(xy) {
    return {
      h: this.dom.clientWidth / 2 + (xy.x - this.center.x) * this.zoom,
      k: this.dom.clientHeight / 2 - (xy.y - this.center.y) * this.zoom,
    };
  };
  GeoSVG.prototype.get_xy = function(hk) {
    return {
      x: (hk.h - this.dom.clientWidth / 2) / this.zoom + this.center.x,
      y: (hk.k - this.dom.clientHeight / 2) / this.zoom + this.center.y
    };
  };
  GeoSVG.prototype.clear = function() {
    this.dom.innerHTML = "";
  }


  GeoSVG.prototype.circle = function(args) {

    let circle = new Circle(this, args);

    this.circles.push(circle);
    this.dom.appendChild(circle.dom);

    return circle;
  }




  Circle = function(geoSVG, args) {

    this.geoSVG = geoSVG;

    args = args || {};

    args.center = args.center || geoSVG.center;
    args.radius = args.radius || 100;

    this.set(args);

  }


  Circle.prototype.set = function(args) {

    args = args || {};

    if (args.center) this.center = clone(args.center);
    if (args.radius) this.radius = args.radius;

    let hk = geoSVG.get_hk(args.center);

    this.dom = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    this.dom.setAttribute('cx', hk.h);
    this.dom.setAttribute('cy', hk.k);
    this.dom.setAttribute('r', this.radius * this.geoSVG.zoom);
    this.dom.setAttribute('stroke', args.stroke || "black");
    this.dom.setAttribute('stroke-width', args.stroke_width || 1);
    this.dom.setAttribute('fill', args.fill || "transparent");
  }

  Circle.prototype.clone = function() {
    let circle = this.geoSVG.circle({
      center: clone(this.center),
      radius: this.radius
    })
    circle.dom = this.dom.cloneNode();
    return circle;
  }

  Circle.prototype.transform = function(transformation) {
    let p1 = transformation(add(this.center, {x:this.radius, y:0}));
    let p2 = transformation(add(this.center, {x:0, y:this.radius}));
    let p3 = transformation(add(this.center, {x:-this.radius, y:0}));
    return new Circle(this.geoSVG, center_and_radius_from_3_points(p1, p2, p3))
  }

  function center_and_radius_from_3_points(p1, p2, p3) {
    let temp = p2.x * p2.x + p2.y * p2.y;
    let bc = (p1.x * p1.x + p1.y * p1.y - temp) / 2;
    let cd = (temp - p3.x * p3.x - p3.y * p3.y) / 2;
    let det = (p1.x - p2.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p2.y);

    // if (Maht.abs(det) < 1.0e-6):
    //     return (None, np.inf)

    let cx = (bc*(p2.y - p3.y) - cd*(p1.y - p2.y)) / det;
    let cy = ((p1.x - p2.x) * cd - (p2.x - p3.x) * bc) / det;
    let radius = Math.sqrt((cx - p1.x)**2 + (cy - p1.y)**2);

    return {
      center: {x: cx, y:cy},
      radius: radius
    };
  }





})();
