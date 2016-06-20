class ConvexHull {
    constructor(node) {
        this.S = []
        this.Q = this.sortByAngle(node)
        this.grahamScan(this.Q)
    }

    get Stack() {
        return this.S
    }

    // Graham's scan
    // Q: set of point
    // S: stack
    // これもデータに重複があるとうまくいかない。
    // 重複するデータも凸包に加える場合、初期値に重複がある場合とそれ以外で重複がある場合で分ける必要がある。
    grahamScan(Q) {
        var i, j
        this.S = [Q[0], Q[1], Q[2]]
        for (i = 3; i < Q.length; ++i) {
            while (this.isRightTurn(this.S[this.S.length - 2], this.S[this.S.length - 1], Q[i])) {
                this.S.pop()
                if (this.S.length < 3) {
                    break
                }
            }
            this.S.push(Q[i])
        }
    }

    isRightTurn(a, b, c) {
        var ax = a.x - b.x,
            ay = a.y - b.y,
            bx = b.x - c.x,
            by = b.y - c.y,
            c = (ax * by - ay * bx)

        return Math.sign(c) <= 0 ? true : false
    }

    sortByAngle(node) {
        var p0index = 0,
            i, p0, origin

        for (i = 1; i < node.length; ++i) {
            if (node[p0index].y > node[i].y
                || (node[p0index].y === node[i].y && node[p0index].x > node[i].x)) {
                p0index = i
            }
        }
        p0 = node.splice(p0index, 1)[0]
        origin = { x: p0.x + 1, y: p0.y }
        node.sort(function (a, b) {
            var angle_a = ConvexHull.angle2D(p0, origin, a),
                angle_b = ConvexHull.angle2D(p0, origin, b)

            return angle_a - angle_b
        })
        node.unshift(p0)

        return node
    }

    static angle2D(origin, a, b) {
        var ax = a.x - origin.x,
            ay = a.y - origin.y,
            bx = b.x - origin.x,
            by = b.y - origin.y,
            c1 = Math.sqrt(ax * ax + ay * ay),
            c2 = Math.sqrt(bx * bx + by * by),
            c = (ax * bx + ay * by) / (c1 * c2)

        return isNaN(c) ? 0 : Math.acos(Math.min(c, 1))
    }
}

class Graph {
    constructor(number_node, width, height) {
        this.hull = []
        this.node = []
        this.triangle = []
        this.initializeNode(number_node, width, height)
        this.triangulation()
    }

    get Hull() {
        return this.hull.Stack
    }

    get Triangle() {
        return this.triangle
    }

    initializeNode(number_node, width, height) {
        this.node.length = 0
        for (var i = 0; i < number_node; ++i) {
            this.createNode(
                (Math.random() - 0.5) * width,
                (Math.random() - 0.5) * height
            )
        }
    }

    // 適当な点を適当な三角形に分割する。
    // 1. 凸包を計算。
    // 2. 凸包のある点と、凸包の全ての辺との間で三角形を作る。
    // 3. 凸包内の点を順次追加していく。点が内側にある三角形を見つけたらそれを分割する。
    triangulation() {
        this.hull = new ConvexHull(this.node)
        var hull = this.Hull
        var length = hull.length - 1
        var i, j

        this.triangle.length = 0
        for (i = 1; i < length; ++i) {
            this.createTriangle(hull[0], hull[i], hull[i + 1])
        }

        for (i = 0; i < this.node.length; ++i) {
            if (hull.includes(this.node[i])) {
                continue
            }
            for (j = 0; j < this.triangle.length; ++j) {
                if (this.hitTest(this.triangle[j], this.node[i])) {
                    this.createTriangle(this.triangle[j].a, this.triangle[j].b, this.node[i])
                    this.createTriangle(this.triangle[j].b, this.triangle[j].c, this.node[i])
                    this.createTriangle(this.triangle[j].c, this.triangle[j].a, this.node[i])
                    this.triangle.splice(j, 1)
                    break
                }
            }
        }
    }

    // Barycentric Technique (http://www.blackpawn.com/texts/pointinpoly/)
    hitTest(triangle, point) {
        var v0x = triangle.c.x - triangle.a.x,
            v0y = triangle.c.y - triangle.a.y,
            v1x = triangle.b.x - triangle.a.x,
            v1y = triangle.b.y - triangle.a.y,
            v2x = point.x - triangle.a.x,
            v2y = point.y - triangle.a.y,
            dot00 = v0x * v0x + v0y * v0y,
            dot01 = v0x * v1x + v0y * v1y,
            dot02 = v0x * v2x + v0y * v2y,
            dot11 = v1x * v1x + v1y * v1y,
            dot12 = v1x * v2x + v1y * v2y,
            invDenom = 1 / (dot00 * dot11 - dot01 * dot01),
            u = (dot11 * dot02 - dot01 * dot12) * invDenom,
            v = (dot00 * dot12 - dot01 * dot02) * invDenom

        return (u >= 0) && (v >= 0) && (u + v < 1)
    }

    createNode(x, y) {
        this.node.push({
            x: x,
            y: y,
            dx: 0,
            dy: 0,
        })
    }

    createTriangle(a, b, c) {
        var t = {
            a: a,
            b: b,
            c: c,
        }

        this.triangle.push(t)
    }

    action(distance) {
        var i

        for (i = 0; i < this.node.length; ++i) {
            this.node[i].dx = 0
            this.node[i].dy = 0
        }

        for (var i = 0; i < this.triangle.length; ++i) {
            this.adjustDistance(this.triangle[i].a, this.triangle[i].b, distance)
            this.adjustDistance(this.triangle[i].b, this.triangle[i].c, distance)
            this.adjustDistance(this.triangle[i].c, this.triangle[i].a, distance)
        }

        for (i = 0; i < this.node.length; ++i) {
            this.node[i].x += this.node[i].dx
            this.node[i].y += this.node[i].dy
        }
    }

    adjustDistance(a, b, distance) {
        if (this.Hull.includes(a) || this.Hull.includes(b)) {
            return
        }

        var xab = a.x - b.x,
            yab = a.y - b.y,
            d = Math.sqrt(xab * xab + yab + yab)

        if (d < (distance)) {
            a.dx += xab * 0.01
            a.dy += yab * 0.01
            b.dx -= xab * 0.01
            b.dy -= yab * 0.01
        }
        else if (d > (distance)) {
            a.dx -= xab * 0.01
            a.dy -= yab * 0.01
            b.dx += xab * 0.01
            b.dy += yab * 0.01
        }
    }
}

// end of classes //

var cv = new Canvas(512, 512)
cv.Element.addEventListener("click", onClickCanvas, false);
const CENTER = {
    x: cv.Width / 2,
    y: cv.Height / 2,
}
const SCALE = 0.8

var graph = new Graph(24, cv.Width, cv.Height)

init()

function init() {
    animate()
}

function animate() {
    updateCanvas()
    graph.action(24)
    graph.triangulation()
    requestAnimationFrame(animate)
}

function updateCanvas() {
    cv.clear("#ffffff")
    cv.Context.save()
    cv.Context.translate(CENTER.x, CENTER.y)
    cv.Context.scale(SCALE, SCALE)
    drawHull()
    drawTriangle()
    drawNode()
    cv.Context.restore()
}

function drawTriangle() {
    var triangle = graph.Triangle
    var color

    cv.Context.lineWidth = 4
    cv.Context.lineJoin = "round"
    for (var i = 0; i < triangle.length; ++i) {
        color = "#ffdd33"//"#" + ("00000" + Math.floor(0xffffff * Math.random()).toString(16)).slice(-6)
        cv.Context.strokeStyle = color
        cv.Context.beginPath()
        cv.Context.moveTo(triangle[i].a.x, triangle[i].a.y)
        cv.Context.lineTo(triangle[i].b.x, triangle[i].b.y)
        cv.Context.lineTo(triangle[i].c.x, triangle[i].c.y)
        cv.Context.closePath()
        cv.Context.stroke()
    }
}

function drawHull() {
    var hull = graph.Hull
    var length = hull.length - 1

    cv.Context.strokeStyle = "#cccccc"
    cv.Context.lineWidth = 7
    for (var i = 0; i < length; ++i) {
        drawLine(hull[i], hull[i + 1])
    }
    drawLine(hull[hull.length - 1], hull[0])
}

function drawNode() {
    cv.Context.fillStyle = "#6789ee"
    for (var i = 0; i < graph.node.length; ++i) {
        drawPoint(graph.node[i], 5)
    }
}

function drawLine(a, b) {
    cv.Context.beginPath()
    cv.Context.moveTo(a.x, a.y)
    cv.Context.lineTo(b.x, b.y)
    cv.Context.stroke()
}

function drawPoint(point, radius) {
    cv.Context.beginPath()
    cv.Context.arc(point.x, point.y, radius, 0, Math.PI * 2, false)
    cv.Context.fill()
}

// UI //

function onClickCanvas(event) {
    graph = new Graph(24, cv.Width, cv.Height)
}
