
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




function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}


function circle_from_3_points(p1, p2, p3) {
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

function transform_circle(transformation, circle) {
  return circle_from_3_points(
    transformation(add(circle.center, {x:circle.radius, y:0})),
    transformation(add(circle.center, {x:0, y:circle.radius})),
    transformation(add(circle.center, {x:-circle.radius, y:0}))
  );
}



class GeoSVG {

  constructor(svg, args) {
    args = args || {};
    this.dom = svg;
    this.center = args.center || {x: 0, y: 0};
    this.zoom = args.zoom || 1;
  }

  get_hk(xy) {
    return {
      h: this.dom.clientWidth / 2 + (xy.x - this.center.x) * this.zoom,
      k: this.dom.clientHeight / 2 - (xy.y - this.center.y) * this.zoom,
    };
  }

  get_xy(hk) {
    return {
      x: (hk.h - this.dom.clientWidth / 2) / this.zoom + this.center.x,
      y: (hk.k - this.dom.clientHeight / 2) / this.zoom + this.center.y
    };
  }

  clear() {
    this.dom.innerHTML = "";
  }

  add_circle(args) {
    args = args || {};
    args.center = args.center || {x: 0, y: 0};
    args.radius = args.radius || 1;

    let hk = this.get_hk(args.center);

    let circle_dom = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle_dom.setAttribute('cx', hk.h);
    circle_dom.setAttribute('cy', hk.k);
    circle_dom.setAttribute('r', args.radius * this.zoom);
    circle_dom.setAttribute('stroke', args.stroke || "black");
    circle_dom.setAttribute('stroke-width', args.stroke_width || 1);
    circle_dom.setAttribute('fill', args.fill || "transparent");

    this.dom.appendChild(circle_dom);

    return circle_dom;
  }


}
