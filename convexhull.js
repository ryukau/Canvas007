// util //
function mod(a, b) {
    if (b < 0)
        return null;
    else if (a < 0)
        return b + a;
    else
        return a % b;
}

function randomInt(min, max) {
    return Math.floor(min + Math.random() * (max - min));
}

function crosses(a,b,c,d){
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

function circumcircle(a, b, c) {
    var A = b.x - a.x,
        B = b.y - a.y,
        C = c.x - a.x,
        D = c.y - a.y,
        E = A * (a.x + b.x) + B * (a.y + b.y),
        F = C * (a.x + c.x) + D * (a.y + c.y),
        G = 2 * (A * (c.y - b.y) - B * (c.x - b.x)),
        minx, miny, dx, dy

    /* If the points of the triangle are collinear, then just find the
    * extremes and use the midpoint as the center of the circumcircle. */
    if(Math.abs(G) < 0.000001) {
        minx = Math.min(a.x, b.x, c.x)
        miny = Math.min(a.y, b.y, c.y)
        dx   = (Math.max(a.x, b.x, c.x) - minx) * 0.5
        dy   = (Math.max(a.y, b.y, c.y) - miny) * 0.5

        return {
            x: minx + dx,
            y: miny + dy,
            r: Math.sqrt(dx * dx + dy * dy)
        }
    }

    else {
        var x = (D*E - B*F) / G
        var y = (A*F - C*E) / G
        dx = x - a.x
        dy = y - a.y

        return {
            x: x,
            y: y,
            r: Math.sqrt(dx * dx + dy * dy)
        }
    }
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
const NUM_POINTS = 128;
const TWO_PI = 2 * Math.PI;
const SCALE = 0.7;

var canvas = new Canvas(512, 512);
canvas.Element.addEventListener("click", onClickCanvas, false);

var point = [];

init();

function init() {
    canvas.Context.save();
    clearCanvas();
    canvas.Context.translate((1 - SCALE) * canvas.Width / 2, (1 - SCALE) * canvas.Height / 2);
    canvas.Context.scale(SCALE, SCALE);
    createPoints();
    createConvexHull();
    updateCanvas();
    //animate();
    canvas.Context.restore();
}

function createPoints() {
    point.length = 0;
    for (var i = 0; i < NUM_POINTS; ++i) {
        point.push({
            x: randomInt(0, canvas.Width),
            y: randomInt(0, canvas.Width),
            edge: [],
            visited: false
        });
    }
    //point[0].x = 100;
    //point[0].y = 100;
    //point[1].x = 100;
    //point[1].y = 100;
    //point[2].x = 200;
    //point[2].y = 200;
    //point[3].x = 210;
    //point[3].y = 500;
    //point[4].x = 400;
    //point[4].y = 450;

    sortByAngle(point);
}

function sortByAngle(array) {
    var p0index = 0,
        i,p0,origin;
    for (i = 1; i < array.length; ++i) {
        if (array[p0index].y > array[i].y
        || (array[p0index].y === array[i].y && array[p0index].x > array[i].x)) {
            p0index = i;
        }
    }
    p0 = array.splice(p0index, 1)[0];
    origin = {x: p0.x + 1, y: p0.y};
    array.sort(function(a, b) {
        var angle_a = angle2D(p0, origin, a),
            angle_b = angle2D(p0, origin, b);
        return angle_a - angle_b;
    });
    array.unshift(p0);
}

function createConvexHull() {
    if (point.length <= 3) {
        initializeEdge(point);
        return;
    }
    setHullEdge(grahamScan(point));
    //setHullEdge(jarvisMarch(point));
}

// Jarvis's march
// Q: set of point
// 入力の x, y が重複しないものだけを入れるのが無難。
function jarvisMarch(Q) {
    if (Q.length < 3) {
        return Q;
    }

    var hull = Q.slice(0, 2);

    jarvisMarchLoop(Q, 2, hull, getPk(Q));
    jarvisMarchLoop(Q, 0, hull, Q[0]);

    return hull;
}

function jarvisMarchLoop(Q, start_index, hull, pk) {
    // 2つ以上の点が同じ位置にあるとき以下の不具合があった。
    // 1. 前半、後半とも、たまに無限ループになる。
    // 2. 後半がうまく接続されない。
    // 従って、凸包上の重複するを点を除去している。
    var sign = (start_index === 2) ? 1 : - 1,
        i,p,pp,p_parallel,candidate_index,current_angle,previous_angle;

    while (hull[hull.length - 1] !== pk) {
        p = hull[hull.length - 1];
        pp = hull[hull.length - 2];
        if (p.x === pp.x && p.y === pp.y) {
            Q.splice(Q.indexOf(p), 1);
            hull.pop();
            continue;
        }
        p_parallel = {x: (p.x - pp.x) * 2 + p.x, y: (p.y - pp.y) * 2 + p.y};
        previous_angle = TWO_PI;
        candidate_index = start_index;
        for (i = start_index; i < Q.length; ++i) {
            if (p === Q[i]) {
                continue;
            }
            current_angle = angle2D(p, p_parallel, Q[i]);
            if (current_angle < previous_angle
            || (current_angle === previous_angle && sign * Q[candidate_index].x > sign * Q[i].x)) {
                candidate_index = i;
                previous_angle = current_angle;
            }
        }
        hull.push(Q[candidate_index]);
    }
}

function getPk(array) {
    var pkindex = 0,
        i;
    for (i = 1; i < array.length; ++i) {
        if (array[pkindex].y < array[i].y
        || (array[pkindex].y === array[i].y && array[pkindex].x > array[i].x)) {
            pkindex = i;
        }
    }
    return array[pkindex];
}

// Graham's scan
// Q: set of point
// S: stack
// これもデータに重複があるとうまくいかない。
// 重複するデータも凸包に加える場合、初期値に重複がある場合とそれ以外で重複がある場合で分ける必要がある。
function grahamScan(Q) {
    var S,i,j;
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
    console.log(S);
    return S;
}

function isRightTurn(a, b, c) {
    var ax = a.x - b.x,
        ay = a.y - b.y,
        bx = b.x - c.x,
        by = b.y - c.y,
        c = (ax * by - ay * bx);
    return Math.sign(c) <= 0 ? true : false;
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
    var i,index;
    for (i = 0; i < hull.length; ++i) {
        index = (i + 1) % hull.length;
        hull[i].edge.push(hull[index]);
        hull[index].edge.push(hull[i]);
    }
}

function isInCircumcircle(a, b, c, x) {
    var circle = circumcircle(a, b, c);
    if (lineLength(circle, x) < circle.r) {
        return true;
    }
    return false;
}

function drawCircle(p) {
    var r = isNaN(p.r) ? 5 : p.r;
    canvas.Context.beginPath();
    canvas.Context.arc(p.x, p.y, r, 0, Math.PI * 2, false);
    canvas.Context.stroke();
}

function animate() {
    point = [];
    createPoints();
    createConvexHull();
    updateCanvas();
    requestAnimationFrame(animate);
}

function updateCanvas() {
    //canvas.clear("#ffffff");
    drawEdge();
    drawPoints();
    drawNumber();
}

function drawEdge() {
    canvas.Context.strokeStyle = "#4444aa";
    canvas.Context.lineWidth = 0.5;

    for (var i = 0; i < point.length; ++i) {
        point[i].visited = false;
    }

    for (var i = 0; i < point.length; ++i) {
        if (point[i].visited === false) {
            drawReachableEdge(i);
        }
    }
}

function drawReachableEdge(index) {
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

function drawPoints() {
    canvas.Context.fillStyle = "#4444ff";
    for (var i = 0; i < point.length; ++i) {
        canvas.Context.beginPath();
        canvas.Context.arc(point[i].x, point[i].y, 2, 0, TWO_PI, true);
        canvas.Context.fill();
    }
}

function drawNumber() {
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
    init();
}
