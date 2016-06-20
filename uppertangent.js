// util //
function randomInt(min, max) {
    return Math.floor(min + Math.random() * (max - min));
}

function crosses(a, b, c, d) {
    // Tests if the segment a-b intersects with the segment c-d.
    // Ex: crosses({x:0,y:0},{x:1,y:1},{x:1,y:0},{x:0,y:1}) === true
    // Credit: Beta at http://stackoverflow.com/questions/7069420/check-if-two-line-segments-are-colliding-only-check-if-they-are-intersecting-n
    // Implementation by Viclib (viclib.com). from (http://jsfiddle.net/ytr9314a/4/)
    var aSide = (d.x - c.x) * (a.y - c.y) - (d.y - c.y) * (a.x - c.x) > 0;
    var bSide = (d.x - c.x) * (b.y - c.y) - (d.y - c.y) * (b.x - c.x) > 0;
    var cSide = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x) > 0;
    var dSide = (b.x - a.x) * (d.y - a.y) - (b.y - a.y) * (d.x - a.x) > 0;
    return aSide !== bSide && cSide !== dSide;
}

function angle2D(origin, a, b) {
    var ax = a.x - origin.x,
        ay = a.y - origin.y,
        bx = b.x - origin.x,
        by = b.y - origin.y,
        c1 = Math.sqrt(ax * ax + ay * ay),
        c2 = Math.sqrt(bx * bx + by * by),
        c = (ax * bx + ay * by) / (c1 * c2);
    return isNaN(c) ? 0 : Math.acos(Math.min(c, 1));
}

function mod(n, m) {
    return ((n % m) + m) % m;
}

function lineLength(a, b) {
    var x = a.x - b.x;
    var y = a.y - b.y;
    return Math.sqrt(x * x + y * y);
}

function addEdge(p1, p2) {
    p1.edge.push(p2);
    p2.edge.push(p1);
}

function deleteEdge(a, b) {
    a.edge.splice(a.edge.indexOf(b), 1);
    b.edge.splice(b.edge.indexOf(a), 1);
}

// canvas設定 //
const NUM_POINTS = 6;
const TWO_PI = 2 * Math.PI;
const SCALE = 0.7;
const NUM_HULL = 2;

var canvas = new Canvas(512, 512);
canvas.Element.addEventListener("click", onClickCanvas, false);

var setP = [];
var setHull = [];

init();

function init() {
    canvas.Context.save();
    canvas.Context.translate((1 - SCALE) * canvas.Width / 2, (1 - SCALE) * canvas.Height / 2);
    canvas.Context.scale(SCALE, SCALE);
    setHull.length = 0;
    for (let i = 0; i < NUM_HULL; ++i) {
        setP[i] = createPoints(i * canvas.Width / NUM_HULL, (i + 1) * canvas.Width / NUM_HULL);
        setHull.push(createConvexHull(setP[i]));
    }
    uppertangent = getUpperTangentLine(setHull[0], setHull[1]);
    canvas.Context.strokeStyle = "#ff8888";
    canvas.Context.beginPath();
    canvas.Context.moveTo(uppertangent[0].x, uppertangent[0].y);
    canvas.Context.lineTo(uppertangent[1].x, uppertangent[1].y);
    canvas.Context.stroke();
    updateCanvas();
    canvas.Context.restore();
}

function updateCanvas() {
    for (var i = 0; i < 2; ++i) {
        drawEdge(setHull[i]);
        drawPoints(setP[i]);
        drawNumber(setP[i]);
    }
}

// 候補エッジと接する線分がすべて左折 or 右折するなら候補エッジは上部接線。
// 左右の凸包で左折、右折の判定は逆になる。isTangentのturn。
// 与えられる凸包はx軸で交差しないことが条件。
function getUpperTangentLine(hullA, hullB) {
    var indexA = 0,
        indexB = 0,
        istanA, istanB;
    do {
        console.log(indexA, indexB);
        istanA = isTangent(hullA[indexA], hullB[indexB], true);
        istanB = isTangent(hullB[indexB], hullA[indexA], false);
        if (!istanA) {
            indexA = mod((indexA - 1), hullA.length);
        }
        else if (!istanB && indexB < hullB.length) {
            ++indexB;
        }
    } while (!(istanA && istanB));
    return [hullA[indexA], hullB[indexB]];
}

function isTangent(a, b, turn) {
    for (var i = 0; i < a.edge.length; ++i) {
        if (turn != isRightTurn(b, a, a.edge[i])) {
            return false;
        }
    }
    return true;
}

function createPoints(xmin, xmax) {
    var point = [];
    for (var i = 0; i < NUM_POINTS; ++i) {
        point.push({
            x: randomInt(xmin, xmax),
            y: randomInt(0, canvas.Height),
            edge: [],
            visited: false
        });
    }
    sortByAngle(point);
    return point;
}

function sortByAngle(array) {
    var p0index = 0,
        i, p0, origin;
    for (i = 1; i < array.length; ++i) {
        if (array[p0index].y > array[i].y
            || (array[p0index].y === array[i].y && array[p0index].x > array[i].x)) {
            p0index = i;
        }
    }
    p0 = array.splice(p0index, 1)[0];
    origin = { x: p0.x + 1, y: p0.y };
    array.sort(function (a, b) {
        var angle_a = angle2D(p0, origin, a),
            angle_b = angle2D(p0, origin, b);
        return angle_a - angle_b;
    });
    array.unshift(p0);
}

function createConvexHull(point) {
    if (point.length <= 3) {
        initializeEdge(point);
        return;
    }
    var hull = grahamScan(point);
    setHullEdge(hull);
    return hull;
}

function initializeEdge(p) {
    for (var i = 0; i < p.length; ++i) {
        for (var j = 0; j < p.length; ++j) {
            if (i === j) {
                continue;
            }
            p[i].edge.push(p[j]);
        }
    }
}

function setHullEdge(hull) {
    var i, index;
    for (i = 0; i < hull.length; ++i) {
        index = (i + 1) % hull.length;
        hull[i].edge.push(hull[index]);
        hull[index].edge.push(hull[i]);
    }
}

// Graham's scan
// Q: set of point
// S: stack
// これもデータに重複があるとうまくいかない。
// 重複するデータも凸包に加える場合、初期値に重複がある場合とそれ以外で重複がある場合で分ける必要がある。
function grahamScan(Q) {
    var S, i, j;
    S = [Q[0], Q[1], Q[2]];
    for (i = 3; i < Q.length; ++i) {
        while (isRightTurn(S[S.length - 2], S[S.length - 1], Q[i])) {
            S.pop();
            if (S.length < 3) {
                break;
            }
        }
        S.push(Q[i]);
    }
    return S;
}

function isRightTurn(a, b, c) {
    var ax = a.x - b.x,
        ay = a.y - b.y,
        bx = b.x - c.x,
        by = b.y - c.y,
        cross = (ax * by - ay * bx);
    return Math.sign(cross) <= 0 ? true : false;
}

function drawEdge(point) {
    canvas.Context.strokeStyle = "#4444aa";
    canvas.Context.lineWidth = 0.5;

    for (var i = 0; i < point.length; ++i) {
        point[i].visited = false;
    }

    for (var i = 0; i < point.length; ++i) {
        if (point[i].visited === false) {
            drawReachableEdge(point, i);
        }
    }
}

function drawReachableEdge(point, index) {
    // index 番のノードから到達可能なすべてのエッジを深さ優先探索で描画。
    // すべてに到達できるなら深さ優先でなくてもいい。
    stack = [point[index]];
    point[index].visited = true;

    while (stack.length > 0) {
        var v = stack.pop(); // currentNode
        drawEdgeLine(v);
        for (var i = 0; i < v.edge.length; ++i) {
            if (v.edge[i].visited === false) {
                v.edge[i].visited = true;
                stack.push(v.edge[i]);
            }
        }
    }
}

function drawEdgeLine(v) {
    for (var i = 0; i < v.edge.length; ++i) {
        canvas.Context.beginPath();
        canvas.Context.moveTo(v.x, v.y);
        canvas.Context.lineTo(v.edge[i].x, v.edge[i].y);
        canvas.Context.stroke();
    }
}

function drawPoints(point) {
    canvas.Context.fillStyle = "#4444ff";
    for (var i = 0; i < point.length; ++i) {
        canvas.Context.beginPath();
        canvas.Context.arc(point[i].x, point[i].y, 2, 0, TWO_PI, true);
        canvas.Context.fill();
    }
}

function drawNumber(point) {
    canvas.Context.fillStyle = "#000000";
    for (var i = 0; i < point.length; ++i) {
        canvas.Context.fillText(i, point[i].x, point[i].y);
    }
}

function clearCanvas() {
    canvas.clear("#ffffff");
}

// UI //

function onClickCanvas(event) {
    clearCanvas();
    init();
}