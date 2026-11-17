var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

var width, height, centerX, tieY;
var flowers = [];
var lastTime = 0;

function random(min, max) {
  return min + Math.random() * (max - min);
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function ease(n) {
  return 1 - Math.pow(1 - n, 3);
}

function setup() {
  var ratio = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  centerX = width / 2;
  tieY = height * 0.8;
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function getScale() {
  return Math.max(Math.min(width, height) / 800, 0.55);
}

function addFlower(angle, dist, delay) {
  flowers.push({
    angle: angle,
    dist: dist,
    baseSize: random(46, 74),
    growth: -delay,
    offset: random(-8, 8),
    lean: random(-28, 28),
    hue: random(268, 296),
    seed: random(0, 6.28)
  });
}

function update(f, dt, time) {
  var s = getScale();

  if (f.growth < 1) {
    f.growth = Math.min(1, f.growth + dt / 3.2);
  }

  f.size = f.baseSize * s;
  f.stemGrow = ease(clamp(f.growth / 0.55, 0, 1));
  f.open = clamp((f.growth - 0.4) / 0.6, 0, 1);
  f.sway = Math.sin(time / 1800 + f.seed) * f.size * 0.06;

  var goalX = centerX + Math.sin(f.angle) * f.dist * s * 1.1 + f.sway;
  var goalY = tieY - 120 * s - Math.cos(f.angle) * f.dist * s;

  f.startX = centerX + f.offset * s;
  f.startY = tieY;
  f.tipX = f.startX + (goalX - f.startX) * f.stemGrow;
  f.tipY = f.startY + (goalY - f.startY) * f.stemGrow;
  f.bendX = (f.startX + f.tipX) / 2 + f.lean * s * f.stemGrow;
  f.bendY = (f.startY + f.tipY) / 2;
}

function pointOnStem(f, u) {
  var a = (1 - u) * (1 - u);
  var b = 2 * (1 - u) * u;
  var c = u * u;
  return {
    x: a * f.startX + b * f.bendX + c * f.tipX,
    y: a * f.startY + b * f.bendY + c * f.tipY
  };
}

function drawLeaf(x, y, length, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  var grad = ctx.createLinearGradient(0, 0, length, 0);
  grad.addColorStop(0, "#173d2b");
  grad.addColorStop(1, "#2f7a4f");
  ctx.fillStyle = grad;

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(length * 0.3, -length * 0.35, length * 0.75, -length * 0.3, length, 0);
  ctx.bezierCurveTo(length * 0.75, length * 0.3, length * 0.3, length * 0.35, 0, 0);
  ctx.fill();

  ctx.strokeStyle = "rgba(160, 230, 180, 0.25)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(length * 0.85, 0);
  ctx.stroke();

  ctx.restore();
}

function drawStem(f) {
  ctx.lineCap = "round";
  ctx.strokeStyle = "#1f5236";
  ctx.lineWidth = f.size * 0.09;
  ctx.beginPath();
  ctx.moveTo(f.startX, f.startY);
  for (var i = 1; i <= 28; i++) {
    var p = pointOnStem(f, i / 28);
    ctx.lineTo(p.x, p.y);
  }
  ctx.stroke();

  var leaves = [
    { u: 0.3, angle: -2.5 },
    { u: 0.5, angle: -0.65 },
    { u: 0.7, angle: -2.5 }
  ];
  for (var j = 0; j < leaves.length; j++) {
    var leaf = leaves[j];
    if (f.stemGrow > leaf.u + 0.1) {
      var pos = pointOnStem(f, leaf.u);
      var length = f.size * (1 - j * 0.12) * clamp((f.stemGrow - leaf.u) * 3, 0, 1);
      drawLeaf(pos.x, pos.y, length, leaf.angle);
    }
  }
}

function drawPetal(length, half) {
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(-half * 1.1, -length * 0.25, -half * 1.35, -length * 0.95, 0, -length);
  ctx.bezierCurveTo(half * 1.35, -length * 0.95, half * 1.1, -length * 0.25, 0, 0);
  ctx.closePath();
}

function drawBloom(f) {
  if (f.open <= 0) {
    return;
  }

  ctx.save();
  ctx.translate(f.tipX, f.tipY);
  ctx.rotate(Math.sin(f.seed) * 0.2 + f.sway / f.size);

  var glow = ctx.createRadialGradient(0, 0, 0, 0, 0, f.size * 1.7);
  glow.addColorStop(0, "hsla(" + f.hue + ", 80%, 60%, " + (0.28 * f.open) + ")");
  glow.addColorStop(1, "hsla(" + f.hue + ", 80%, 60%, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, f.size * 1.7, 0, Math.PI * 2);
  ctx.fill();

  for (var layer = 0; layer < 7; layer++) {
    var show = clamp((f.open * 1.5 - layer * 0.09) / 0.55, 0, 1);
    if (show <= 0) {
      continue;
    }

    var count = Math.max(3, 8 - layer);
    var length = f.size * (1 - layer * 0.11) * (0.35 + 0.65 * ease(show));
    var half = length * Math.sin(Math.PI / count) * 1.05;
    var light = 58 - layer * 3.2;

    var grad = ctx.createLinearGradient(0, 0, 0, -length);
    grad.addColorStop(0, "hsl(" + f.hue + ", 58%, 16%)");
    grad.addColorStop(0.55, "hsl(" + f.hue + ", 55%, " + (light - 10) + "%)");
    grad.addColorStop(1, "hsl(" + f.hue + ", 68%, " + (light + 9) + "%)");

    for (var i = 0; i < count; i++) {
      ctx.save();
      ctx.rotate(layer * 2.399 + f.seed + i * Math.PI * 2 / count);
      ctx.fillStyle = grad;
      drawPetal(length, half);
      ctx.fill();
      ctx.strokeStyle = "hsla(" + f.hue + ", 80%, 85%, 0.28)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }
  }

  ctx.strokeStyle = "hsla(" + f.hue + ", 60%, 12%, 0.7)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (var a = 0; a < 18; a += 0.15) {
    var r = f.size * 0.02 * a;
    ctx.lineTo(Math.cos(a + f.seed) * r, Math.sin(a + f.seed) * r);
  }
  ctx.stroke();

  ctx.restore();
}

function drawPaper() {
  var s = getScale();
  var top = tieY - 105 * s;
  var bottom = Math.min(height * 0.985, tieY + 190 * s);
  var half = 95 * s;

  var grad = ctx.createLinearGradient(centerX - half, 0, centerX + half, 0);
  grad.addColorStop(0, "#c4a8e0");
  grad.addColorStop(0.5, "#efe2fa");
  grad.addColorStop(1, "#b293d3");
  ctx.fillStyle = grad;
  ctx.strokeStyle = "rgba(60, 30, 90, 0.35)";
  ctx.lineWidth = 1.2;

  ctx.beginPath();
  ctx.moveTo(centerX - half, top);
  ctx.lineTo(centerX + half, top - 8 * s);
  ctx.lineTo(centerX + 22 * s, bottom);
  ctx.lineTo(centerX - 22 * s, bottom);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = "rgba(60, 30, 90, 0.22)";
  ctx.beginPath();
  ctx.moveTo(centerX - half * 0.2, top + 4 * s);
  ctx.lineTo(centerX + 8 * s, bottom);
  ctx.stroke();

  var ribbonY = tieY + 14 * s;
  var ribbonHalf = half + (22 * s - half) * ((ribbonY - top) / (bottom - top));
  ctx.fillStyle = "#6a3aa3";
  ctx.fillRect(centerX - ribbonHalf, ribbonY - 8 * s, ribbonHalf * 2, 16 * s);

  ctx.fillStyle = "#8a52c9";
  ctx.strokeStyle = "#4a2478";
  ctx.lineWidth = 1.2;
  var sides = [-1, 1];
  for (var i = 0; i < sides.length; i++) {
    var d = sides[i];

    ctx.beginPath();
    ctx.ellipse(centerX + d * 24 * s, ribbonY - 4 * s, 24 * s, 13 * s, d * -0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(centerX + d * 4 * s, ribbonY);
    ctx.quadraticCurveTo(centerX + d * 22 * s, ribbonY + 30 * s, centerX + d * 34 * s, ribbonY + 58 * s);
    ctx.lineTo(centerX + d * 20 * s, ribbonY + 50 * s);
    ctx.quadraticCurveTo(centerX + d * 8 * s, ribbonY + 28 * s, centerX, ribbonY + 4 * s);
    ctx.fill();
    ctx.stroke();
  }

  ctx.fillStyle = "#a574e0";
  ctx.beginPath();
  ctx.arc(centerX, ribbonY, 9 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

function animate(time) {
  var dt = Math.min(0.05, (time - lastTime) / 1000);
  lastTime = time;

  var bg = ctx.createLinearGradient(0, 0, 0, height);
  bg.addColorStop(0, "#1b0d2e");
  bg.addColorStop(0.7, "#12091d");
  bg.addColorStop(1, "#0b1a14");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  for (var i = 0; i < flowers.length; i++) {
    update(flowers[i], dt, time);
  }

  flowers.sort(function (a, b) {
    return a.size - b.size;
  });

  for (var j = 0; j < flowers.length; j++) {
    drawStem(flowers[j]);
  }

  drawPaper();

  for (var k = 0; k < flowers.length; k++) {
    drawBloom(flowers[k]);
  }

  requestAnimationFrame(animate);
}

setup();
window.addEventListener("resize", setup);

for (var i = 0; i < 9; i++) {
  var angle = -0.9 + i * 0.225;
  addFlower(angle, 260 + random(-25, 25) - Math.abs(angle) * 60, i * 0.07);
}
for (var n = 0; n < 4; n++) {
  addFlower(-0.5 + n * 0.33, 150 + random(-15, 15), (9 + n) * 0.07);
}

requestAnimationFrame(animate);