
//!-------- ELEMENTS ---------//

// Classes
const elemsCssVar = Array.from(document.getElementsByClassName("cssvar"));
const elemsJsVar = Array.from(document.getElementsByClassName("jsvar"));

// Icon context menu
const elemIconEdit = document.getElementById('iconEdit');
const elemIconLabel = document.getElementById('inputIconLabel');
const elemIconImage = document.getElementById('inputIconImage');
const elemIconDel = document.getElementById('btnIconDel');
const elemIconImgRender0 = document.getElementById('iconImgRender0');
const elemIconImgRender1 = document.getElementById('iconImgRender1');
const elemIconActionName = document.getElementById('iconActionName');
const elemBtnIconAction = document.getElementById('btnIconAction');
const elemsBtnIconAction = Array.from(document.getElementsByClassName('btnIconAction'));
const elemIconActionValue = document.getElementById('iconActionValue');
const elemsIconImgFit = Array.from(document.getElementsByClassName('iconImgFit'));
const elemIconImgFit = document.getElementById('iconImgFit');
const elemIconSizeCells = document.getElementById('iconSizeCells');
const elemIconSizeLabel = document.getElementById('iconSizeLabel');
const elemContextUrl = document.getElementById('elemContextUrl');
const elemsWidgetProperty = Array.from(document.getElementsByClassName('widgetProperty'));

// Normal context menu
const elemNormalContext = document.getElementById('normalContext');
const elemBtnAddIcon = document.getElementById('btnAddIcon');
const elemBtnAddText = document.getElementById('btnAddText');
const elemBtnAddWebsite = document.getElementById('btnAddWebsite');
const elemBtnTextArea = document.getElementById('btnAddTextArea');
const elemBtnOpenSettings = document.getElementById('elemBtnOpenSettings');

// Misc
const root = document.querySelector(':root');
const elemBackground = document.getElementById("background");
const elemsBgImages = document.getElementsByClassName('elemBgImage');
const elemContent = document.getElementById("content");
const elemHolder = document.getElementById("holder");
const elemGrid = document.getElementById("grid");
const elemIconPreview = document.getElementById('iconPreview');
const elemIconSize = document.getElementById('elemIconSize');
const elemIconGap = document.getElementById('elemIconGap');
const elemAnchor = document.getElementById('elemAnchor');
const elemCssPalettes = Array.from(document.getElementsByClassName('cssvarPalette'));
const elemCssRadio = Array.from(document.getElementsByClassName('cssvarRadio'));
const elemCssBtn = Array.from(document.getElementsByClassName('cssvarBtn'));
const elemSettingsHead = document.getElementById('elemSettingsHead');
const elemBtnResetAll = document.getElementById('elemBtnResetAll');

var inputVariables = {};
const iconActionsNames = ['Nothing', 'Link', 'Command', 'Open menu'];
const iconImgFitValue = ['contain','cover','none','fill'];

var menuVisible = false;
var iconClickDist = 3;
var iconClickDelay = 300;
var iconDragged;
var iconRightClicked;
var currentTabName = 'home';

const defStyle = window.getComputedStyle(document.body);

var serializedDataArr = [];
var objectDataArr = [];

let mouseDragElem;
let mouseDragBx;
let mouseDragBy;
let mouseDragMx;
let mouseDragMy;


//!------------------------- Classes -------------------------//


class Widget{
    constructor(){
        // Create doc elements
        this.elem = document.createElement('div');
        elemGrid.appendChild(this.elem);
        this.elems = [this.elem];

        // Initiate behaviors
        
        this.relx = 0;
        this.rely = 0;
        this.setSize(1, 1);
        this.actionType = 0;
        this.actionValue = '';
        this.applyRelPos();

        // Connect events

        this.elem.addEventListener('mousedown', (e) => {this.mousedown(e)}, false);
        this.elem.addEventListener('mouseup', (e) => {this.mouseup(e)}, false);

        objectDataArr.push(this);
        serializedDataArr.push('LOAD');
    }

    rightclicked(e){
        // Icon right clicked
        iconRightClicked = this;
        displayWidgetContext(e, this);
    }

    mousedown(e){
        if (e.button !== 0) return;
        
        // Save current position for dragging
        this.mdt = Date.now();
        this.mdx = e.x;
        this.mdy = e.y;
        this.mox = this.elem.offsetLeft;
        this.moy = this.elem.offsetTop;
        iconDragged = this;
        displayWidgetContext(false);
        displayNormalContext(false);

        if (this.iframe){
            this.iframe.className = 'nomouse';
        }
    } mouseup(e){
        if (e.button !== 0) return;
        
        // Clicked if mouse didn't move enough
        let dx = e.x-this.mdx;
        let dy = e.y-this.mdy;
        let dist = Math.sqrt(dx*dx + dy+dy);
        if (dist < iconClickDist && Date.now()-this.mdt < iconClickDelay){
            this.clicked(e);
            return;
        }
    } clicked(e){
        // Icon left clicked
        if (this.actionType === 1){
            // ACTION: Link
            location.href = this.actionValue;
        } if (this.actionType === 2){
            // ACTION: Script
            const ter = new Terminal(elemCmdHolder, this.actionValue);
            ter.setCenterPosition(e.x, e.y, true);
        } if (this.actionType === 3){
            // ACTION: Folder
        }
    }

    includes(child){
        return this.elems.includes(child);
    }

    destroy(){
        this.elem.remove();

        let i = objectDataArr.indexOf(this);
        objectDataArr.splice(i, 1);
        serializedDataArr.splice(i, 1);
    }

    setRelPos(x,y){
        this.relx = x;
        this.rely = y;
    } applyRelPos(anchor){
        const size = elemIconSize.offsetHeight;
        if (anchor == undefined){
            anchor = getAnchorPoint();
        }
        this.elem.style.left = `${this.relx * size * anchor.dx + anchor.x}px`;
        this.elem.style.top  = `${this.rely * size * anchor.dy + anchor.y}px`;
    }

    setSize(sizex, sizey){
        this.sizex = sizex;
        this.sizey = sizey;
        
        this.elem.style.width = `calc(calc(var(--iconsize) + var(--icongap)) * ${this.sizex} - var(--icongap))`;
        this.elem.style.height = `calc(calc(var(--iconsize) + var(--icongap)) * ${this.sizey} - var(--icongap))`;
    }

    // SAVING
    updateSerialized(){
        const v = this.serialize();
        const i = objectDataArr.indexOf(this);
        serializedDataArr[i] = v;
    } save(){
        this.updateSerialized();
        saveSerializedIcons();
    } unpackBase(data){
        // Unpack the widget basics
        this.relx = data.x;
        this.rely = data.y;
        this.actionType = data.t;
        this.actionValue = data.v;
        this.applyRelPos();
        this.setSize(data.sx, data.sy);
    } serializeBase(append){
        // Serialize the widget basics and appends a given dictionnary
        return Object.assign({}, {
            x : this.relx,
            y : this.rely,
            t : this.actionType,
            v : this.actionValue,
            sx: this.sizex,
            sy: this.sizey,
        }, append);
    }

    createElement(ty, parent){
        let elem = document.createElement(ty);

        this.elems.push(elem);
        if (parent === undefined){
            parent = this.elem;
        }
        parent.appendChild(elem);

        return elem;
    }
}


class Icon extends Widget{
    constructor(){
        super();

        // Create doc elements
        this.img = this.createElement('img');
        this.labelCon = this.createElement('div');
        this.label = this.createElement('div', this.labelCon);

        
        this.img.style.width = '100%';
        this.img.style.height = 'calc(100% - var(--iconlabelheight))';
        this.img.style.objectFit = 'contain';
        this.img.style.objectPosition = 'center';
        this.img.style.borderRadius = 'var(--iconimgradius)';
        this.img.style.border = 'var(--iconimgborder)';

        this.labelCon.style.display = 'flex';
        this.labelCon.style.justifyContent = 'center';
        this.labelCon.style.alignItems = 'end';
        this.labelCon.style.position = 'relative';
        this.labelCon.style.width = '100%';
        this.labelCon.style.height = 'var(--iconlabelheight)';

        this.label.style.textAlign = 'center';
        this.label.style.textOverflow = 'ellipsis';
        this.label.style.maxWidth = '100%';
        this.label.style.maxHeight = '100%';
        this.label.style.whiteSpace = 'nowrap';
        this.label.style.overflow = 'hidden';


        // Initiate behaviors

        this.label.innerText = '?';
        this.setImage('iconUnknown.svg');
        this.setImageFit(0);
        this.setImageRender(0);

        this.updateSerialized();
    }

    setImage(src){
        this.img.src = src;
    } setText(text){
        this.label.innerText = text;
        this.labelCon.display = text === '' ? 'none' : 'flex';
    } setImageFit(value){
        this.imgfit = value;
        this.img.style.objectFit = iconImgFitValue[value];
    } setImageRender(value){
        this.imgrender = value;
        this.img.style.imageRendering = value === 1 ? 'pixelated' : 'auto';
    }

    serialize(){
        return this.serializeBase({
            _ : 'Icon',
            s : this.img.src,
            l : this.label.innerText,
            f : this.imgfit,
            imr: this.imgrender,
        });
    } unpack(data){
        this.unpackBase(data);

        this.setText(data.l);
        this.setImage(data.s);
        this.setImageFit(data.f);
        this.setImageRender(data.imr);

        this.updateSerialized();
    }
}

class Label extends Widget{
    constructor(){
        super();

        // Create doc elements
        this.label = this.createElement('div');
        this.elem.style.display = 'flex';

        // Initiate behaviors

        this.label.innerText = '?';
        this.setAlignX(0);
        this.setAlignY(0);

        this.updateSerialized();
    }

    setText(text){
        this.label.innerText = text;
    } setAlignX(v){
        this.alignx = v;
        let name = 'center';
        if (v == 1){
            name = 'start';
        } if (v == 2){
            name = 'end';
        }
        this.elem.style.alignItems = name;
    } setAlignY(v){
        this.aligny = v;
        let name = 'center';
        if (v == 1){
            name = 'start';
        } if (v == 2){
            name = 'end';
        }
        this.elem.style.justifyContent = name;
    } getAlignX(){
        return this.alignx;
    } getAlignY(){
        return this.aligny;
    }

    serialize(){
        return this.serializeBase({
            _ : 'Label',
            l : this.label.innerText,
            ax : this.alignx,
            ay : this.aligny,
        });
    } unpack(data){
        this.unpackBase(data);

        this.setText(data.l);
        this.setAlignX(data.ax);
        this.setAlignY(data.ay);

        this.updateSerialized();
    }
}

class TextArea extends Widget{
    constructor(){
        super();

        // Create doc elements
        this.elem.style.display = 'flex';

        this.area = this.createElement('textarea');
        this.area.className = 'widgetTextArea';
        this.area.placeholder = '...';
        this.area.style.display = 'flex';

        // Initiate behaviors
        
        this.setAlignX(0);
        this.setAlignY(0);

        this.updateSerialized();

        const widget = this;
        this.area.addEventListener('input', (e) => {
            widget.save();
        });
    }

    setText(text){
        this.area.value = text;
    } setAlignX(v){
        this.alignx = v;
        let name = 'center';
        if (v == 1){
            name = 'start';
        } if (v == 2){
            name = 'end';
        }
        this.area.style.textAlign = name;
    } setAlignY(v){
        this.aligny = v;
        let name = 'center';
        if (v == 1){
            name = 'start';
        } if (v == 2){
            name = 'end';
        }
        this.area.style.alignItems = name;
    } getAlignX(){
        return this.alignx;
    } getAlignY(){
        return this.aligny;
    }

    serialize(){
        return this.serializeBase({
            _ : 'TextArea',
            l : this.area.value,
            ax : this.alignx,
            ay : this.aligny,
        });
    } unpack(data){
        this.unpackBase(data);

        this.setText(data.l);
        this.setAlignX(data.ax);
        this.setAlignY(data.ay);

        this.updateSerialized();
    }
}

class Website extends Widget{
    constructor(){
        super();

        // Create doc elements
        this.iframe = this.createElement('iframe');

        this.iframe.style.left = 0;
        this.iframe.style.top = 0;
        this.iframe.style.width = '100%';
        this.iframe.style.height = '100%';

        // Initiate behaviors

        this.updateSerialized();
    }

    setUrl(url){
        if (url == ''){
            url = 'iconUnknown.svg';
        }
        this.iframe.src = url;
    } getUrl(){
        return this.iframe.src;
    }

    serialize(){
        return this.serializeBase({
            _ : 'Website',
            url : this.getUrl(),
        });
    } unpack(data){
        this.unpackBase(data);

        this.setUrl(data.url);

        this.updateSerialized();
    }
}


class windowBase{
    constructor(elemHead){
        // Settings
        this.preserve = false;

        // Init
        this.elemHead = elemHead;
        this.elem = elemHead.parentNode;
    
        this.btnA = elemHead.children[3];
        this.btnB = elemHead.children[4];
        this.btnC = elemHead.children[5];


        // Anim open
        this.open();
        this.connectEvents();
    }

    connectEvents(){
        const self = this;
        
        this.btnC.addEventListener('click', (e) => {
            self.close();
        });
        this.elemHead.addEventListener('mousedown', (e) => {
            if (e.target === self.elemHead){
                startDrag(e, self.elem);
            }
        });
    }

    open(){
        // was closed?
        if (this.visible !== true){
            this.elem.style.display = 'flex';
            this.elem.style.transform = 'scale(.9)';
            this.elem.style.opacity = '0';
        }

        this.visible = true;
        const self = this;
        requestAnimationFrame(() => {
            self.elem.style.transform = '';
            self.elem.style.opacity = '';
        });
    }
    close(){
        this.visible = false;

        const self = this;
        this.elem.style.transform = 'scale(.9)';
        this.elem.style.opacity = '0';
        this.elem.style.pointerEvents = 'hidden';
        setTimeout(() => {
            self.destroy();
        }, 200);
    }
    destroy(){
        this.visible = false;

        if (this.preserve === true){
            this.elem.style.display = 'none';
        } else {
            this.elem.remove();
        }
    }

    toggle(){
        if (this.visible === true){
            this.close();
        } else {
            this.open();
        }
    }

    set x(v){
        this.elem.style.left = `${v}px`;
    } set y(v){
        this.elem.style.top = `${v}px`;
    }
}

var widgetClasses = {
    'Icon': Icon,
    'Label': Label,
    'Website': Website,
    'TextArea': TextArea,
}

//!------------------------- Utilities -------------------------//


function getInputValue(elem, css){
    // Fuck checkboxes
    if (elem.type == 'checkbox'){
        v = elem.checked;
    } else {
        v = elem.value;
    }

    // Css aliases
    if (css){
        if (elem.value == 'bottom' || elem.value == 'right'){
            return 'end';
        } if (elem.value == 'top' || elem.value == 'left'){
            return 'start';
        }
    }
    return v;
} function setInputValue(elem, v){
    // Fuck checkboxes
    if (elem.type == 'checkbox'){
        elem.checked = v;
    } else {
        elem.value = v;
        elem.innerText = v;
    }
}

function getAnchorPoint(){
    // Get the absolute position of the icon's anchor
    // Get CSS alignments
    const bounds = elemGrid.getBoundingClientRect();
    const size = elemIconSize.offsetHeight;
    const ax = inputVariables['--iconsx'];
    const ay = inputVariables['--iconsy'];

    // X anchor
    let vx = bounds.left;
    let dx = 1;
    if (ax == 'end' || ax == 'right'){
        vx = bounds.right - size;
        dx = -1;
    } else if (ax == 'center'){
        vx = (bounds.right + bounds.left - size)/2;
    }

    // Y anchor
    let dy = 1;
    let vy = bounds.top;
    if (ay == 'end' || ay == 'bottom'){
        vy = bounds.bottom - size;
        dy = -1;
    } else if (ay == 'center'){
        vy = (bounds.top + bounds.bottom - size)/2;
    }

    return {'x': vx, 'y': vy, 'dx': dx, 'dy': dy};
}

function getAllIconsBoundingBox(){
    let rects = [];
    objectDataArr.map((widget) => {
        rects.push(widget.elem.getBoundingClientRect());
    });
    return rects;
}

function placementCellCollide(pos, size, rects){
    // Does the given position collide with any icons?
    if (rects === undefined){
        rects = getAllIconsBoundingBox();
    }

    const left = pos[0];
    const top = pos[1];
    const right = pos[0] + size[0];
    const bottom = pos[1] + size[1];

    for (let i=0; i<rects.length; i++){
        const r = rects[i];
        
        if (!(right < r.left || left > r.right || bottom < r.top || top > r.bottom)){
            return true;
        }
    }
    return false;
}

function findEmptyCellPlacement(size){
    const iconSize = elemIconSize.offsetHeight;
    if (size === undefined){
        size = [iconSize, iconSize];
    }
    const anchor = getAnchorPoint();
    const rects = getAllIconsBoundingBox();

    // find available placement
    let i = 0;
    const maxy = Math.floor(elemGrid.offsetHeight/iconSize);
    while (i<1000){
        const ay = i%maxy;
        const ax = Math.floor(i/maxy);

        const relPos = [ax * anchor.dx, ay * anchor.dy];
        const pixPos = [relPos[0] * size[0] * anchor.dx + anchor.x, relPos[1] * size[1] * anchor.dy + anchor.y];

        const col = placementCellCollide(pixPos, size, rects);
        if (!col){
            return relPos;
        }

        i++;
    }
}

function debugSquare(x,y,w,h, lifetime = 3000){
    const elem = document.createElement('div');
    elem.style.position = 'absolute';
    elem.style.background = 'red';
    elem.style.left = `${x}px`;
    elem.style.top = `${y}px`;
    elem.style.width = `${w}px`;
    elem.style.height = `${h}px`;
    elem.style.border = '1px solid green'
    document.body.appendChild(elem);

    setTimeout(() => {
        elem.remove();
    }, lifetime)

    return elem;
}



//!------------------------- Saves -------------------------//


//localStorage.clear();

// Save icons
function saveSerializedIcons(){
    localStorage.setItem('tab_'+currentTabName, JSON.stringify(serializedDataArr));
}
function loadSavedTab(name){
    const js = localStorage.getItem('tab_'+name);
    if (js !== undefined){
        const data = JSON.parse(js);
        if (data !== null){
            data.map((dict) => {
                const cla = widgetClasses[dict['_']]
                if (cla){
                    let widget = new cla();
                    widget.unpack(dict);
                }
            });
        }
    }
}


//!------------------------- Automatic saves input -------------------------//


// Css input

var cssVarInputElems = {};

function newCssVarInput(elem){
    const props = elem.dataset.prop.split(';');

    elem.addEventListener('change', (e) => {
        // Get values
        let values = getInputValue(elem, true);
        if (typeof values === 'string'){
            values = values.split(';');
        } else {
            values = [values];
        }
        const min = Math.min(values.length, props.length);

        // Set all properties values
        for (let i=0; i<min; i++){
            const prop = props[i];
            const v = values[i];

            // Set property value
            root.style.setProperty(prop, v);
            localStorage.setItem(prop, v);
            inputVariables[prop] = v;
        }

        // Events
        for (let i=0; i<min; i++){
            const v = values[i];
            const inputs = cssVarInputElems[props[i]];
            for (let j=0; j<inputs.length; j++){
                if (inputs[j] !== elem){
                    inputs[j].value = v;
                }
            }
        }

        // Refresh icons
        refreshAllIconsPositions();
    });

    // Init
    for (let i=0; i<props.length; i++){
        const prop = props[i];

        // Add input to events list
        if (!(prop in cssVarInputElems)){
            cssVarInputElems[prop] = [];
        }
        cssVarInputElems[prop].push(elem);

        // Set saved or default value
        let v = localStorage.getItem(prop);
        if (v == undefined){
            v = defStyle.getPropertyValue(prop);
        } else {
            root.style.setProperty(prop, v);
        }
        setInputValue(elem, v);
        inputVariables[prop] = v;
    }
}
elemsCssVar.map(newCssVarInput);

// Misc js input
elemsJsVar.map((elem) => {
    const prop = elem.dataset.prop;
    elem.addEventListener('change', (e) => {
        const v = getInputValue(elem);
        localStorage.setItem(prop, v ? 1 : 0);
        inputVariables[prop] = v;
        refreshAllIconsPositions();
    });
    let v = localStorage.getItem(prop) == 1;
    if (v === undefined){
        v = getInputValue(elem);
    }
    setInputValue(elem, v);
    inputVariables[prop] = v;
});

const paletteColorsBg = [
    'black',
    'white',
    'hsl(0,   80%, 80%)',
    'hsl(20,  80%, 80%)',
    'hsl(40,  80%, 80%)',
    'hsl(60,  80%, 80%)',
    'hsl(80,  80%, 80%)',
    'hsl(100, 80%, 80%)',
    'hsl(120, 80%, 80%)',
    'hsl(140, 80%, 80%)',
    'hsl(160, 80%, 80%)',
    'hsl(180, 80%, 80%)',
    'hsl(200, 80%, 80%)',
    'hsl(220, 80%, 80%)',
    'hsl(240, 80%, 80%)',
]

function sethw(elem, v){
    elem.style.height = v;
    elem.style.width = v;
}

class JsInput{
    constructor(){
        // Css artificial input, pass events
        this.listeners = {};
    }

    fire(name){
        const onname = 'on'+name;
        if (typeof this[onname] === 'function'){
            this[onname](this);
        }
        if (typeof this.listeners[name] === 'function'){
            this.listeners[name](this);
        }
    }

    addEventListener(name, func){
        this.listeners[name] = func;
    }
}

class PaletteInput extends JsInput{
    constructor(parent, colors){
        super();
        this.dataset = parent.dataset;
        this.build(parent, colors);
    }

    build(parent, colors){
        // Build palette elements
        const self = this;

        const sx = Math.ceil(Math.sqrt(colors.length));
        const cellSize = '4vh';
        const gapSize = '2px';

        parent.style.display = 'grid';
        parent.style.gridGap = gapSize;
        parent.style.gridTemplateColumns = `repeat(auto-fill, ${cellSize})`;
        parent.style.width = `calc(calc(${cellSize} + ${gapSize}) * ${sx} - ${gapSize})`;

        // Color cells
        this.cells = [];
        for (let i=0; i<colors.length; i++){
            let child = document.createElement('div');
            child.className = 'cell paletteCell';
            child.dataset.v = colors[i];
            child.style.backgroundColor = colors[i];
            sethw(child, cellSize);
            parent.appendChild(child);
            this.cells.push(child);

            child.addEventListener('click', (e) => {
                self.select(child);
            });
        }

        // Last customizable color
        let last = document.createElement('div');
        last.style.position = 'relative';
        last.className = 'cell paletteCell';
        sethw(last, cellSize);
        parent.appendChild(last);

        let input = document.createElement('input');
        input.className = 'cell';
        input.type = 'color';
        sethw(input, cellSize);
        last.appendChild(input);
        this.input = input;

        // Last icon
        var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.innerHTML = '<path fill="currentColor" d="M21.65 3.434a4.889 4.889 0 1 1 6.915 6.914l-.902.901l-6.914-6.914zM19.335 5.75L4.357 20.73a3.7 3.7 0 0 0-1.002 1.84l-1.333 6.22a1 1 0 0 0 1.188 1.188l6.22-1.333a3.7 3.7 0 0 0 1.84-1.002l14.98-14.98z"/>';
        svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
        svg.setAttribute('viewBox', '0 0 32 32');
        svg.style.position = 'absolute';
        svg.style.left = '25%';
        svg.style.top = '25%';
        sethw(svg, '50%');
        svg.style.pointerEvents = 'none';
        svg.style.mixBlendMode = 'difference';
        last.appendChild(svg);
        this.cells.push(input);

        input.addEventListener('input', (e) => {
            self.select(input);
        }); input.addEventListener('click', (e) => {
            self.select(input);
        });
    }

    select(elem){
        // Deselect old element
        const old = this.oldSel;
        if (old !== undefined){
            old.className = 'cell paletteCell';
        }
        this.oldSel = elem;

        // Select new element
        if (elem === undefined){
            this.value = undefined;
        } else {
            let v;
            elem.className = 'cell paletteCell sel';
            if (elem == this.input){
                v = elem.value;
            } else {
                v = elem.dataset.v;
            }
            this.value = v;
        }

        this.fire('change');
        this.fire('input');
    }

}

class BtnInput extends JsInput{
    constructor(elem){
        super(),
        this.elem = elem;
        this.dataset = elem.dataset;
        this.values = this.dataset.v.split(';');
        this.props = this.dataset.prop.split(';');

        const self = this;
        elem.addEventListener('click', (e) => {
            self.value = self.dataset.v;
            self.fire('change');
            self.fire('input');
            this.selected(true);
        });
    }

    selected(bool){
        if (bool){
            this.elem.style.background = 'color-mix(in srgb, var(--text), transparent 70%)';
        } else {
            this.elem.style.background = '';
        }
    } checkSelected(bool){
        let match = true;
        for (let i=0; i<this.props.length; i++){
            if (inputVariables[this.props[i]] !== this.values[i]){
                match = false;
                break;
            }
        }
        this.selected(match);
    }

    get value(){
        return this._value;
    } set value(v){
        if (v.split(';').length == this.props.length){
            // Valid input, if same number values as properties
            this._value = v;
        }
        this.checkSelected();
    }
}

class RadioInput extends JsInput{
    constructor(parent){
        super();
        this.dataset = parent.dataset;

        // Already built
        const self = this;
        this.children = parent.children;
        this.values = [];
        for (let i=0; i < this.children.length; i++){
            const child = this.children[i];
            if (child.dataset.v !== undefined){
                this.values.push(child.dataset.v);
                child.addEventListener('click', (e) => {
                    self.select(child);
                });
            }
        }
    }

    select(elem){
        if (this.oldSel !== undefined){
            this.oldSel.style.background = '';
        }
        this.oldSel = elem;

        if (elem === undefined){
            this._value = undefined;
        } else {
            this._value = elem.dataset.v;
            elem.style.background = 'color-mix(in srgb, var(--text), transparent 70%)';
        }
        this.fire('change');
        this.fire('input');
    }
    
    // Getter and setter
    get value(){
        return this._value;
    } set value(v){
        this._value = v;

        // Show selected
        const i = this.values.indexOf(v);
        if (i>-1){
            this.select(this.children[i]);
        }
    }
}

elemCssPalettes.map((elem) => {
    const palette = new PaletteInput(elem, paletteColorsBg);
    newCssVarInput(palette);
});
elemCssRadio.map((elem) => {
    const radio = new RadioInput(elem);
    newCssVarInput(radio);
});
elemCssBtn.map((elem) => {
    const btn = new BtnInput(elem);
    newCssVarInput(btn);
});


//!------------------------- DOCUMENT EVENTS -------------------------//


// Replace right click
document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    for (let i=0; i<objectDataArr.length; i++){
        const icon = objectDataArr[i];
        if (icon.includes(e.target)){
            icon.rightclicked(e);
            return;
        }
    }
    displayNormalContext(e);
}, false);

// Close context menu when window resized
window.addEventListener("resize", () => {
    displayWidgetContext(false);
    displayNormalContext(false);
    refreshAllIconsPositions();
});

// Close context menu when background clicked
elemHolder.addEventListener('click', (e) => {
    if (e.target == elemHolder || e.target == elemContent || e.target == elemGrid){
        // holder clicked
        displayWidgetContext(false);
        if (e.button !== 2){
            displayNormalContext(false);
        }
    }
});


/*
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false)
})
*/

function readFile(file, func){
    let reader = new FileReader();
    reader.onload = function(){
        func(reader.result);
    };
    reader.readAsDataURL(file);
}

function stringDict(str, charDef = '=', charBreak = '\n'){
    let res = {};

    // cleanup
    str = str.replaceAll('\r','').replaceAll('\t','');
    const lines = str.split(charBreak);
    for (let i=0; i<lines.length; i++){
        const kv = lines[i].split(charDef);
        if (kv.length>1){
            res[kv[0]] = kv[1];
        }
    }
    return res;
}

function fileDropped(file, e){
    const ty = file.type;
    if (ty.includes('image')){
        // Create icon
        addWidget(Icon, (widget) => {
            widget.setText(file.name);

            // Read image file
            let reader = new FileReader();
            reader.onload = function(){
                widget.setImage(reader.result);
                widget.save();
            };
            reader.readAsDataURL(file);
        }, e.x, e.y);
    } else if (ty == '' && file.name.includes('url')) {
        addWidget(Icon, (widget) => {
            widget.setText(file.name.substring(0, file.name.length-4));
            widget.setImage('iconShortcut.svg');

            // Read image file
            let reader = new FileReader();
            reader.onload = function(){
                const str = reader.result;
                const data = stringDict(str, '=','\n');

                widget.actionType = 1;
                widget.actionValue = data.URL;
                if (data.IconFile){
                    widget.setImage(data.IconFile);
                }
                widget.save();
            };
            reader.readAsText(file);
        }, e.x, e.y);

        //document.location.href = 'steam://rungameid/548430';
    } else {
        console.log('File not supported:', file);
    }
}

function dropEvents(e){
    displayNormalContext(false);
    displayWidgetContext(false);

    preventEvent(e);
    const files = e.dataTransfer.files;
    for (let i=0; i<files.length; i++){
        fileDropped(files[i], e);
    }
} function preventEvent(e){
    e.preventDefault();
    e.stopPropagation();
}
function dropElems(elem){
    elem.addEventListener('drop', dropEvents);
    elem.addEventListener('dragenter', preventEvent);
    elem.addEventListener('dragover', preventEvent);
}
dropElems(elemGrid);
dropElems(elemHolder);
dropElems(elemContent);


function mousemove(e){
    if (iconDragged){
        let dx = e.x-iconDragged.mdx;
        let dy = e.y-iconDragged.mdy;
        let dist = Math.sqrt(dx*dx + dy+dy);
        
        if (dist > iconClickDist){
            const anchor = getAnchorPoint();
            const size = elemIconSize.offsetHeight;
            const x = e.x - iconDragged.mdx + iconDragged.mox;
            const y = e.y - iconDragged.mdy + iconDragged.moy;
            iconDragged.elem.style.left = `${x}px`;
            iconDragged.elem.style.top  = `${y}px`;
    
            // Snapping preview
            if (inputVariables['iconsnapping']){
                elemIconPreview.style.display = 'flex';
    
                let ax, ay;
                if (inputVariables['cornersnapping']){
                    ax = (Math.floor((x - anchor.x)/size) + .5)*size;
                    ay = (Math.floor((y - anchor.y)/size) + .5)*size;
                } else {
                    ax = Math.floor((x - anchor.x)/size+.5)*size;
                    ay = Math.floor((y - anchor.y)/size+.5)*size;
                }
    
                elemIconPreview.style.left = `${ax + anchor.x}px`;
                elemIconPreview.style.top  = `${ay + anchor.y}px`;
                elemIconPreview.style.width = iconDragged.elem.style.width;
                elemIconPreview.style.height = iconDragged.elem.style.height;
    
                iconDragged.setRelPos(
                    ax * anchor.dx /size,
                    ay * anchor.dy /size,
                );
            } else {
                iconDragged.setRelPos(
                    (x - anchor.x)/size * anchor.dx,
                    (y - anchor.y)/size * anchor.dy,
                );
            }
        }
    }

    // window drag
    if (mouseDragElem){
        const dx = mouseDragBx - mouseDragMx + e.x;
        const dy = mouseDragBy - mouseDragMy + e.y;
        mouseDragElem.style.left = `${dx}px`;
        mouseDragElem.style.top = `${dy}px`;
    }
}
function mouseup(e){
    if (iconDragged){
        iconDragged.applyRelPos();
        iconDragged.save();
    }
    mouseDragElem = undefined;
    stopIconDrag();
}

document.addEventListener('mousemove', mousemove, false);
document.addEventListener('mouseup', mouseup, false);


//!------------------------- ICON CONTEXT MENU -------------------------//


function positionContextElement(elem, e){
    const screensx = window.innerWidth;
    const screensy = window.innerHeight;

    let rectmenu = elem.getBoundingClientRect();
    let menusx = rectmenu.right-rectmenu.left;
    let menusy = rectmenu.bottom-rectmenu.top;

    if (e.x>screensx-menusx){
        elem.style.left = `${e.x-menusx}px`;
    } else {
        elem.style.left = `${e.x}px`;
    }
    if (e.y>screensy-menusy){
        elem.style.top = `${e.y-menusy}px`;
    } else {
        elem.style.top = `${e.y}px`;
    }
}

function displayWidgetContext(e, widget){
    // Open widget context menu
    elemIconEdit.style.display = e ? 'flex' : 'none';

    if (e === false){
        // hide
        iconRightClicked = null;
        return;
    }

    iconSizeCellHovered = [0, 0];
    displayNormalContext(false);
    positionContextElement(elemIconEdit, e);

    // Actions

    if (widget.label !== undefined){
        elemIconLabel.value = widget.label.innerText;
    } if (widget.actionType !== undefined){
        setIconMenuActionType(widget.actionType);
    } if (widget.actionValue !== undefined){
        elemIconActionValue.value = widget.actionValue;
    } if (widget.imgfit !== undefined){
        setIconMenuImageFit(widget.imgfit);
    } if (widget.getUrl !== undefined){
        elemContextUrl.value = widget.getUrl();
    }

    refreshIconSizeCells();

    // Display sections
    const children = elemIconEdit.children;
    for (let i=0; i<children.length; i++){
        const child = children[i];
        if (child.dataset){
            let attributes = child.dataset.attr;
            if (attributes){
                attributes = attributes.replaceAll(' ','').split(',');
                let correct = true;
                for (let j=0; j<attributes.length; j++){
                    if (widget[attributes[j]] === undefined){
                        correct = false;
                        break;
                    }
                }
                child.style.display = correct ? '' : 'none';
            }
        }
    }

    // Show selected properties
    elemsWidgetProperty.map((btn) => {
        const value = btn.dataset.v;
        const funcGet = btn.dataset.get;

        if (Number.isInteger(value)){
            value = parseInt(value);
        }

        const func = widget[funcGet];
        let match = false;
        if (func !== undefined){
            match = func() === value;
        }

        btn.style.border = match ? '1px solid var(--text)' : '';
    });
}

elemsWidgetProperty.map((btn) => {
    const functionName = btn.dataset.f;
    const value = btn.dataset.v;

    if (Number.isInteger(value)){
        value = parseInt(value);
    }

    btn.addEventListener('click', (e) => {
        iconRightClicked[functionName](value);
        displayWidgetContext(false);
    });
});


// Size cells
var iconSizeCellHovered = [0, 0];
function foreachIconSizeCells(func){
    elemIconSizeCells.children;
    for (let y=0; y<elemIconSizeCells.children.length; y++){
        const row = elemIconSizeCells.children[y];
        for (let x=0; x<row.children.length; x++){
            func(row.children[x], x, y);
        }
    }
} function refreshIconSizeCells(){
    foreachIconSizeCells((cell, x, y) => {
        cell.style.backgroundColor = 'var(--text)';
        const hovered = iconSizeCellHovered && x < iconSizeCellHovered[0] && y < iconSizeCellHovered[1];
        
        let v = .2;
        if (iconRightClicked && x < iconRightClicked.sizex && y < iconRightClicked.sizey){
            v += .4;
        } if (hovered) {
            v += .4;
        }
        cell.style.opacity = v;
    });

    if (iconRightClicked){
        elemIconSizeLabel.innerText = `${iconRightClicked.sizex} x ${iconRightClicked.sizey}`;
    }
}


foreachIconSizeCells((cell, x, y) => {
    const sx = x+1;
    const sy = y+1;
    cell.addEventListener('click', (e) => {
        iconRightClicked.setSize(sx, sy);
        iconRightClicked.save();
        refreshIconSizeCells();
        displayWidgetContext(false);
    });
    cell.addEventListener('mouseenter', (e) => {
        iconSizeCellHovered = [sx, sy];
        refreshIconSizeCells();
    });
});
elemIconSizeCells.addEventListener('mouseleave', (e) => {
    iconSizeCellHovered = [0, 0];
    refreshIconSizeCells();
});

// Image
elemIconImage.onchange = (e) => {
    // Pick file
    let reader = new FileReader();
    reader.onload = function(){
        let dataURL = reader.result;
        iconRightClicked.setImage(dataURL);
        iconRightClicked.save();
        displayWidgetContext(false);

        // Reset property
        elemIconImage.value = null;
    };
    reader.readAsDataURL(elemIconImage.files[0]);
};

// Text
elemIconLabel.addEventListener('change', (e) => {
    iconRightClicked.setText(elemIconLabel.value);
    iconRightClicked.save();
    displayWidgetContext(false);
}, false);

// Destroy
elemIconDel.addEventListener('click', () => {
    iconRightClicked.destroy();
    displayWidgetContext(false);
    saveSerializedIcons();
}, false);

// Action Type
function setIconMenuActionType(value){
    elemBtnIconAction.innerHTML = elemsBtnIconAction[value].innerHTML;
    elemIconActionName.innerText = iconActionsNames[value];
    
    if (iconRightClicked){
        iconRightClicked.actionType = value;
        iconRightClicked.save();
    }
}
elemsBtnIconAction.map((elem) => {
    // Connect all action type buttons
    const value = parseInt(elem.dataset.action);
    elem.addEventListener('click', (e) => {
        setIconMenuActionType(value);
    });
});
setIconMenuActionType(0);

// Action value
elemIconActionValue.addEventListener('change', () => {
    if (iconRightClicked){
        iconRightClicked.actionValue = elemIconActionValue.value;
        iconRightClicked.save();
    }
});

// Image fit
function setIconMenuImageFit(value){
    elemIconImgFit.innerText = iconImgFitValue[value];

    if (iconRightClicked){
        iconRightClicked.setImageFit(value);
        iconRightClicked.save();
    }
}
elemsIconImgFit.map((elem) => {
    const v = parseInt(elem.dataset.v);
    elem.addEventListener('click', (e) => {
        setIconMenuImageFit(v);
    })
});

function setImageRenderValue(v){
    iconRightClicked.setImageRender(v);
    iconRightClicked.save();
    displayWidgetContext(false);
}
elemIconImgRender0.addEventListener('click', (e) => {setImageRenderValue(0)});
elemIconImgRender1.addEventListener('click', (e) => {setImageRenderValue(1)});

elemContextUrl.addEventListener('change', (e) => {
    iconRightClicked.setUrl(elemContextUrl.value);
    iconRightClicked.save();
});



//!------------------------- NORMAL CONTEXT MENU -------------------------//

var contextpx = 0;
var contextpy = 0;

function displayNormalContext(e){
    elemNormalContext.style.display = e ? 'flex' : 'none';
    if (!e) return;

    contextpx = e.x;
    contextpy = e.y;

    displayWidgetContext(false);
    positionContextElement(elemNormalContext, e);
}

// ADD WIDGETS
function addWidget(ty, func, x,y){
    displayNormalContext(false);

    // Add widget on mouse
    let widget = new ty();

    // Set position
    if (x !== undefined){
        const size = elemIconSize.offsetHeight;
        const anchor = getAnchorPoint();
        widget.setRelPos(
            (x - anchor.x) / size * anchor.dx -.5,
            (y - anchor.y) / size * anchor.dy -.5
        )
    }

    widget.applyRelPos();
    if (func){
        func(widget);
    }
    widget.save();
}
elemBtnAddIcon.addEventListener('click', (e) => {
    addWidget(Icon, (widget) => {
        widget.setText('Unnamed');
        widget.setImage('iconUnknown.svg');
    }, contextpx, contextpy);
});
elemBtnAddText.addEventListener('click', (e) => {
    addWidget(Label, (widget) => {
        widget.setText('Lorem ipsum');
    }, contextpx, contextpy);
});
elemBtnAddWebsite.addEventListener('click', (e) => {
    addWidget(Website, (widget) => {
        widget.setUrl('index.html');
        widget.setSize(3, 2);
    }, contextpx, contextpy);
});
elemBtnOpenCmd.addEventListener('click', (e) => {
    displayNormalContext(false);
    
    const ter = new Terminal(elemCmdHolder);
    ter.setCenterPosition(e.x, e.y, true);    
});
elemBtnTextArea.addEventListener('click', (e) => {
    addWidget(TextArea, (widget) => {
        widget.setText('Enter text here');
        widget.setSize(2, 2);
    }, contextpx, contextpy);
});

// Open settings
const windowSettings = new windowBase(elemSettingsHead);
windowSettings.preserve = true;
windowSettings.destroy();
elemBtnOpenSettings.addEventListener('click', (e) => {
    windowSettings.open();
    windowSettings.x = contextpx;
    windowSettings.y = contextpy;
    displayNormalContext(false);
});


//!------------------------- MISC -------------------------//


function refreshAllIconsPositions(){
    const anchor = getAnchorPoint();
    objectDataArr.map((icon) => {
        icon.applyRelPos(anchor);
    });
    refreshAnchor(anchor);
}
function refreshAnchor(anchor){
    elemAnchor.style.left = `${anchor.x - elemAnchor.offsetWidth/2}px`;
    elemAnchor.style.top  = `${anchor.y - elemAnchor.offsetHeight/2}px`;
}

// Keybind
document.addEventListener('keydown', function(e){
	if(e.key === 'Escape'){
        
	} if (e.key === 't' && false){
        const ter = new Terminal(elemCmdHolder);
        ter.setCenterPosition(window.innerWidth/2 ,window.innerHeight/2);
        ter.clearInput();
    }
}, false);

function setBackgroundImage(data){
    root.style.setProperty('--bgimage', `url('${data}')`);

    // Image sources
    for (let i=0; i<elemsBgImages.length; i++){
        const elem = elemsBgImages[i];
        if (elem.tagName === 'IMG'){
            elem.src = data;
        }
    }
}


// Background image
var bgfileopen = function(file){
    let input = file.target;
    let reader = new FileReader();
    reader.onload = function(){
        let dataURL = reader.result;
        setBackgroundImage(dataURL);

        base64 = btoa(dataURL);
        localStorage.setItem('bgimg', base64);
    };
    reader.readAsDataURL(input.files[0]);
};
var bgfileremove = function(){
    setBackgroundImage('');
    localStorage.setItem('bgimg', '');
}

function stopIconDrag(){
    if (iconDragged){
        if (iconDragged.iframe){
            iconDragged.iframe.className = '';
        }
    }

    iconDragged = undefined;
    elemIconPreview.style.display = 'none';
}

function startDrag(e, elem){
    mouseDragElem = elem;
    mouseDragBx = elem.offsetLeft;
    mouseDragBy = elem.offsetTop;
    mouseDragMx = e.x;
    mouseDragMy = e.y;
}

function elemCateHideShow(elem, show){
    if (show){
        elem.style.opacity = '1';
        elem.style.transform = 'scale(1)';
        elem.style.pointerEvents = 'all';
    } else {
        elem.style.opacity = '0';
        elem.style.transform = 'scale(.8)';
        elem.style.pointerEvents = 'none';
    }
}

function handleElemsCate(parent, baseCate, basePage){
    const elemsCate     = Array.from(parent.getElementsByClassName('elemCate')); // Buttons bars
    const elemsCateBtn  = Array.from(parent.getElementsByClassName('elemCateBtn'));
    const elemsCatePage = Array.from(parent.getElementsByClassName('elemCatePage'));

    function setCatePage(cate, page){
        // Hide or show elements
        elemsCate.map((elem) => {
            elemCateHideShow(elem, elem.dataset.v === cate);
        }); elemsCatePage.map((elem) => {
            elemCateHideShow(elem, elem.dataset.v === page);
        });
    }

    elemsCateBtn.map((elem) => {
        const [cate, page] = elem.dataset.v.split('/');
        elem.addEventListener('click', (e) => {
            setCatePage(cate, page);
        });
    });

    setCatePage(baseCate, basePage);
}
handleElemsCate(elemSettingsHead.parentNode, '','menu');


elemBtnResetAll.addEventListener('click', (e) => {
    // Reset all data
    localStorage.clear();
    location.reload();
});


//!-------------------------------- INIT ---------------------------------//


let bgimg = localStorage.getItem('bgimg');
if (bgimg){
    setBackgroundImage(atob(bgimg));
}

stopIconDrag();
displayNormalContext(false);
displayWidgetContext(false);

loadSavedTab(currentTabName);

