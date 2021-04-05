
"use strict";

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

function distance(p1, p2) {
  return Math.sqrt((p1.x - p2.x)**2 + (p1.y - p2.y)**2);
}

function do_circles_overlap(c1, c2) {
  console.log()
  return c1.radius + c2.radius > distance(c1.center, c2.center);
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
    circle_dom.setAttribute('stroke-width', args.stroke_width || 0.1);
    circle_dom.setAttribute('fill', args.fill || "transparent");

    this.dom.appendChild(circle_dom);

    return circle_dom;
  }

}




const COMP_PURPOSES  = {
  'schottky': function(info) {
    let input_circles = info.input_circles;
    let base_circles = [];
    for (let i = 0; i < input_circles.length; i++) {
      base_circles[i] = [];
      for (let j = 0; j < 2; j++) {
        let circle = {
          center: {x: input_circles[i][j][0][0], y: input_circles[i][j][0][1]},
          radius: input_circles[i][j][1]
        };
        base_circles[i].push(circle);
      }
    }

    // check that no pairs intersect
    for (let i = 0; i < base_circles.length; i++) {
      if (do_circles_overlap(...base_circles[i])) {
        throw "Circles " + JSON.stringify(input_circles[i][0]) + ' and ' + JSON.stringify(input_circles[i][1]) + " overlap";
      }
    }


    // build pairing mobius transformations based on the circles, and start stack
    let transformations = [];
    let inverse = [];
    let queue = [];
    for (let i = 0; i < base_circles.length; i++) {
      let pair = base_circles[i];
      const p = pair[0].center;
      const q = pair[1].center;
      const r = pair[0].radius;
      const s = pair[1].radius;
      transformations.push(function(z) {
        return add(divide({x:-r*s, y:0}, conjugate(subtract(z, p))), q);
      });
      transformations.push(function(z) {
        return add(divide({x:-r*s, y:0}, conjugate(subtract(z, q))), p);
      });
      queue.push({
        depth: 0,
        circle: pair[0],
        last: 2 * i
      });
      queue.push({
        depth: 0,
        circle: pair[1],
        last: 2 * i + 1
      });
      inverse[2 * i] = 2 * i + 1;
      inverse[2 * i + 1] = 2 * i;
    }

    // let all_circles = [];
    // fixed depth first tree expansion of free group
    while (queue.length > 0) {
      let node = queue.shift();
      // if (node.depth == 10) continue;
      for (let i = 0; i < transformations.length; i++) {
        if (inverse[i] != node.last && inverse[node.last] != i) {
          let circle = clone(node.circle);

          self.postMessage({
            type: 'update',
            circle: circle
          })

          // all_circles.push(circle);

          if (circle.radius > info.smallest_radius) { // prune small circles
            queue.push({
              depth: node.depth + 1,
              circle: transform_circle(transformations[i], circle),
              last: i
            });
          }
        }
      }
    }
    // return all_circles;
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
