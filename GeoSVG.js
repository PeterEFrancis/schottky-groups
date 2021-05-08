
const INFINITY = 999999;


function re(x) {
  return {x:x, y:0};
}

function norm(p) {
  return Math.sqrt(p.x**2 + p.y**2);
}

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
    y: (a.y * b.x - a.x * b.y) / (b.x**2 + b.y**2)
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
function squareroot(a) {
  let r = norm(a);
  let a_hat = divide(a, re(r));
  let theta = Math.acos(a_hat.x);
  return multiply(re(Math.sqrt(r)), {
    x: Math.cos(theta / 2),
    y: Math.sin(theta / 2)
  })
}


function distance(p1, p2) {
  return Math.sqrt((p1.x - p2.x)**2 + (p1.y - p2.y)**2);
}
function midpoint(p1, p2) {
  return divide(add(p1, p2), {x:2, y:0});
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

function do_circles_overlap(c1, c2) {
  return c1.radius + c2.radius > distance(c1.center, c2.center);
}

function get_inverting_cline(c1, c2) {
  if (c1.radius == c2.radius) {
    // return line
    return {
      radius: Infinity,
      center: Infinity,
      slope: -1/((c1.center.y - c2.center.y) / (c1.center.x - c2.center.x)),
      point: midpoint(c1.center, c2.center)
    };
  } else {
    let A = c1.center;
    let a = c1.radius;
    let B = c2.center;
    let b = c2.radius;
    // circle
    return {
      center: add(A, divide(subtract(B, A), re((a - b)/a))),
      radius: Math.sqrt((a * b * distance(A, B)**2)/((a - b) ** 2) - (a * b))
    };
  }
}



function invert(c) {
  if (c.center == Infinity) { // line
    const theta = Math.atan(c.slope);
    const point = c.point;
    return function(z) {
      return add(point, rotate(theta)(conjugate(rotate(-theta)(subtract(z, point)))));
    }
  }
  // circle
  const center = c.center;
  const r = c.radius;
  return function(z) {
    return add(divide(re(r**2), conjugate(subtract(z, center))), center);
  }
}

function rotate(theta_) {
  const theta = theta_;
  return function(z) {
    return multiply({x: Math.cos(theta), y: Math.sin(theta)}, z);
  }
}

function D_automorphism(z0_, theta_) { // hyperbolic transformation
  const z0 = z0_;
  const theta = theta_;
  return function(z) {
    return rotate(theta)(divide(subtract(z, z_0), subtract(re(1), multiply(z, conjugate(z0)))));
  }
}


function pairing(c1_, c2_) { // z0_, theta_
  const c1 = c1_;
  const c2 = c2_;
  // const z0 = z0_;
  // const theta = theta_;
  const ic = get_inverting_cline(c1, c2);
  return [
    function(z) {
      return invert(ic)(invert(c1)(z));
    },
    function(z) {
      return invert(ic)(invert(c2)(z));
    }
  ]
}


function get_transformations(pairs) {
  let transformations = [];
  for (let i = 0; i < pairs.length; i++) {
    let pair = pairs[i];
    const p = pair[0].center;
    const q = pair[1].center;
    const r = pair[0].radius;
    const s = pair[1].radius;
    transformations.push(...pairing({center: p, radius: r}, {center: q, radius: s}));
  }
  return transformations;
}


function get_fixed_points(tr) {
  let z1 = tr({x:1, y:0}),
      z2 = tr({x:0, y:0}),
      z3 = tr({x:INFINITY, y:INFINITY});
  let a = subtract(z1, z3),
      b = multiply(z2, subtract(z3, z1)),
      c = subtract(z1, z2),
      d = multiply(z3, subtract(z2, z1));
  if (c.x != 0 || c.y != 0) {
    // c != 0, so tr has two fixed points
    let sq = squareroot(
      add(
        multiply(
          subtract(a, d),
          subtract(a, d)
        ),
        multiply(re(4), multiply(b, c))
      )
    );
    return [
      divide(add(subtract(a, d), sq), multiply(re(2), c)),
      divide(subtract(subtract(a, d), sq), multiply(re(2), c))
    ];
  } else {
    return [{x:INFINITY, y: INFINITY}, divide(negate(b), subtract(a, d))];
  }
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

  add_circle(c, args) {
    args = args || {};
    c.center = c.center || {x: 0, y: 0};
    c.radius = c.radius || 1;

    let hk = this.get_hk(c.center);

    let circle_dom = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle_dom.setAttribute('cx', hk.h);
    circle_dom.setAttribute('cy', hk.k);
    circle_dom.setAttribute('r', c.radius * this.zoom);
    circle_dom.setAttribute('stroke', args.color || "blue");
    circle_dom.setAttribute('stroke-width', args.stroke_width || 0.1);
    circle_dom.setAttribute('fill', args.fill || "transparent");

    // const cent = args.center;
    // const rad = args.radius;
    // circle_dom.onmousedown = function() {
    //   circle_dom.setAttribute('fill', "red");
    // }
    // circle_dom.onmouseup = function() {
    //   circle_dom.setAttribute('fill', args.fill || "transparent");
    // }
    // circle_dom.onmouseleave = function() {
    //   circle_dom.setAttribute('fill', args.fill || "transparent");
    // }

    this.dom.appendChild(circle_dom);
    return circle_dom;
  }

  add_point(p, color) {
    this.add_circle(
      {center: p, radius: 0.1 / this.zoom},
      {color: color, fill: color}
    );
  }

}


function inverse_of(i) {
  if (i % 2 == 0) {
    return i + 1;
  }
  else {
    return i - 1;
  }
}

function are_inverses(i, j) {
  return Math.max(i, j) - Math.min(i, j) == 1 && Math.min(i, j) % 2 == 0;
}


function parse_clist(clist) {
  return {
    center: {x: clist[0][0], y: clist[0][1]},
    radius: clist[1]
  }
}

function parse_input(input_circles) {
  let base_circles = [];
  for (let i = 0; i < input_circles.length; i++) {
    base_circles[i] = [];
    for (let j = 0; j < 2; j++) {
      base_circles[i].push(parse_clist(input_circles[i][j]));
    }
  }
  return base_circles;
}

function circles_are_equal(c1, c2) {
  if (Math.abs(c1.center.x - c2.center.x) > 0.00000001) return false;
  if (Math.abs(c1.center.y - c2.center.y) > 0.00000001) return false;
  if (Math.abs(c1.radius - c2.radius) > 0.00000001) return false;
  return true;
}




const COMP_PURPOSES  = {
  'schottky': function(info) {
    // get base circles
    let input_circles = info.input_circles;
    let base_circles = parse_input(input_circles);

    // check that no pairs intersect
    for (let i = 0; i < base_circles.length; i++) {
      if (do_circles_overlap(...base_circles[i])) {
        throw "Circles " + JSON.stringify(input_circles[i][0]) + ' and ' + JSON.stringify(input_circles[i][1]) + " overlap";
      }
    }



    // build pairing mobius transformations based on the circles
    const transformations = get_transformations(base_circles);
    function get_random_transformation(last) {
      let new_t = Math.floor(Math.random() * transformations.length);
      // while (last && (new_t == inverse_of(last))) {
      //   new_t = Math.floor(Math.random() * transformations.length);
      // }
      return transformations[new_t];
    }



    // breadth first search through tree to make orbit of fomage
    let queue = [];
    for (let i = 0; i < base_circles.length; i++) {
      let pair = base_circles[i];
      queue.push({depth: 0, circle: pair[0], last: 2 * i});
      queue.push({depth: 0, circle: pair[1], last: 2 * i + 1});
    }
    while (queue.length > 0) {
      let node = queue.shift();
      let circle = node.circle;
      if (info.methods.includes('depth') && node.depth === info.depth) continue;
      if (info.methods.includes('smallest_radius') && circle.radius < info.smallest_radius) continue;
      self.postMessage({
        type: 'update',
        color: 'black',
        circle: circle
      })
      for (let i = 0; i < transformations.length; i++) {
        if (inverse_of(i) != node.last && inverse_of(node.last) != i) {
          queue.push({
            depth: node.depth + 1,
            circle: transform_circle(transformations[i], circle),
            last: i
          });
        }
      }
    }





    // manual limit set for specific group
    const DEPTH = 200;
    const SMALLEST_RADIUS = 0.0005;
    let lqueue = [];
    lqueue.push({depth: 0, circle: {center:{x:-0.5,y:0}, radius:0.5}, last:-1});
    lqueue.push({depth: 0, circle: {center:{x:0.5,y:0}, radius:0.5}, last: -1});
    lqueue.push({depth: 0, circle: {center:{x:0,y: 2/3}, radius: 1/3}, last:-1});
    lqueue.push({depth: 0, circle: {center:{x:0,y:-2/3}, radius:1/3}, last: -1});

    while (lqueue.length > 0) {
      let node = lqueue.shift();
      let circle = node.circle;
      if (info.methods.includes('depth') && node.depth === DEPTH) continue;
      if (info.methods.includes('smallest_radius') && circle.radius < SMALLEST_RADIUS) continue;

      let COLORS = ['red', 'green', 'blue', 'purple'];
      COLORS[-1] = 'orange';

      if (node.depth > 0) {
        if (Math.abs(circle.radius) > 0.2) continue;
      }

      self.postMessage({
        type: 'update',
        color: 'red', // COLORS[node.last],
        circle: circle,
        stroke_width: 0.5
      })

      for (let i of [0,1,2,3]) {
        if (!are_inverses(i, node.last)) {
          let new_circle = transform_circle(transformations[i], circle);
          // if (!circles_are_equal(circle, new_circle)) {
            lqueue.push({
              depth: node.depth + 1,
              circle: new_circle,
              last: i
            });
          // }
        }
      }
    }
    self.postMessage({
      type: 'update',
      color: 'red', // COLORS[node.last],
      circle: {center:{x:0,y:0}, radius: 1},
      stroke_width: 0.5
    })













































    // finding limit set




    // chaos game
    // let p = {x:1, y:0};
    // for (let i = 0; i < 100; i++) {
    //   p = get_random_transformation()(p);
    // }
    // for (let i = 0; i < 10000; i++) {
    //   p = get_random_transformation()(p);
    //   self.postMessage({
    //     type: 'update',
    //     color: 'red',
    //     point: p
    //   })
    // }






    // method 1
    // let queue = [];
    // for (let i = 0; i < base_circles.length; i++) {
    //   let pair = base_circles[i];
    //   queue.push({depth: 0, circle: pair[0], last: 2 * i});
    //   queue.push({depth: 0, circle: pair[1], last: 2 * i + 1});
    // }
    // while (queue.length > 0) {
    //   let node = queue.pop();
    //   let circle = node.circle;
    //   if (node.depth < 8) {
    //     for (let i = 0; i < transformations.length; i++) {
    //       if (inverse_of(i) != node.last && inverse_of(node.last) != i) {
    //         queue.push({
    //           depth: node.depth + 1,
    //           circle: transform_circle(transformations[i], circle),
    //           last: i
    //         });
    //       }
    //     }
    //   }
    //   else if (node.circle.radius < 0.01) {
    //     self.postMessage({
    //       type: 'update',
    //       color: 'red',
    //       circle: circle
    //     })
    //   }
    // }




    // method 2
    // let stack = [{depth: 0, point: {x:10, y:0}, last: -1}];
    // while (stack.length > 0) {
    //   let node = stack.pop();
    //   if (node.depth == 7) {
    //     self.postMessage({
    //       type: 'update',
    //       color: 'red',
    //       point: node.point
    //     })
    //   } else {
    //     for (let i = 0; i < transformations.length; i++) {
    //       if (inverse_of(i) != node.last && inverse_of(node.last) != i) {
    //         stack.push({
    //           depth: node.depth + 1,
    //           point: transformations[i](node.point),
    //           last: i
    //         });
    //       }
    //     }
    //   }
    // }




    // method 3
    // let fixed_points_ = transformations.map(x => get_fixed_points(x));
    // let fixed_points = [];
    // for (let pair of fixed_points_) {
    //   fixed_points.push(...pair);
    // }
    // let stack = [[]];
    // while (stack.length > 0) {
    //   let ts = stack.pop();
    //   if (ts.length == 7) {
    //     for (let fp of fixed_points) {
    //       let p = clone(fp);
    //       for (let t of ts) {
    //         p = transformations[t](p);
    //       }
    //       self.postMessage({
    //         type: 'update',
    //         color: 'red',
    //         point: p
    //       })
    //     }
    //   } else {
    //     let last = ts[ts.length - 1];
    //     for (let i = 0; i < transformations.length; i++) {
    //       if (inverse_of(i) != last && inverse_of(last) != i) {
    //         stack.push([...ts, i]);
    //       }
    //     }
    //   }
    // }





  }
}




self.onmessage = function(msg) {
  try {
    const data = msg.data;
    self.postMessage({
      type: 'complete',
      res: COMP_PURPOSES[data.purpose](data.info)
    });
  } catch (e) {
    self.postMessage({
      type: 'error',
      msg: e.message,
      error: e
    });
  }
}
