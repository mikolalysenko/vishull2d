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
  return [ dx * nn / dd, dy * nn / dd ]
}

function createVisibleHull(segments, pt) {
  var points = []
    , os = segments.length
  segments = segments.slice(0)
  segments.push([[ MAX_F+pt[0], MAX_F+pt[1]], [-MAX_F+pt[0],  MAX_F+pt[1]]])
  segments.push([[-MAX_F+pt[0], MAX_F+pt[1]], [-MAX_F+pt[0], -MAX_F+pt[1]]])
  segments.push([[-MAX_F+pt[0],-MAX_F+pt[1]], [ MAX_F+pt[0], -MAX_F+pt[1]]])
  segments.push([[ MAX_F+pt[0],-MAX_F+pt[1]], [ MAX_F+pt[0],  MAX_F+pt[1]]])

  for(var i=0, ns=segments.length; i<ns; ++i) {
    var s = segments[i]
      , ax = s[0][0] - pt[0]
      , ay = s[0][1] - pt[1]
      , bx = s[1][0] - pt[0]
      , by = s[1][1] - pt[1]
      , a = [ax, ay, i, false]
      , b = [bx, by, i, true]
    if(ay <= 0 && by > 0) {
      //Check for x-crossing and handle accordingly
      var dy = by - ay
        , dx = bx - ax
        , x = ax - ay * dx / dy
      if(x > EPSILON) {
        if(dy > 0) {
          points.push([x, 0, i, false])
          points.push([bx, by, i, true])
          points.push([ax, ay, i, false])
          points.push([x, -x * EPSILON, i, true])
        } else {
          points.push([x, 0, i, false])
          points.push([ax, ay, i, true])
          points.push([bx, by, i, false])
          points.push([x, -x * EPSILON, i, true])
        }
        continue
      }
    }
    var sign = compareSlope(a, b)
    if(sign < 0) {
      points.push(a)
      points.push(b)
    } else {
      a[3] = true
      b[3] = false
      points.push(a)
      points.push(b)
    }
  }
  
  //Sort points by angle
  points.sort(compareSlope)
  
  //Assemble visible hull
  var vis_hull    = []
    , segment_ids = []
    , active      = []
    , result      = [0,0]
  for(var i=0, np=points.length; i<np-1; ++i) {
    var event = points[i]
    if(event[3]) {
      active.splice(active.indexOf(event[2]), 1)
    } else {
      active.push(event[2])
    }
    if(i < np-1 && compareSlope(points[i], points[i+1]) === 0) {
      continue
    }
    var min_n = Infinity
      , min_d = 1
      , min_a = -1
      , d = points[i]
      , dx = d[0]
      , dy = d[1]
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
      if(min_n * dd > min_d * nn) {
        min_n = nn
        min_d = dd
        min_a = a
      }
    }
    var hull_n = vis_hull.length
    
    if(hull_n === 0) {
      vis_hull.push(segIntersect(segments[min_a], pt, dx, dy))
      segment_ids.push(min_a)
    } else {
      var pseg = segment_ids[hull_n-1]
      if(pseg !== min_a) {

        
        //Add intersection
        vis_hull.push(segIntersect(segments[pseg], pt, dx, dy))
        segment_ids.push(-1)

        //Start new segment
        vis_hull.push(segIntersect(segments[min_a], pt, dx, dy))
        segment_ids.push(min_a)
      }
    }
  }
  
  //Pop off last segment
  vis_hull.shift()
  segment_ids.shift()
  
  //Fix indices
  for(var i=0, hull_n=segment_ids.length; i<hull_n; ++i) {
    var sid = segment_ids[i]
    if(sid >= os) {
      segment_ids[i] = -1
    }
  }
  
  //Join end points together
  return {
    region: vis_hull,
    ids: segment_ids
  }
}

module.exports = createVisibleHull
