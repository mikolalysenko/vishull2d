var vishull = require("../visibility")

var width = 500
var height = 500

var canvas = document.createElement("canvas")
canvas.width = width
canvas.height = height
document.body.appendChild(canvas)

var context = canvas.getContext("2d")

var lines = []
var dt = 0.1
var r = 100
var cx = width/2
var cy = height/2
for(var t=0.0; t+dt<2.0*Math.PI; t+=dt) {
  lines.push([
    [r*Math.cos(t)+cx, r*Math.sin(t)+cy],
    [r*Math.cos(t-dt/2)+cx, r*Math.sin(t-dt/2)+cy]
  ])
}

lines.push([[400,300], [300,400]])
lines.push([[400,300], [400,400]])
lines.push([[300,400], [400,400]])

function redraw(p) {
  context.fillStyle = "#234"
  context.fillRect(0, 0, width, height)
  
  var region = vishull(lines, p)
  
  context.fillStyle = "rgba(255, 255, 130, 0.5)"
  context.beginPath()
  context.moveTo(region[0][0], region[0][1])
  for(var i=1; i<region.length; ++i) {
    var r = region[i]
    context.lineTo(r[0], r[1])
  }
  context.lineTo(region[0][0], region[0][1])
  context.closePath()
  context.fill()
  
  context.strokeStyle = "rgba(128, 198, 100, 1.0)"
  for(var i=0; i<lines.length; ++i) {
    var s = lines[i]
    context.beginPath()
    context.moveTo(s[0][0], s[0][1])
    context.lineTo(s[1][0], s[1][1])
    context.closePath()
    context.stroke()
  }
  
  context.fillStyle = "rgba(255, 255, 0, 1)"
  context.beginPath()
  context.arc(p[0], p[1], 10, 0.0, 2.0*Math.PI)
  context.closePath()
  context.fill()
}

canvas.addEventListener("click", function(e) {
  redraw([e.x, e.y])
})

redraw([width/2, height/2])