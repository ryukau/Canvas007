// utils //

// Converts from degrees to radians.
function radians(degrees) {
    return degrees * Math.PI / 180;
};

// Converts from radians to degrees.
function degrees(radians) {
    return radians * 180 / Math.PI;
};

function angle2D(origin, _a, _b) {
    var a = { x: _a.x - origin.x, y: _a.y - origin.y };
    var b = { x: _b.x - origin.x, y: _b.y - origin.y };
    return Math.acos((a.x * b.x + a.y * b.y) / (Math.sqrt(a.x * a.x + a.y * a.y) * Math.sqrt(b.x * b.x + b.y * b.y)));
}

// canvas設定 //
const MIN_VELOCITY = 1;
const MAX_VELOCITY = 14;
const ATTENUATION = 0.987;
const G = 800;
const NUM_POINTS = 32;
const TWO_PI = 2 * Math.PI;

var canvas = new Canvas(512, 512);
canvas.Element.addEventListener("click", onClickCanvas, false);
canvas.Element.addEventListener("dblclick", onDoubleClickCanvas, false);

var origin = {
    x: canvas.Width / 2,
    y: canvas.Height / 2,
    vx: 0.1 * (Math.random() * 2 - 1),
    vy: 0.1 * (Math.random() * 2 - 1),
    move: move
};
var point = [];
var isActive = false;

init();

function init() {
    clearCanvas();
    animate();
}

function animate() {
    updateCanvas();
    if (isActive) {
        action();
        requestAnimationFrame(animate);
    }
}

function updateCanvas() {
    canvas.clear("#ffffff");
    if (isActive) {
        canvas.feedback(0.9054, 1.002);
    }
    drawAxis();
    drawPoints();
    canvas.ImageData;
}

function drawAxis() {
    canvas.Context.strokeStyle = "#aaaaaa";
    canvas.Context.lineWidth = 1;

    canvas.Context.beginPath();
    canvas.Context.moveTo(origin.x, 0);
    canvas.Context.lineTo(origin.x, canvas.Height);
    canvas.Context.stroke();

    canvas.Context.beginPath();
    canvas.Context.moveTo(0, origin.y);
    canvas.Context.lineTo(canvas.Width, origin.y);
    canvas.Context.stroke();
}

function drawPoints() {
    canvas.Context.save();
    canvas.Context.translate(origin.x, origin.y);

    // 点を打つ
    canvas.Context.fillStyle = "#4444ff";
    for (var i = 0; i < point.length; ++i) {
        canvas.Context.beginPath();
        canvas.Context.arc(point[i].x - origin.x, point[i].y - origin.y, 2, 0, TWO_PI, true);
        canvas.Context.fill();
    }

    // 中心からの線を引く
    canvas.Context.strokeStyle = "#aaaaff";
    for (var i = 0; i < point.length; ++i) {
        canvas.Context.beginPath();
        canvas.Context.moveTo(0, 0);
        canvas.Context.lineTo(point[i].x - origin.x, point[i].y - origin.y);
        canvas.Context.stroke();
    }

    // 番号を振る
    canvas.Context.fillStyle = "#111111";
    if (point.length >= 1) {
        canvas.Context.fillText("point", point[0].x - origin.x, point[0].y - origin.y);
    }
    for (var i = 1; i < point.length; ++i) {
        var angle = angle2D(origin, point[i], point[0]);
        canvas.Context.fillText(degrees(angle).toFixed(3), point[i].x - origin.x, point[i].y - origin.y);
    }

    canvas.Context.restore();
}

function action() {
    origin.move();
    for (var i = 0; i < point.length; ++i) {
        point[i].move();
    }
}

function move() {
    // 移動
    this.x += this.vx;
    this.y += this.vy;

    // 画面の端で跳ね返る
    if (this.x < 0) {
        this.vx = - this.vx;
        //this.vy += (Math.random() * 2 - 1);
        this.x = 0;
    }
    else if (canvas.Width < this.x) {
        this.vx = - this.vx;
        //this.vy += (Math.random() * 2 - 1);
        this.x = canvas.Width;
    }

    if (this.y < 0) {
        //this.vx += (Math.random() * 2 - 1);
        this.vy = - this.vy;
        this.y = 0;
    }
    else if (canvas.Height < this.y) {
        //this.vx += (Math.random() * 2 - 1);
        this.vy = - this.vy;
        this.y = canvas.Height;
    }
}

function movePoint() {
    // 移動
    this.x += this.vx;
    this.y += this.vy;

    // origin に引き寄せられる
    var _x, _y, rr, r, gravity, i;
    _x = origin.x - this.x;
    _y = origin.y - this.y;
    rr = _x * _x + _y * _y;
    if (rr > 1e-6) {
        r = 1 / Math.sqrt(rr);
        gravity = G * r * r;
        this.vx += _x * gravity * r;
        this.vy += _y * gravity * r;
    }

    // 他の点に引き寄せられる
    for (i = 0; i < point.length; ++i) {
        _x = point[i].x - this.x;
        _y = point[i].y - this.y;
        rr = _x * _x + _y * _y;
        if (rr < 1e-6) {
            continue;
        }
        r = 1 / Math.sqrt(rr);
        gravity = G * r * r;
        this.vx += _x * gravity * r;
        this.vy += _y * gravity * r;
    }

    // 速度制限
    if (Math.abs(this.vx) < MIN_VELOCITY) {
        this.vx = Math.sign(this.vx) * MIN_VELOCITY;
    }
    else if (MAX_VELOCITY < Math.abs(this.vx)) {
        this.vx = Math.sign(this.vx) * MAX_VELOCITY;
    }

    if (Math.abs(this.vy) < MIN_VELOCITY) {
        this.vy = Math.sign(this.vy) * MIN_VELOCITY;
    }
    else if (MAX_VELOCITY < Math.abs(this.vy)) {
        this.vy = Math.sign(this.vy) * MAX_VELOCITY;
    }

    // 画面の端で跳ね返る
    if (this.x < 0) {
        this.vx = - this.vx * ATTENUATION;
        this.vy *= ATTENUATION;
        this.x = 0;
    }
    else if (canvas.Width < this.x) {
        this.vx = - this.vx * ATTENUATION;
        this.vy *= ATTENUATION;
        this.x = canvas.Width;
    }

    if (this.y < 0) {
        this.vx *= ATTENUATION;
        this.vy = - this.vy * ATTENUATION;
        this.y = 0;
    }
    else if (canvas.Height < this.y) {
        this.vx *= ATTENUATION;
        this.vy = - this.vy * ATTENUATION;
        this.y = canvas.Height;
    }
}

function clearCanvas() {
    point.length = 0;
}

// UI //

function onClickCanvas(event) {
    var rect = event.target.getBoundingClientRect();
    var x = event.clientX - rect.left;
    var y = event.clientY - rect.top;

    if (x === origin.x && y === origin.y) {
        return;
    }

    point.push({
        x: x,
        y: y,
        vx: (Math.random() * 4 - 2),
        vy: (Math.random() * 4 - 2),
        move: movePoint
    });

    if (!isActive) {
        updateCanvas();
    }
}

function onDoubleClickCanvas(event) {
    var rect = event.target.getBoundingClientRect();
    origin.x = event.clientX - rect.left;
    origin.y = event.clientY - rect.top;
    clearCanvas();

    if (!isActive) {
        updateCanvas();
    }
}

function onClickButtonDance() {
    if (isActive === true) {
        isActive = false;
        updateCanvas();
    }
    else {
        isActive = true;
        animate();
    }
}
