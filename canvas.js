class Canvas {
    constructor(width, height) {
        this.canvas = document.createElement("canvas");
        this.canvas.width = width;
        this.canvas.height = height;
        this.context = this.canvas.getContext("2d");
        this.imageData = this.context.getImageData(0, 0, width, height);
        this.pixels = this.imageData.data;
        document.body.appendChild(this.canvas);
    }

    get Element() {
        return this.canvas;
    }

    get Width() {
        return this.canvas.width;
    }

    get Height() {
        return this.canvas.height;
    }

    get Context() {
        return this.context;
    }

    get ImageData() {
        this.imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
        this.pixels = this.imageData.data;
        return this.imageData;
    }

    get Pixels() {
        return this.pixels;
    }

    set Visible(isVisible) {
        if (isVisible) {
            canvas.sytle.display = "inline";
        }
        else {
            canvas.style.display = "none";
        }
    }

    clear(color) {
        this.context.fillStyle = color;
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    resetTransform() {
        this.context.transform(1, 0, 0, 1, 0, 0);
    }

    feedback(alpha, white) {
        for (var y = 0; y < this.canvas.height; ++y) {
            for (var x = 0; x < this.canvas.width; ++x) {
                var index = (y * this.canvas.width + x) * 4;
                this.pixels[index + 0] = Math.min(this.pixels[index + 0] * white, 255); // R
                this.pixels[index + 1] = Math.min(this.pixels[index + 1] * white, 255); // G
                this.pixels[index + 2] = Math.min(this.pixels[index + 2] * white, 255); // B
                this.pixels[index + 3] *= alpha; // A
            }
        }
        this.context.putImageData(this.imageData, 0, 0);
    }
}
