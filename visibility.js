"use strict"

var compareSlope = require("compare-slope")

var EPSILON = 1e-8
var MAX_F = 1.0 / EPSILON

function segIntersect(s, pt, dx, dy) {
  var s0 = s[0]
    , s1 = s[1]
    , nx = s1[0] - s0[0]
    , ny = s1[1] - s0[1]
    , ax = s0[0] - pt[0]
    , ay = s0[1] - pt[1]
    , nn = ay * nx - ax * ny
    , dd = dy * nx - dx * ny
  return [ dx * nn / dd + pt[0], dy * nn / dd + pt[1]]
}

function approxEq(x, y) {
  return Math.abs(x-y) <= EPSILON * Math.min(Math.abs(x), Math.abs(y))
}

function approxCollinear(a, b, c) {
  return approxEq(a[0] * b[1] + b[0] * c[1] + c[0] * a[1],
                  a[0] * c[1] + b[0] * a[1] + c[0] * b[1])
}

function pointsEqual(a, b) {
  return approxEq(a[0], b[0]) && approxEq(a[1], b[1])
}

function cooriented(a, b, p, q) {
  var pxqy = p[0] * q[1]
    , pyqx = p[1] * q[0]
    , ap = a[0] * p[1] + q[0] * a[1] + pxqy
    , an = a[0] * q[1] + p[0] * a[1] + pyqx
    , bp = b[0] * p[1] + q[0] * b[1] + pxqy
    , bn = b[0] * q[1] + p[0] * b[1] + pyqx
  return ((ap > an) === (bp > bn)) || approxEq(ap, an) || approxEq(bp, bn)
}


function createVisibleHull(segments, pt) {
  var points = []
    , os = segments.length
  
  //Copy segments and add a box around region
  segments = segments.slice(0)
  segments.push([[ MAX_F+pt[0], MAX_F+pt[1]], [-MAX_F+pt[0],  MAX_F+pt[1]]])
  segments.push([[-MAX_F+pt[0], MAX_F+pt[1]], [-MAX_F+pt[0], -MAX_F+pt[1]]])
  segments.push([[-MAX_F+pt[0],-MAX_F+pt[1]], [ MAX_F+pt[0], -MAX_F+pt[1]]])
  segments.push([[ MAX_F+pt[0],-MAX_F+pt[1]], [ MAX_F+pt[0],  MAX_F+pt[1]]])

  //Project points onto circle
  for(var i=0, ns=segments.length; i<ns; ++i) {
    var s = segments[i]
      , ax = s[0][0] - pt[0]
      , ay = s[0][1] - pt[1]
      , bx = s[1][0] - pt[0]
      , by = s[1][1] - pt[1]
    //Check degenerate cases
    if((approxEq(ax,0) && approxEq(ay,0)) ||
       (approxEq(bx,0) && approxEq(by,0)) ||
       (approxEq(ax,bx) && approxEq(ay,by)) ) {
      continue
    }
    var a = [ax, ay, i, false]
      , b = [bx, by, i, true]
    //Handle x-crossing degeneracy
    if(by < 0 && ay > 0) {
      var dy = by - ay
        , dx = bx - ax
        , x = ax - ay * dx / dy
      if(x > EPSILON) {
        var q = [x, 0, i, false]
        if(!pointsEqual(b, q)) {
          b[3] = false
          points.push(b)
        }
        if(!pointsEqual(a, q)) {
          a[3] = true
          points.push(q)
          points.push(a)
        }
        continue
      }
    }
    if(ay < 0 && by > 0) {
      var dy = ay - by
        , dx = ax - bx
        , x  = bx - by * dx / dy
      if(x > EPSILON) {
        var q = [x, 0, i, false]
        if(!pointsEqual(a, q)) {
          points.push(a)
        }
        if(!pointsEqual(b, q)) {
          points.push(q)
          points.push(b)
        }
        continue
      }
    }
    //Handle x-touching degeneracy
    if(bx > 0 && ay < 0 && approxEq(by, 0)) {
      points.push(a)
      continue
    }
    if(ax > 0 && by < 0 && approxEq(ay, 0)) {
      b[3] = false
      points.push(b)
      continue
    }
    var sign = compareSlope(a, b)
    if(sign < 0) {
      points.push(a)
      points.push(b)
    } else if(sign > 0) {
      b[3] = false
      points.push(b)
      a[3] = true
      points.push(a)
    }
  }
  
  //Sort points by angle
  points.sort(compareSlope)
  points.push([1, 0, -1, true])
  
  //Assemble visible hull
  var vis_hull    = []
    , active      = []
    , pseg        = -1
    , result      = [0,0]
  for(var i=0, np=points.length; i<np; ++i) {
    var event = points[i]
    if(event[3]) {
      if(event[2] >= 0) {
        active[active.indexOf(event[2])] = active[active.length-1]
        active.pop()
      }
    } else {
      active.push(event[2])
    }
    if(i < np-1 && compareSlope(points[i], points[i+1]) === 0) {
      continue
    }
    var min_n = Infinity
      , min_d = 1
      , min_a = -1
      , dx = event[0]
      , dy = event[1]
    for(var j=0, na=active.length; j<na; ++j) {
      var a = active[j]
        , s = segments[a]
        , s0 = s[0]
        , s1 = s[1]
        , nx = s1[0] - s0[0]
        , ny = s1[1] - s0[1]
        , ax = pt[0] - s0[0]
        , ay = pt[1] - s0[1]
        , nn = ay * nx - ax * ny
        , dd = dx * ny - dy * nx
      if(dd < 0) {
        nn = -nn
        dd = -dd
      }
      if(nn > 0) {
        var xx = min_n * dd
          , yy = min_d * nn
        if(approxEq(xx, yy)) {
          s = segments[min_a]
          if(cooriented(pt, s0, s[0], s[1]) && cooriented(pt, s1, s[0], s[1])) {
            min_a = a
          }
        } else if(xx > yy) {
          min_n = nn
          min_d = dd
          min_a = a
        }
      }
    }
    if(min_a < 0) {
      continue
    }
    var hull_n = vis_hull.length
      , i1 = [ dx * min_n / min_d + pt[0], dy * min_n / min_d + pt[1] ]
    if(hull_n === 0) {
      vis_hull.push(i1)
    } else if(pseg !== min_a || event[2] < 0) {
      var s = segments[min_a]
        , i0 = segIntersect(segments[pseg], pt, dx, dy)
      if(!pointsEqual(i0, vis_hull[hull_n-1])) {
        vis_hull.push(i0)
        if(!pointsEqual(i0, i1)) {
          vis_hull.push(i1)
        }
      } else if(!pointsEqual(i1, vis_hull[hull_n-1])) {
        vis_hull.push(i1)
      }
    }
    pseg = min_a
  }
  
  //Check if end points need to be joined
  var hull_n = vis_hull.length
  if(pointsEqual(vis_hull[hull_n-1], vis_hull[0])) {
    vis_hull.pop()
    --hull_n
  }
  
  return vis_hull
}

module.exports = createVisibleHull
