
var cywidgetsDrawableSaved = [];
var cywidgetsCssVariablesDependantObjects = [];
var cywidgetsTheme = 0;

function lerp(a,b,t){
    return a + (b-a) * t;
}
function lerp01(a,b,t){
    if (t < 0)
        return a;
    if (t > 1)
        return b;
    return a + (b-a) * t;
}
function clamp01(x){
    if (x < 0)
        return 0;
    if (x > 1)
        return 1;
    return x;
}

function easeInOutCubic(x) {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}
function easeInOutQuad(x) {
    return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
}

function bezierQuad(t, a, b, c){
    return (1-t)*((1-t)*a+t*b) + t*((1-t)*b+t*c);
}

function bezierCubic(t, a, b, c, d){
    return (1-t) * bezierQuad(t,a,b,c) + t * bezierQuad(t,b,c,d);
}

function bezierCubicPoint(t, a, b, c, d){
    return [
        bezierCubic(t, a[0], b[0], c[0], d[0]),
        bezierCubic(t, a[1], b[1], c[1], d[1])
    ]
}

function posmod(a, b){
    if (a >= 0)
        return a % b;
    return a % b + b;
}

function precisionRounding(x, precision){
    return Math.round(x * precision) / precision;
}

function deg2rad(deg){
    return deg * Math.PI / 180;
}

function startAnimation(duration, callback, then, easing_function){
    const start = performance.now();

    function inner(tick){
        const time = (tick - start) / duration;

        let smooth = time;
        if (easing_function != undefined)
            smooth = easing_function(time);

        callback(smooth);

        if (time < 1){
            requestAnimationFrame(inner);
        } else {
            then();
        }
    }

    inner(start);
}

function renderAllSavedWidgets(){
    cywidgetsCssVariablesDependantObjects.forEach((obj) => {
        obj.cssVariablesChanged();
    });
    cywidgetsDrawableSaved.forEach(widget => {
        if (widget){
            widget.draw();
        }
    });
}

class CameraTransform
{
    constructor(x = 0, y = 0, zoomX = 1, zoomY = 1){
        this.x = x;
        this.y = y;
        this.zoomX = zoomX;
        this.zoomY = zoomY;
    }

    // From UV to bounds (lerp)
    transformPoint(point){
        return [
            (point[0] - this.x) * this.zoomX,
            (point[1] - this.y) * this.zoomY,
        ];
    }
    transformVector(vec){
        return [
            vec[0] * this.zoomX,
            vec[1] * this.zoomY,
        ];
    }

    // From bounds to UV (inverse-lerp)
    transformPointInverse(point){
        return [
            point[0] / this.zoomX + this.x,
            point[1] / this.zoomY + this.y,
        ];
    }
    transformVectorInverse(vec){
        return [
            vec[0] / this.zoomX,
            vec[1] / this.zoomY,
        ];
    }

    zoom(factorX, factorY){
        this.zoomX *= factorX;
        this.zoomY *= factorY;
    }

    addPosition(x = 0, y = 0){
        this.x += x;
        this.y += y;
    }
    addZoom(zoomX = 0, zoomY = 0){
        this.zoomX += zoomX;
        this.zoomY += zoomY;
    }

    reset(){
        this.x = 0;
        this.y = 0;
        this.zoomX = 1;
        this.zoomY = 1;
    }
}


class CameraTransformSmoothProxy extends CameraTransform
{
    sleep_threshold = .0001; // Movements under this speed will be stopped

    speed;
    camera;

    _x;
    _y;
    _zoomX;
    _zoomY;

    tar_x;
    tar_y;
    tar_zoomX;
    tar_zoomY;
    #old_tick;

    
    /**
     * 
     * Creates a camera proxy for automatic movement and zoom damping
     * @param {CameraTransform} camera camera to control
     * @param {*} speed speed of lerping
     * @param {*} callback callback after each movement
     */
    constructor(camera, speed = 5, callback = undefined){
        super(camera.x, camera.y, camera.zoomX, camera.zoomY);

        this.camera = camera;
        this.speed = speed;
        this.callback = callback;

        this.copyCamera();

        this.#old_tick = performance.now();
        this.update(this.#old_tick);
    }

    copyCamera(){
        this._x = this.camera.x;
        this._y = this.camera.y;
        this._zoomX = this.camera.zoomX;
        this._zoomY = this.camera.zoomY;
        this.resetTarget();
    }

    resetTarget(){
        this.tar_x = this.x;
        this.tar_y = this.y;
        this.tar_zoomX = this.zoomX;
        this.tar_zoomY = this.zoomY;
    }

    teleportToTarget(){
        this._x = this.tar_x;
        this._y = this.tar_y;
        this._zoomX = this.tar_zoomX;
        this._zoomY = this.tar_zoomY;
    }

    reset(){
        this._x = 0;
        this._y = 0;
        this._zoomX = 1;
        this._zoomY = 1;
        this.resetTarget();
    }

    update(tick){
        const delta = tick - this.#old_tick;
        this.#old_tick = tick;

        const t = delta * this.speed * .001;

        const oldX = this._x;
        const oldY = this._y;
        const oldZoomX = this._zoomX;
        const oldZoomY = this._zoomY;

        this._x = lerp01(this._x, this.tar_x, t);
        this._y = lerp01(this._y, this.tar_y, t);
        this._zoomX = lerp01(this._zoomX, this.tar_zoomX, t);
        this._zoomY = lerp01(this._zoomY, this.tar_zoomY, t);

        const speed = Math.abs(this._x - oldX) + Math.abs(this._y - oldY) + Math.abs(this._zoomX - oldZoomX) + Math.abs(this._zoomY - oldZoomY);
        if (speed < this.sleep_threshold){
            this.teleportToTarget();
        }
        
        requestAnimationFrame((tick) => this.update(tick));
        
        if (this.callback != undefined)
            this.callback();
    }

    /**
     * @param {number} value
     */
    set x(value){
        this.tar_x = value;
    }
    /**
     * @param {number} value
     */
    set y(value){
        this.tar_y = value;
    }
    /**
     * @param {number} value
     */
    set zoomX(value){
        this.tar_zoomX = value;
    }
    /**
     * @param {number} value
     */
    set zoomY(value){
        this.tar_zoomY = value;
    }

    get x(){
        return this._x;
    }
    get y(){
        return this._y;
    }
    get zoomX(){
        return this._zoomX;
    }
    get zoomY(){
        return this._zoomY;
    }
    
    zoom(factorX, factorY){
        this.tar_zoomX *= factorX;
        this.tar_zoomY *= factorY;
    }
    addPosition(x = 0, y = 0){
        this.tar_x += x;
        this.tar_y += y;
    }
    addZoom(zoomX = 0, zoomY = 0){
        this.tar_zoomX += zoomX;
        this.tar_zoomY += zoomY;
    }
}

class Bounds
{
    constructor(minX, minY, maxX, maxY){
        this.minX = minX;
        this.minY = minY;
        this.maxX = maxX;
        this.maxY = maxY;
    }

    // From UV to bounds (lerp)
    transformPoint(point){
        return [
            this.minX + (this.maxX - this.minX) * point[0],
            this.minY + (this.maxY - this.minY) * point[1],
        ];
    }
    transformVector(vec){
        return [
            vec[0] * (this.maxX - this.minX),
            vec[1] * (this.maxY - this.minY),
        ];
    }

    // From bounds to UV (inverse-lerp)
    transformPointInverse(point){
        return [
            (point[0] - this.minX) / (this.maxX - this.minX),
            (point[1] - this.minY) / (this.maxY - this.minY),
        ];
    }
    transformVectorInverse(vec){
        return [
            vec[0] / (this.maxX - this.minX),
            vec[1] / (this.maxY - this.minY),
        ];
    }

    // Point from this bounds to other bounds
    transformPointToBounds(point, bounds){
        return bounds.transformPoint(this.transformPointInverse(point));
    }

    width(){
        return this.maxX-this.minX;
    }
    height(){
        return this.maxY-this.minY;
    }
}

class CywidgetPlaneXY
{
    // Default settings
    #incrementX = 2;
    #incrementY = 2;
    minimumBoundsSize = [2,2];
    usePixelPerfectCss = false;
    allowHorizontalDragging = true;
    allowVerticalDragging = true;
    allowAutoHorizontalIncrement = true;
    allowAutoVerticalIncrement = true;
    staticHorizontalIncrement = false;
    staticVerticalIncrement = false;
    autoHorizontalIncrementCount = 5;
    autoVerticalIncrementCount = 5;
    incrementLabelsPrecision = 10;
    #allowVerticalZoom = true;
    #allowHorizontalZoom = true;

    // Declarations
    #valueBounds = new Bounds(0, 0, 1, 1);
    #canvasBounds;
    camera = new CameraTransform();
    #dragging = false;
    #dragX = 0;
    #dragY = 0;
    #mouseX = 0;
    #mouseY = 0;
    #animationToken = 0;
    #animationTime = -1;

    constructor(element){
        cywidgetsDrawableSaved.push(this);

        this.element = element;
        this.elemCanvas = element.getElementsByClassName("cywidgetPlaneXYCanvas")[0];
        this.elemGrid = element.getElementsByClassName("cywidgetPlaneXYGrid")[0];
        this.elemLabelX = element.getElementsByClassName("cywidgetAxisX")[0].children[0];
        this.elemLabelY = element.getElementsByClassName("cywidgetAxisY")[0].children[0];
        this.elemAxisXIncrements = element.getElementsByClassName("cywidgetAxisX")[0].getElementsByClassName("cywidgetAxisIncrements")[0];
        this.elemAxisYIncrements = element.getElementsByClassName("cywidgetAxisY")[0].getElementsByClassName("cywidgetAxisIncrements")[0];
        this.elemBtnResetFraming = element.getElementsByClassName("cywidgetBtnResetFraming")[0];
        this.ctx = this.elemCanvas.getContext("2d");

        this.#canvasBounds = new Bounds(0, 0, this.elemCanvas.width, this.elemCanvas.height);

        this.readDataset();

        this.clear();
        this.#cameraChanged();
        this.#allowedZoomChanged();

        // Fit canvas
        window.addEventListener("resize", (e) => {
            this.fitCanvasInParent();
        });
        this.fitCanvasInParent();

        this.elemCanvas.addEventListener("wheel", (e) => {
            if (this.#allowHorizontalZoom || this.#allowVerticalZoom){
                e.preventDefault();
                const sign = e.deltaY < 0 ? 1 : -1;
                this.zoomScreenPosition(sign * .05, [e.x, e.y]);
            }
        });

        this.elemCanvas.addEventListener("mousedown", (e) => {
            if ((this.allowHorizontalDragging || this.allowVerticalDragging) && e.buttons === 1 || e.buttons === 4){
                this.#dragging = true;

                this.#dragX = e.clientX;
                this.#dragY = e.clientY;
                this.#mouseX = this.#dragX;
                this.#mouseY = this.#dragY;

                this.#updateDragging();
            }
        });
        document.addEventListener("mousemove", (e) => {
            this.#mouseX = e.clientX;
            this.#mouseY = e.clientY;
        });
        document.addEventListener("mouseup", () => {
            this.#dragging = false;
        });

        this.elemBtnResetFraming.addEventListener("click", () => {
            this.animateResetCamera();
        });
    }

    readDataset(){
        const data = this.element.dataset;

        if (data.horizontalIncrement != undefined)
            this.horizontalIncrement = Number(data.horizontalIncrement);
        if (data.verticalIncrement != undefined)
            this.verticalIncrement = Number(data.verticalIncrement);
        if (data.minimumHorizontalBoundsSize != undefined)
            this.incremenminimumBoundsSize[0] = Number(data.minimumHorizontalBoundsSize);
        if (data.minimumVerticalBoundsSize != undefined)
            this.incremenminimumBoundsSize[1] = Number(data.minimumVerticalBoundsSize);
        if (data.usePixelPerfectCss != undefined)
            this.usePixelPerfectCss = Boolean(data.usePixelPerfectCss);
        if (data.allowHorizontalDragging != undefined)
            this.allowHorizontalDragging = Boolean(data.allowHorizontalDragging);
        if (data.allowVerticalDragging != undefined)
            this.allowVerticalDragging = Boolean(data.allowVerticalDragging);
        if (data.allowAutoHorizontalIncrement != undefined)
            this.allowAutoHorizontalIncrement = Boolean(data.allowAutoHorizontalIncrement);
        if (data.allowAutoVerticalIncrement != undefined)
            this.allowAutoVerticalIncrement = Boolean(data.allowAutoVerticalIncrement);
        if (data.staticHorizontalIncrement != undefined)
            this.staticHorizontalIncrement = Boolean(data.staticHorizontalIncrement);
        if (data.staticVerticalIncrement != undefined)
            this.staticVerticalIncrement = Boolean(data.staticVerticalIncrement);
        if (data.autoHorizontalIncrementCount != undefined)
            this.autoHorizontalIncrementCount = Number(data.autoHorizontalIncrementCount);
        if (data.autoVerticalIncrementCount != undefined)
            this.autoVerticalIncrementCount = Number(data.autoVerticalIncrementCount);
        if (data.incrementLabelsPrecision != undefined)
            this.incrementLabelsPrecision = Number(data.incrementLabelsPrecision);
        if (data.allowVerticalZoom != undefined)
            this.allowVerticalZoom = Boolean(data.allowVerticalZoom);
        if (data.allowHorizontalZoom != undefined)
            this.allowHorizontalZoom = Boolean(data.allowHorizontalZoom);

        if (data.horizontalAxisText != undefined)
            this.setHorizontalAxisText(data.horizontalAxisText);
        if (data.verticalAxisText != undefined)
            this.setVerticalAxisText(data.verticalAxisText);
        if (data.smoothCamera != undefined)
            this.insertSmoothCamera(Number(data.smoothCamera));
    }
    
    set allowHorizontalZoom(allow){
        this.#allowHorizontalZoom = allow;
        this.#allowedZoomChanged();
    }
    get allowHorizontalZoom(){
        return this.#allowHorizontalZoom;
    }
    set allowVerticalZoom(allow){
        this.#allowVerticalZoom = allow;
        this.#allowedZoomChanged();
    }
    get allowVerticalZoom(){
        return this.#allowVerticalZoom;
    }
    
    #allowedZoomChanged(){
        this.elemCanvas.dataset.cssGrab = this.#allowHorizontalZoom || this.#allowVerticalZoom;
    }

    #updateDragging(){
        if (this.#dragging){
            let dx = 0;
            let dy = 0;
            if (this.allowHorizontalDragging)
                dx = -(this.#mouseX - this.#dragX) / this.elemCanvas.width / this.camera.zoomX;
            if (this.allowVerticalDragging)
                dy = (this.#mouseY - this.#dragY) / this.elemCanvas.height / this.camera.zoomY;

            this.camera.addPosition(dx, dy);

            this.#dragX = this.#mouseX;
            this.#dragY = this.#mouseY;
            this.#cameraChanged();

            requestAnimationFrame(() => this.#updateDragging(this));
        }
    }

    /**
     * Inserts a CameraTransformSmoothProxy to smooth-out any movement: This uses slightly more performance. (doesn't redraw when not moving)
     * @param {*} speed 
     */
    insertSmoothCamera(speed = 10){
        this.smoothCameraOldX = this.camera.x;
        this.smoothCameraOldY = this.camera.y;
        this.smoothCameraOldZoomX = this.camera.zoomX;
        this.smoothCameraOldZoomY = this.camera.zoomY;

        this.camera = new CameraTransformSmoothProxy(this.camera, speed, () => {
            // Redraw only if changes were detected

            if (this.smoothCameraOldX !== this.camera.x
             || this.smoothCameraOldY !== this.camera.y
             || this.smoothCameraOldZoomX !== this.camera.zoomX
             || this.smoothCameraOldZoomY !== this.camera.zoomY
            ){
                this.smoothCameraOldX = this.camera.x;
                this.smoothCameraOldY = this.camera.y;
                this.smoothCameraOldZoomX = this.camera.zoomX;
                this.smoothCameraOldZoomY = this.camera.zoomY;

                this.#cameraChanged();
            }
        });
    }

    /**
     * Removes a CameraTransformSmoothProxy if previously inserted
     * @param {*} speed 
     */
    removeSmoothCamera(){
        if (this.camera instanceof CameraTransformSmoothProxy){
            this.camera = this.camera.camera;
        }
    }

    // Positive for zoom in, negative for zoom out.
    zoomScreenPosition(factor, screenPos){
        const bounds = this.elemCanvas.getBoundingClientRect();
        const canvasPos = [screenPos[0] - bounds.x, screenPos[1] - bounds.y];
        const localPos = this.#canvasBounds.transformPointInverse(canvasPos);

        const offsetX = (localPos[0] * 2 - 1) / this.camera.zoomX * .5 * factor;
        const offsetY = (localPos[1] * 2 - 1) / this.camera.zoomY * .5 * factor;
        
        if (this.#allowHorizontalZoom){
            //this.camera.zoomX *= 1+factor;
            this.camera.zoom(1+factor, 1);
            //this.camera.x += offsetX;
            this.camera.addPosition(offsetX, 0);
        }
        if (this.#allowVerticalZoom){
            //this.camera.zoomY *= 1+factor;
            this.camera.zoom(1, 1+factor);
            //this.camera.y += offsetY;
            this.camera.addPosition(0, offsetY);
        }

        this.#cameraChanged();
    }

    usePreset_FixedChart(){
        this.staticHorizontalIncrement = true;
        this.staticVerticalIncrement = true;
        this.allowHorizontalDragging = false;
        this.allowVerticalDragging = false;
        this.allowHorizontalZoom = false;
        this.allowVerticalZoom = false;
    }

    #cameraChanged(){
        this.#refreshAutoIncrements();
        this.draw(true);

        this.elemBtnResetFraming.dataset.enabled = this.isCameraDefault() ? 0 : 1;
    }

    isCameraDefault(){
        return this.camera.x === 0 && this.camera.y === 0 && this.camera.zoomX === 1 && this.camera.zoomY === 1;
    }

    resetCamera(){
        this.camera.x = 0;
        this.camera.y = 0;
        this.camera.zoomX = 1;
        this.camera.zoomY = 1;
        this.#cameraChanged();
    }

    animateResetCamera(duration = 300, easing_function = easeInOutQuad){
        this.animateCameraTo(0,0,1,1, duration, easing_function);
    }

    animateCameraTo(x, y, zoomX, zoomY, duration = 500, easing_function = easeInOutQuad){
        const startX = this.camera.x;
        const startY = this.camera.y;
        const startZoomX = this.camera.zoomX;
        const startZoomY = this.camera.zoomY;

        startAnimation(duration, (t) => {
            this.camera.x = lerp(startX, x, t);
            this.camera.y = lerp(startY, y, t);
            this.camera.zoomX = lerp(startZoomX, zoomX, t);
            this.camera.zoomY = lerp(startZoomY, zoomY, t);
            this.#cameraChanged();
        }, () => {
            this.camera.x = x;
            this.camera.y = y;
            this.camera.zoomX = zoomX;
            this.camera.zoomY = zoomY;
            this.#cameraChanged();
        }, easing_function);
    }

    canvasSizeChanged(){
        this.#canvasBounds.minX = 0;
        this.#canvasBounds.minY = this.elemCanvas.height;
        this.#canvasBounds.maxX = this.elemCanvas.width;
        this.#canvasBounds.maxY = 0;

        this.#refreshIncrementsVisuals();

        this.draw(false);
    }

    clear(){
        this.children = [];
        this.#clearCanvas();
    }

    #clearCanvas(){
        this.ctx.clearRect(0, 0, this.elemCanvas.width, this.elemCanvas.height);
    }

    fitCanvasInParent(){
        const canvasBounds = this.elemCanvas.parentNode.getBoundingClientRect();
        this.elemCanvas.width = canvasBounds.width;
        this.elemCanvas.height = canvasBounds.height;
        this.canvasSizeChanged();
    }


    /**
     * Add a new graphic element to the widget
     * @param {LineSeries} child
     */
    push(child, draw = true){
        this.children.push(child);
        this.#refreshBounds();
        
        if (draw)
            this.draw();
    }

    #refreshAutoIncrements(){
        if (this.allowAutoHorizontalIncrement){
            let snappedZoomX = Math.pow(2, Math.round(Math.log2(this.camera.zoomX)));
            this.#incrementX = this.#valueBounds.width() / this.autoHorizontalIncrementCount / snappedZoomX;
        }
        if (this.allowAutoVerticalIncrement){
            let snappedZoomY = Math.pow(2, Math.round(Math.log2(this.camera.zoomY)));
            this.#incrementY = this.#valueBounds.height() / this.autoVerticalIncrementCount / snappedZoomY;
        }
        this.#refreshIncrementsVisuals();
    }

    setAutoHorizontalIncrement(){
        this.allowAutoHorizontalIncrement = true;
        this.#refreshAutoIncrements();
    }
    setAutoVerticalIncrement(){
        this.allowAutoVerticalIncrement = true;
        this.#refreshAutoIncrements();
    }

    /**
     * Sets the increment displayed on the horizontal axis
     * @param {number} increment increment in value space
     */
    setHorizontalIncrement(increment){
        this.#incrementX = increment;
        this.allowAutoHorizontalIncrement = false;
        this.#refreshIncrementsVisuals();
    }

    /**
     * Sets the increment displayed on the vertical axis
     * @param {number} increment increment in value space
     */
    setVerticalIncrement(increment){
        this.#incrementY = increment;
        this.allowAutoVerticalIncrement = false;
        this.#refreshIncrementsVisuals();
    }

    #refreshIncrementsVisuals(){
        if (this.elemGrid == undefined)
            return;

        // Grid
        let local = this.#valueBounds.transformVectorInverse([this.#incrementX, this.#incrementY]);
        let pxIncrement = this.camera.transformVector(this.#canvasBounds.transformVector(local));

        let offsetX = 0;
        if (!this.staticHorizontalIncrement)
            offsetX = this.elemCanvas.width  * ((1-this.camera.zoomX) / 2 - this.camera.x * this.camera.zoomX);

        let offsetY = 0;
        if (!this.staticVerticalIncrement)
            offsetY = this.elemCanvas.height * ((1-this.camera.zoomY) / 2 - this.camera.y * this.camera.zoomY);

        if (this.usePixelPerfectCss){
            this.elemGrid.style.backgroundSize = `round(${Math.abs(pxIncrement[0])}px, 1px) round(${Math.abs(pxIncrement[1])}px, 1px)`;
            this.elemGrid.style.backgroundPosition = `round(${offsetX % Math.abs(pxIncrement[0])}px, 1px) round(calc(100% - ${offsetY % Math.abs(pxIncrement[1])}px), 1px)`;
        } else {
            this.elemGrid.style.backgroundSize = `${Math.abs(pxIncrement[0])}px ${Math.abs(pxIncrement[1])}px`;
            this.elemGrid.style.backgroundPosition = `${offsetX % Math.abs(pxIncrement[0])}px calc(100% - ${offsetY % Math.abs(pxIncrement[1])}px)`;
        }

        // Axis increments labels
        if (this.transformationCanvasSpaceToValue)
        {
            let startOffsetX = 0;
            if (!this.staticHorizontalIncrement)
                startOffsetX = posmod(offsetX, Math.abs(pxIncrement[0]));

            let startOffsetY = 0;
            //let startOffsetYBottom = 0;
            if (!this.staticVerticalIncrement){
                startOffsetY = posmod(offsetY, Math.abs(pxIncrement[1]));
                //startOffsetYBottom = posmod((this.elemCanvas.height+1) - offsetY, Math.abs(pxIncrement[1])); //+1 for floating point errors
            }

            let startPoint = this.transformationCanvasSpaceToValue([startOffsetX, startOffsetY]);

            const xIncrements = Math.ceil((this.elemCanvas.width+1-Math.abs(startOffsetX)) / Math.abs(pxIncrement[0])); //+1 for floating point errors

            let htmlX = "";
            for (let i = 0; i < xIncrements; i++){
                htmlX += "<div><div>"+precisionRounding(startPoint[0] + i * this.#incrementX, this.incrementLabelsPrecision)+"</div></div>";
            }
            this.elemAxisXIncrements.innerHTML = htmlX;
            this.elemAxisXIncrements.style.gap = Math.abs(pxIncrement[0])+"px";
            this.elemAxisXIncrements.style.transform = "translateX("+startOffsetX+"px)";

            const yIncrements = Math.ceil((this.elemCanvas.height+1-Math.abs(startOffsetY)) / Math.abs(pxIncrement[1])); //+1 for floating point errors
            let htmlY = "";
            for (let i = 0; i < yIncrements; i++){
                htmlY += "<div><div>"+precisionRounding(startPoint[1] + i * this.#incrementY, this.incrementLabelsPrecision)+"</div></div>";
            }
            this.elemAxisYIncrements.innerHTML = htmlY;
            this.elemAxisYIncrements.style.gap = Math.abs(pxIncrement[1])+"px";
            this.elemAxisYIncrements.style.transform = "translateY("+-startOffsetY+"px)";
        }
    }

    

    /**
     * Draws all children to the canvas
     */
    draw(clear = true){
        if (clear){
            this.#clearCanvas();
        }
        if (this.children.length < 1)
            return;
        if (this.#animationTime >= 0){
            this.drawAnimationFrame(this.#animationTime);
            return;
        }

        this.children.forEach(lineSeries => {
            lineSeries.draw(this.ctx, this.transformationValueToCanvasSpace);
        });
    }

    animationStep(token, tick, startTick, duration, easing_function){
        if (token !== this.#animationToken)
            return;
        
        let time = (tick - startTick) / duration;
        if (easing_function != undefined)
            time = easing_function(time);
        this.#animationTime = time;

        
        if (time < 1){
            this.drawAnimationFrame(time);
            requestAnimationFrame((tick) => this.animationStep(token, tick, startTick, duration, easing_function));
        } else {
            this.#animationTime = -1;
            this.draw();
        }
    }

    drawAnimationFrame(time){
        this.#clearCanvas();
        
        this.children.forEach(lineSeries => {
            lineSeries.drawAnimationFrame(this.ctx, this.transformationValueToCanvasSpace, time);
        });
    }


    /**
     * Starts drawing all children to the canvas with a animation.
     * @param {number} duration duration of the animation in milliseconds
     */
    drawAnimation(duration = 2000, easing_function = easeInOutCubic){
        this.#animationToken++;

        this.animationStep(this.#animationToken, performance.now(), performance.now(), duration, easing_function);
    }

    #refreshBounds(){
        const bounds = this.getPointBounds();
        this.setValueBounds(...bounds);
    }

    setValueBounds(minX, minY, maxX, maxY){
        this.#valueBounds.minX = minX;
        this.#valueBounds.minY = minY;
        this.#valueBounds.maxX = maxX;
        this.#valueBounds.maxY = maxY;

        this.transformationValueToCanvasSpace = (point) => {
            let local = this.#valueBounds.transformPointInverse(point);

            local = [local[0] - .5, local[1] - .5];
            local = this.camera.transformPoint(local);
            local = [local[0] + .5, local[1] + .5];

            let canvasSpace = this.#canvasBounds.transformPoint(local);
            return canvasSpace;
        };

        this.transformationCanvasSpaceToValue = (point) => {
            
            let local = [point[0]/this.elemCanvas.width, point[1]/this.elemCanvas.height];

            local = [local[0] - .5, local[1] - .5];
            local = this.camera.transformPointInverse(local);
            local = [local[0]+.5, local[1]+.5];

            return this.#valueBounds.transformPoint(local);
        };

        this.#refreshAutoIncrements();
    }

    /**
     * Gets minimum and maximum coordinates of all children points
     * @return {[minX: number, minY: number, maxX: number, maxY: number]} bounds
     */
    getPointBounds(){
        if (this.children.length < 1)
            return;

        let bounds0 = this.children[0].getPointBounds();
        let minX = bounds0[0];
        let minY = bounds0[1];
        let maxX = bounds0[2];
        let maxY = bounds0[3];
        for (let i = 1; i < this.children.length; i++){
            let boundsI = this.children[i].getPointBounds();
            if (boundsI[0] < minX)
                minX = boundsI[0];
            if (boundsI[1] < minY)
                minY = boundsI[1];
            if (boundsI[2] > maxX)
                maxX = boundsI[2];
            if (boundsI[3] > maxY)
                maxY = boundsI[3];
        }

        if (this.minimumBoundsSize != undefined){
            // Ensure minimum bounding box size
            if (maxX - minX < this.minimumBoundsSize[0]){
                const delta = (this.minimumBoundsSize[0] - (maxX - minX)) / 2;
                minX -= delta;
                maxX += delta;
            }
            if (maxY - minY < this.minimumBoundsSize[1]){
                const delta = (this.minimumBoundsSize[1] - (maxY - minY)) / 2;
                minY -= delta;
                maxY += delta;
            }
        }

        return [minX, minY, maxX, maxY];
    }

    setHorizontalAxisText(text){
        this.elemLabelX.innerText = text;
    }

    setVerticalAxisText(text){
        this.elemLabelY.innerText = text;
    }
}

class AbstractPointSeries
{
    points = [];

    /**
     * @param {Array<(x: int, y: int)>} points An array of points (x,y)
     */
    constructor (points){
        this.points = points;
    }
    
    /**
     * Gets minimum and maximum coordinates
     * @return {[minX: number, minY: number, maxX: number, maxY: number]} bounds
     */
    getPointBounds(){
        if (this.points.length < 1)
            return;

        let minX = this.points[0][0];
        let minY = this.points[0][1];
        let maxX = this.points[0][0];
        let maxY = this.points[0][1];
        for (let i = 1; i < this.points.length; i++){
            if (this.points[i][0] < minX)
                minX = this.points[i][0];
            if (this.points[i][1] < minY)
                minY = this.points[i][1];
            if (this.points[i][0] > maxX)
                maxX = this.points[i][0];
            if (this.points[i][1] > maxY)
                maxY = this.points[i][1];
        }

        return [minX, minY, maxX, maxY];
    }

    smoothen(divisions = 2){
        const tangentStrength = .5;

        let np = [];
        for (let i = 1; i < this.points.length; i++){
            const pointA = this.points[i-1];
            const pointB = this.points[i];

            const tanA = this.getPointCornerFuzzyTangent(i-1);
            const tanB = this.getPointCornerFuzzyTangent(i);
            
            //const mag = Math.sqrt((pointA[0] - pointB[0]) * (pointA[0] - pointB[0]) + (pointA[1] - pointB[1]) * (pointA[1] - pointB[1]));
            const tanDist = tangentStrength;
            
            const pointTA = [
                pointA[0] + tanDist,
                pointA[1] + tanDist * tanA,
            ];
            const pointTB = [
                pointB[0] - tanDist,
                pointB[1] - tanDist * tanB,
            ];


            for (let t = 0; t < 1; t += 1 / divisions){
                np.push(bezierCubicPoint(t, pointA, pointTA, pointTB, pointB))
            }
        }
        np.push(this.points[this.points.length-1]);

        this.points = np;
    }

    getTangentsDisplay(){
        let series = [];
        let dist = .2;
        for (let i = 0; i < this.points.length; i++){
            series.push(new LineSeries([
                this.points[i],
                [
                    this.points[i][0] + dist,
                    this.points[i][1] + this.getPointCornerFuzzyTangent(i) * dist,
                ]
            ]));
        }
        return series;
    }

    getPointCornerFuzzyTangent(index){
        if (this.points.length < 2)
            return;
        if (index === 0){
            return this.getEdgeTangent(0, 1);
        }
        if (index === this.points.length-1){
            return this.getEdgeTangent(index - 1, index);
        }

        let ta = this.getEdgeTangent(index - 1, index);
        let tb = this.getEdgeTangent(index, index + 1);
        
        return (ta + tb) / 2;
    }

    /**
     * @param {int} indexA first point index
     * @param {int} indexB second point index
     * @returns tangent of the edge between indexA and indexB
     */
    getEdgeTangent(indexA, indexB){
        return (this.points[indexB][1] - this.points[indexA][1]) / (this.points[indexB][0] - this.points[indexA][0]);
    }

    /**
     * Create a AbstractPointSeries with random values
     * @param {int} x_max number of points
     * @param {int} y_max amplitude of points
     * @param {string} color color of the lines
     */
    static fromRandom(x_max = 10, y_max = 5){
        let arr = [];
        for (let x = 0; x <= x_max; x++){
            arr.push([x, Math.random()]);
        }
        
        let series = new AbstractPointSeries(arr);
        series.normalizePoints();
        series.multiplyPoints(x_max, y_max);
        return series;
    }

    /**
     * Create a AbstractPointSeries with random values
     * @param {int} x_max number of points
     * @param {int} y_max amplitude of points
     * @param {string} color color of the lines
     */
    static fromRandomSlope(x_max = 10, y_max = 5, slope_strength = .5){
        let arr = [];
        for (let x = 0; x <= x_max; x++){
            arr.push([x/x_max, Math.random() + x / x_max * slope_strength]);
        }
        
        let series = new AbstractPointSeries(arr);
        series.normalizePoints();
        series.multiplyPoints(x_max, y_max);
        return series;
    }
    
    normalizePoints(){
        if (this.points.length < 2)
            return;
        
        let min_x = this.points[0][0];
        let min_y = this.points[0][1];
        let max_x = this.points[0][0];
        let max_y = this.points[0][1];
        for (let i = 1; i < this.points.length; i++){
            if (this.points[i][0] < min_x)
                min_x = this.points[i][0];
            if (this.points[i][1] < min_y)
                min_y = this.points[i][1];
            if (this.points[i][0] > max_x)
                max_x = this.points[i][0];
            if (this.points[i][1] > max_y)
                max_y = this.points[i][1];
        }
        for (let i = 0; i < this.points.length; i++){
            this.points[i][0] = (this.points[i][0] - min_x) / (max_x - min_x);
            this.points[i][1] = (this.points[i][1] - min_y) / (max_y - min_y);
        }
    }

    multiplyPoints(x = 1, y = 1){
        for (let i = 0; i < this.points.length; i++){
            this.points[i][0] *= x;
            this.points[i][1] *= y;
        }
    }
}

function getCssColorValue(cssColor){
    // Is CSS variable?
    if (cssColor.startsWith("--")){
        let cssRes = window.getComputedStyle(document.body).getPropertyValue(cssColor);
        if (cssRes != undefined && cssRes != ""){
            return cssRes;
        }
    }

    return cssColor;
}

class LineSeries extends AbstractPointSeries
{
    drawPoints = false;
    pointsRadius = 4;

    cssColor = "#FF0000";
    lineWidth = 1;

    // Declarations
    points;
    #computedColor;

    /**
     * @param {Array<(x: int, y: int)>} points An array of points (x,y)
     * @param {string} color Color of the lines
     * @param {int} lineWidth Width of the lines
     */
    constructor (points, cssColor = "#FF0000", lineWidth = 1){
        super(points);

        this.points = points;
        this.cssColor = cssColor;
        this.lineWidth = lineWidth;

        cywidgetsCssVariablesDependantObjects.push(this);

        this.cssVariablesChanged();
    }

    cssVariablesChanged(){
        this.#computedColor = getCssColorValue(this.cssColor);
    }

    /** Draws lines on a canvas from the given point
     * @param {Element} canvas Canvas
     * @param {function(int x, int y)} transformation transformation from value space to canvas space
     */
    draw(ctx, transformation){
        if (this.points.length < 2)
            return;

        this.applyContext(ctx);
        ctx.beginPath();

        const [point0X, point0Y] = transformation(this.points[0]);
        ctx.moveTo(point0X, point0Y);

        for (let i = 1; i < this.points.length; i++){
            const [pointX, pointY] = transformation(this.points[i]);
            ctx.lineTo(pointX, pointY);
        }

        ctx.stroke();

        // Points
        if (this.drawPoints){
            for (let i = 0; i < this.points.length; i++){
                const [pointX, pointY] = transformation(this.points[i]);
                this.drawPointAtPosition(this, ctx, pointX, pointY, i);
            }
        }
    }

    /**
     * Applies rendering settings to a context (e.g. colors)
     * @param {CanvasRenderingContext2D} ctx 
     */
    applyContext(ctx){
        ctx.strokeStyle = this.#computedColor;
        ctx.fillStyle = this.#computedColor;
        ctx.lineWidth = this.lineWidth;

        this.customApplyContext(ctx);
    }

    /**
     * Applies custom rendering settings to a context, empty by default
     * @param {CanvasRenderingContext2D} ctx 
     */
    customApplyContext(ctx){
        // Overwrite this function for funky graphics
    }

    /**
     * Draws a point at a given position. Override for custom rendering
     * @param {*} x x position of point
     * @param {*} y y position of point
     */
    drawPointAtPosition(series, ctx, x, y, pointIndex)
    {
        ctx.beginPath();
        ctx.arc(x, y, this.pointsRadius, 0, 2 * Math.PI);
        ctx.fill();
    }

    drawAnimationFrame(ctx, transformation, time){
        if (this.points.length < 2)
            return;

        time *= 1 - 1 / this.points.length;

        this.applyContext(ctx);
        ctx.beginPath();

        const [point0X, point0Y] = transformation(this.points[0]);
        ctx.moveTo(point0X, point0Y);

        let i = 0;
        let pointX;
        let pointY;
        for (i = 0; i < this.points.length * time; i++){
            [pointX, pointY] = transformation(this.points[i]);
            ctx.lineTo(pointX, pointY);
        }

        if (i < this.points.length){
            const segmentDuration = 1/this.points.length;
            const lastSegmentTime = (time % segmentDuration) / segmentDuration;
            const [pointTargetX, pointTargetY] = transformation(this.points[i]);

            const lastX = lerp(pointX, pointTargetX, lastSegmentTime);
            const lastY = lerp(pointY, pointTargetY, lastSegmentTime);

            ctx.lineTo(lastX, lastY);
        }

        ctx.stroke();

        // Points
        if (this.drawPoints){
            for (let i = 0; i < this.points.length * time; i++){
                const [pointX, pointY] = transformation(this.points[i]);
                this.drawPointAtPosition(this, ctx, pointX, pointY, i);
            }
        }
    }

    /**
     * Create a LineSeries with random values
     * @param {int} x_max number of points
     * @param {int} y_max amplitude of points
     * @param {string} color color of the lines
     */
    static fromRandom(x_max = 10, y_max = 5, color = "orange"){
        return new LineSeries(
            AbstractPointSeries.fromRandom(x_max, y_max).points,
            color
        );
    }

    /**
     * Create a LineSeries with random values
     * @param {int} x_max number of points
     * @param {int} y_max amplitude of points
     * @param {string} color color of the lines
     */
    static fromRandomSlope(x_max = 10, y_max = 5, slope_strength = 1, color = "orange"){
        return new LineSeries(
            AbstractPointSeries.fromRandomSlope(x_max, y_max, slope_strength).points,
            color
        );
    }
}



class PieSection
{
    cssOutlineColor = "--secondary";
    children = [];

    hoveredAnim = 0;
    #radiusFactor = 1;

    _radiusFactorAnim = 1;
    #computedBgColor;
    #computedTextColor;

    constructor(value, name = "", cssBgColor = "", cssTextColor = "currentColor"){
        this.value = value;
        this.name = name;
        this.cssBgColor = cssBgColor;
        this.cssTextColor = cssTextColor;

        this.cssVariablesChanged();
        cywidgetsCssVariablesDependantObjects.push(this);
    }

    cssVariablesChanged(){
        this.#computedBgColor = getCssColorValue(this.cssBgColor);
        this.#computedTextColor = getCssColorValue(this.cssTextColor);
    }

    push(child){
        this.children.push(child);
    }

    applyTextStyle(ctx){
        ctx.fillStyle = this.#computedTextColor;
    }

    applyBgStyle(ctx){
        ctx.fillStyle = this.#computedBgColor;
    }

    set radiusFactor(value){
        this.#radiusFactor = value;
        this._radiusFactorAnim = value;
    }
    get radiusFactor(){
        return this.#radiusFactor;
    }
}



class PieChart
{
    angleStartDeg = 0;
    angleEndDeg = 360;
    angleOffset = -90;
    holeRatio = 0; // 0 for no hole, 1 for hollow
    cssOutlineColor = "--secondary";
    lineWidth = 0;
    writePercentages = false;
    hoverSpeed = 10;
    sorted = true;
    useStiching = true; // Slightly grow section to avoid seams between them
    
    // Disable for better performance
    #animated = true;
    detectHover = true;
    hoverRadiusEffectEnabled = true;
    hoverAlphaEffectEnabled = true;

    font = "18px sans-serif";
    textLineHeight = 20;
    
    paletteStartRGB = [115, 220, 255];
    paletteEndRGB   = [190, 110, 240];

    // Declarations
    children = [];
    #computedOutlineColor;
    #animationTime = -1;

    #mouseX = 0;
    #mouseY = 0;
    #delta = 0;
    #canHover = true;
    #selectedSection = null;
    #selectedDepth = null;

    constructor(element, animated = true){
        this.element = element;
        this.#animated = animated;

        this.elemCanvas = element.getElementsByClassName("cywidgetPieChartCanvas")[0];
        this.ctx = this.elemCanvas.getContext("2d");
        cywidgetsDrawableSaved.push(this);

        // Fit canvas
        window.addEventListener("resize", (e) => {
            this.fitCanvasInParent();
        });
        this.fitCanvasInParent();

        // CSS
        this.cssVariablesChanged();
        cywidgetsCssVariablesDependantObjects.push(this);

        this.mousemoveEvent = (e) => {
            this.#mouseX = e.clientX;
            this.#mouseY = e.clientY;

            if (!this.#animated)
                this.draw();
        }
        if (this.detectHover)
            document.addEventListener("mousemove", this.mousemoveEvent);

        this.callAnimateNext = (tick) => this.#animateCycle(tick);
        this.tick = 0;
        if (this.#animated)
            requestAnimationFrame(this.callAnimateNext);
    }
    
    presetStatic(){
        this.detectHover = false;
        this.hoverRadiusEffectEnabled = false;
        this.hoverAlphaEffectEnabled = false;
        this.#animated = false;
    }

    set animated(value){
        if (this.#animated == value)
            return;

        this.#animated = value;

        if (value){
            requestAnimationFrame(this.callAnimateNext);
        }
    }

    /**
     * @param {boolean} value
     */
    set canHover(value){
        if (this.#canHover == value)
            return;

        if (this.#canHover){
            element.removeEventListener("mousedown", this.mousemoveEvent);
        } else {
            document.addEventListener("mousemove", this.mousemoveEvent);
        }

        this.#canHover = value;
    }
    /**
     * @returns {boolean} value
     */
    get canHover(){
        return this.#canHover;
    }

    getPaletteColor(index, maxIndex){
        return "rgb("
                +lerp(this.paletteStartRGB[0], this.paletteEndRGB[0], index/maxIndex) + ","
                +lerp(this.paletteStartRGB[1], this.paletteEndRGB[1], index/maxIndex) + ","
                +lerp(this.paletteStartRGB[2], this.paletteEndRGB[2], index/maxIndex)
                +")"
    }

    #animateCycle(tick) {
        this.#delta = (tick - this.tick) / 1000;
        this.tick = tick;

        this.draw();

        if (this.#animated)
            requestAnimationFrame(this.callAnimateNext);
    }

    cssVariablesChanged(){
        this.#computedOutlineColor = getCssColorValue(this.cssOutlineColor);
    }

    canvasSizeChanged(){
        this.draw(false);
    }

    clear(){
        this.#clearCanvas();
        this.children = [];
    }

    #clearCanvas(){
        this.ctx.clearRect(0, 0, this.elemCanvas.width, this.elemCanvas.height);
    }

    fitCanvasInParent(){
        const canvasBounds = this.elemCanvas.parentNode.getBoundingClientRect();
        this.elemCanvas.width = canvasBounds.width;
        this.elemCanvas.height = canvasBounds.height;
        this.canvasSizeChanged();
    }

    #insertSorted(section){
        if (this.children.length == 0){
            this.children.push(section);
            return;
        }

        // Binary insertion
        let low = 0;
        let high = this.children.length;
        while (low < high){
            const midi = (low + high) >>> 1;
            if (this.sortPredicate(section, this.children[midi])){
                high = midi;
            } else {
                low = midi+1;
            }
        }

        this.children.splice(low, 0, section);
    }

    sortPredicate(a, b){
        return a.value > b.value;
    }

    /**
     * Adds a section to the piechart
     * @param {PieSection} child section to add
     * @param {boolean} draw redraw canvas
     */
    push(child, draw = true){
        if (this.sorted){
            this.#insertSorted(child);
        } else {
            this.children.push(child);
        }

        if (draw)
            this.draw();


    }

    getDepth(section = undefined){
        if (section == undefined)
            section = this;

        if (section.children.length > 0){
            let max = 0;
            section.children.forEach((section) => {
                const depth = this.getDepth(section);
                if (depth > max)
                    max = depth;
            });
            return 1 + max;
        } else {
            return 0;
        }
    }

    applyOutlineStyle(ctx){
        ctx.strokeStyle = this.#computedOutlineColor;
        ctx.lineWidth = this.lineWidth;
    }
    applyTextStyle(ctx){
        ctx.font = this.font;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
    }

    foreachSections(f, parent = this){
        for (let i = 0; i < parent.children.length; i++){
            f(parent.children[i]);
            this.foreachSections(f, parent.children[i]);
        }
    }

    draw(clear = true){
        if (clear)
            this.#clearCanvas();

        if (this.children.length < 1)
            return;
        if (this.#animationTime >= 0){
            this.drawAnimationFrame(this.#animationTime);
            return;
        }

        const centerX = this.elemCanvas.width / 2;
        const centerY = this.elemCanvas.height / 2;
        const radiusMax = (centerX < centerY ? centerX : centerY) * .9;
        const radiusMin = this.holeRatio * radiusMax;
        const angleMin = deg2rad(this.angleStartDeg + this.angleOffset);
        const angleMax = deg2rad(this.angleEndDeg + this.angleOffset);

        this.canvasRect = this.elemCanvas.getBoundingClientRect();

        let radiusSumMax = this.getDescedantMaxRadiusSum();

        if (this.detectHover){
            // Get hovered section
            const [selectedSection, selectedDepth] = this.getHoveredSection(this.children, centerX, centerY, angleMin, angleMax, radiusMin, radiusMax, 0, radiusSumMax, 0);
            this.#selectedSection = selectedSection;
            this.#selectedDepth = selectedDepth;

            // Radius hover effect
            if (this.hoverRadiusEffectEnabled){
                const radiusHoverAddFactor = .1;
                const radiusHoverAdd = radiusSumMax * radiusHoverAddFactor;
                radiusSumMax *= 1 + radiusHoverAddFactor;

                let deltaRadiusFactor = 1;
                if (this.#animated)
                    deltaRadiusFactor = clamp01(this.#delta * this.hoverSpeed * .5);

                this.foreachSections((section) => {
                    section._radiusFactorAnim = lerp(section._radiusFactorAnim, selectedSection == section ? section.radiusFactor + radiusHoverAdd : section.radiusFactor, deltaRadiusFactor);
                });
            }

            // Update lerped hover variables
            let deltaHovered = 1;
            if (this.#animated){
                deltaHovered = clamp01(this.#delta * this.hoverSpeed);;
            }
            this.foreachSections((section) => {
                const alpha = selectedSection == null || selectedSection == section ? 1 : 0;
                section.hoveredAnim = lerp(section.hoveredAnim, alpha, deltaHovered);
            });
        }
        
        this.renderRingLayer(this.children, centerX, centerY, angleMin, angleMax, radiusMin, radiusMax, 0, radiusSumMax, 0);
    }

    getDescedantMaxRadiusSum(parent = this){
        let max = 0;
        for (let i = 0; i < parent.children.length; i++){
            const section = parent.children[i];

            let sum = section.radiusFactor + this.getDescedantMaxRadiusSum(section);
            if (sum > max)
                max = sum;
        }
        return max;
    }

    getHoveredSection(children, centerX, centerY, angleMin, angleMax, radiusMin, radiusMax, radiusSum, radiusSumMax, depth)
    {
        const radiusRingStart = lerp(radiusMin, radiusMax, radiusSum / radiusSumMax);

        let totalValue = 0;
        for (let i = 0; i < children.length; i++){
            totalValue += children[i].value;
        }

        let sumValue = 0;
        for (let i = 0; i < children.length; i++){
            const section = children[i];
            const radiusSectionEnd = lerp(radiusMin, radiusMax, (radiusSum + section._radiusFactorAnim) / radiusSumMax);

            const angleSectionStart = lerp(angleMin, angleMax, sumValue / totalValue);
            const angleSectionEnd = lerp(angleMin, angleMax, (sumValue + section.value) / totalValue);

            let path = new Path2D();
            path.arc(centerX, centerY, radiusSectionEnd, angleSectionStart, angleSectionEnd);
            if (this.radiusRingStart <= 0){
                path.lineTo(centerX, centerY);
            } else {
                path.arc(centerX, centerY, radiusRingStart, angleSectionEnd, angleSectionStart, true);
                path.lineTo(centerX + Math.cos(angleSectionStart) * radiusSectionEnd, centerY + Math.sin(angleSectionStart) * radiusSectionEnd);
            
            }

            const hovered = this.ctx.isPointInPath(path, this.#mouseX - this.canvasRect.left, this.#mouseY - this.canvasRect.top);
            if (hovered){
                return [section, depth];
            }

            // Children
            if (section.children.length > 0){
                const sectionRes = this.getHoveredSection(
                    section.children, centerX, centerY, angleSectionStart, angleSectionEnd, radiusMin, radiusMax, radiusSum + section._radiusFactorAnim, radiusSumMax, depth + 1
                );
                if (sectionRes[0] != null){
                    return sectionRes;
                }
            }

            sumValue += section.value;
        }
        return [null, null];
    }

    renderRingLayer(children, centerX, centerY, angleMin, angleMax, radiusMin, radiusMax, radiusSum, radiusSumMax, depth)
    {
        const radiusRingStart = lerp(radiusMin, radiusMax, radiusSum / radiusSumMax);

        let totalValue = 0;
        for (let i = 0; i < children.length; i++){
            totalValue += children[i].value;
        }

        let sumValue = 0;
        for (let i = 0; i < children.length; i++){
            const section = children[i];
            const radiusSectionEnd = lerp(radiusMin, radiusMax, (radiusSum + section._radiusFactorAnim) / radiusSumMax);

            const angleSectionStart = lerp(angleMin, angleMax, sumValue / totalValue);
            const angleSectionEnd = lerp(angleMin, angleMax, (sumValue + section.value) / totalValue);

            this.ctx.beginPath();

            let sectionAlpha = 1;
            let sectionAlphaRaw = 1;
            if (this.hoverAlphaEffectEnabled){
                sectionAlphaRaw = section.hoveredAnim;
                sectionAlpha = lerp(.3, 1, section.hoveredAnim);
            }

            const angleAdd = (this.useStiching ? .005 : 0) * sectionAlphaRaw;

            let pixCenAddX = 0;
            let pixCenAddY = 0;
            if (this.useStiching) {
                const stitchDist = -1;
                const angleSectionMid = (angleSectionStart + angleSectionEnd) / 2;
                pixCenAddX = Math.cos(angleSectionMid) * stitchDist * sectionAlphaRaw;
                pixCenAddY = Math.sin(angleSectionMid) * stitchDist * sectionAlphaRaw;
            }

            this.ctx.arc(centerX, centerY, radiusSectionEnd, angleSectionStart-angleAdd, angleSectionEnd+angleAdd);
            if (radiusRingStart <= 0){
                this.ctx.lineTo(centerX + pixCenAddX, centerY + pixCenAddY);
            } else {
                this.ctx.arc(centerX, centerY, radiusRingStart, angleSectionEnd+angleAdd, angleSectionStart-angleAdd, true);
                this.ctx.lineTo(centerX + Math.cos(angleSectionStart) * radiusSectionEnd, centerY + Math.sin(angleSectionStart) * radiusSectionEnd);
            }

            section.applyBgStyle(this.ctx);
            if (section.cssBgColor == "")
                this.ctx.fillStyle = this.getPaletteColor(sumValue, totalValue);

            
            
            this.ctx.globalAlpha = sectionAlpha;
            this.ctx.fill();

            if (this.lineWidth > 0){
                this.ctx.globalAlpha = 1;
                this.applyOutlineStyle(this.ctx);
                this.ctx.stroke();
                this.ctx.globalAlpha = sectionAlpha;
            }

            // Text label
            if (section.name != "" || this.writePercentages)
            {
                const middleAngle = (angleSectionStart + angleSectionEnd) / 2;
                let textDist = (radiusRingStart + radiusSectionEnd) / 2;
                let textX = centerX + Math.cos(middleAngle) * textDist;
                let textY = centerY + Math.sin(middleAngle) * textDist + this.textLineHeight * .1;

                this.applyTextStyle(this.ctx);
                section.applyTextStyle(this.ctx);
                if (section.name != ""){
                    if (this.writePercentages){
                        this.ctx.fillText(section.name, textX, textY + this.textLineHeight * -.5);
                        this.ctx.fillText(Math.round(section.value / totalValue*100) + "%", textX, textY + this.textLineHeight * .5);
                    } else {
                        this.ctx.fillText(section.name, textX, textY);
                    }
                } else {
                    if (this.writePercentages){
                        this.ctx.fillText(Math.round(section.value / totalValue*100) + "%", textX, textY);
                    }
                }
            }

            // Children
            if (section.children.length > 0){
                this.renderRingLayer(
                    section.children, centerX, centerY, angleSectionStart, angleSectionEnd, radiusMin, radiusMax, radiusSum + section._radiusFactorAnim, radiusSumMax, depth + 1
                );
            }

            sumValue += section.value;
        };
    }
}
