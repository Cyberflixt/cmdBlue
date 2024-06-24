
const elemBackground = document.getElementById("background");
const elemContent = document.getElementById("content");
const elemHolder = document.getElementById("holder");
const elemMenu = document.getElementById("menu");
const elemGrid = document.getElementById("grid");
const elemIconPreview = document.getElementById('iconPreview');
const elemIconSize = document.getElementById('elemIconSize');

const elemsCssVar = Array.from(document.getElementsByClassName("cssvar"));
const elemsJsVar = Array.from(document.getElementsByClassName("jsvar"));

const elemIconEdit = document.getElementById('iconEdit');
const elemIconLabel = document.getElementById('inputIconLabel');
const elemIconImage = document.getElementById('inputIconImage');
const elemIconDel = document.getElementById('btnIconDel');
const elemIconActionName = document.getElementById('iconActionName');
const elemBtnIconAction = document.getElementById('btnIconAction');
const elemsBtnIconAction = Array.from(document.getElementsByClassName('btnIconAction'));
const elemIconActionValue = document.getElementById('iconActionValue');
const elemsIconImgFit = Array.from(document.getElementsByClassName('iconImgFit'));
const elemIconImgFit = document.getElementById('iconImgFit');

const elemNormalContext = document.getElementById('normalContext');
const elemBtnAddIcon = document.getElementById('btnAddIcon');
const elemBtnAddText = document.getElementById('btnAddText');

const elemAnchor = document.getElementById('elemAnchor');

var root = document.querySelector(':root');


var inputVariables = {};
const iconActionsNames = ['Nothing', 'Link', 'Command', 'Open menu'];
const iconImgFitValue = ['contain','cover','none','fill'];

var menuVisible = false;
var iconClickDist = 3;
var iconClickDelay = 100;
var iconDragged;
var iconRightClicked;
var currentTabName = 'tab0';

const defStyle = window.getComputedStyle(document.body);

var serializedDataArr = [];
var objectDataArr = [];


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
        this.actionType = 0;
        this.actionValue = '';
        this.applyRelPos();

        // Connect events

        this.elem.addEventListener('mousedown', (e) => {this.mousedown(e)});
        this.elem.addEventListener('mouseup', (e) => {this.mouseup(e)});

        objectDataArr.push(this);
        serializedDataArr.push('LOAD');
    }

    rightclicked(e){
        // Icon right clicked
        iconRightClicked = this;
        displayIconContext(e, this);
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
        displayIconContext(false);
        displayNormalContext(false);
    } mouseup(e){
        if (e.button !== 0) return;
        
        // Clicked if mouse didn't move enough
        let dx = e.x-this.mdx;
        let dy = e.y-this.mdy;
        let dist = Math.sqrt(dx*dx + dy+dy);
        if (dist < iconClickDist && Date.now()-this.mdt < iconClickDelay){
            this.clicked();
            return;
        }
    } clicked(e){
        // Icon left clicked
        if (this.actionType === 1){
            location.href = this.actionValue;
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

    // SAVING
    updateSerialized(){
        const v = this.serialize();
        const i = objectDataArr.indexOf(this);
        serializedDataArr[i] = v;
    } save(){
        this.updateSerialized();
        saveSerializedIcons();
    }
}


class Icon extends Widget{
    constructor(){
        super();

        // Create doc elements
        this.img = document.createElement('img');
        this.label = document.createElement('div');
    
        this.elem.appendChild(this.img);
        this.elem.appendChild(this.label);
        this.elems.push(this.img);
        this.elems.push(this.label);

        // Initiate behaviors

        this.imgfit = 0;
        this.label.innerText = '?';
        this.updateSerialized();

        // Connect events

        this.elem.addEventListener('mousedown', (e) => {this.mousedown(e)});
        this.elem.addEventListener('mouseup', (e) => {this.mouseup(e)});
    }

    setImage(src){
        this.img.src = src;
    } setText(text){
        this.label.innerText = text;
    } setImageFit(value){
        this.imgfit = value;
        this.img.style.objectFit = iconImgFitValue[value];
    }

    serialize(){
        return {
            '_':'Icon',
            'x': this.relx,
            'y': this.rely,
            't': this.actionType,
            'v': this.actionValue,
            's': this.img.src,
            'l': this.label.innerText,
            'f': this.imgfit,
        }
    } unpack(data){
        this.setText(data.l);
        this.setImage(data.s);
        this.setImageFit(data.f);

        this.relx = data.x;
        this.rely = data.y;
        this.actionType = data.t;
        this.actionValue = data.v;
        this.applyRelPos();
        this.updateSerialized();
    }
}

class Label extends Widget{
    constructor(){
        super();

        // Create doc elements
        this.label = document.createElement('div');
    
        this.elem.appendChild(this.label);
        this.elems.push(this.label);

        // Initiate behaviors

        this.label.innerText = '?';
        this.updateSerialized();

        // Connect events

        this.elem.addEventListener('mousedown', (e) => {this.mousedown(e)});
        this.elem.addEventListener('mouseup', (e) => {this.mouseup(e)});
    }

    setText(text){
        this.label.innerText = text;
    }

    serialize(){
        return {
            '_':'Label',
            'x': this.relx,
            'y': this.rely,
            't': this.actionType,
            'v': this.actionValue,
            'l': this.label.innerText,
        }
    } unpack(data){
        this.setText(data.l);

        this.relx = data.x;
        this.rely = data.y;
        this.actionType = data.t;
        this.actionValue = data.v;
        this.applyRelPos();
        this.updateSerialized();
    }
}

var widgetClasses = {
    'Icon': Icon,
    'Label': Label,
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

// Side menu
function showMenu(show){
    menuVisible = show;
    elemMenu.style.display = show ? 'flex' : 'none';
    elemAnchor.style.display = show ? 'flex' : 'none';
    refreshAllIconsPositions();
}
// Keybind
document.addEventListener('keydown', function(event){
	if(event.key === "Escape"){
		showMenu(!menuVisible);
	}
});


// Background image
var bgfileopen = function(file) {
    let input = file.target;
    let reader = new FileReader();
    reader.onload = function(){
        let dataURL = reader.result;
        elemBackground.style.backgroundImage = `url('${dataURL}')`;

        base64 = btoa(dataURL);
        localStorage.setItem('bgimg', base64);
    };
    reader.readAsDataURL(input.files[0]);
};

function stopIconDrag(){
    iconDragged = undefined;
    elemIconPreview.style.display = 'none';
}


//!------------------------- Saves -------------------------//


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
elemsCssVar.map((elem) => {
    const propName = elem.dataset.propName;
    elem.addEventListener('change', (e) => {
        const v = getInputValue(elem, true);
        root.style.setProperty(propName, v);
        localStorage.setItem(propName, v);
        inputVariables[propName] = v;
        refreshAllIconsPositions();
    });
    let v = localStorage.getItem(propName);
    if (v == undefined){
        v = defStyle.getPropertyValue(propName);
    } else {
        root.style.setProperty(propName, v);
    }
    setInputValue(elem, v);
    inputVariables[propName] = v;
});
// Misc js input
elemsJsVar.map((elem) => {
    const propName = elem.dataset.propName;
    elem.addEventListener('change', (e) => {
        const v = getInputValue(elem);
        localStorage.setItem(propName, v ? 1 : 0);
        inputVariables[propName] = v;
        refreshAllIconsPositions();
    });
    let v = localStorage.getItem(propName) == 1;
    if (v === undefined){
        v = getInputValue(elem);
    }
    setInputValue(elem, v);
    inputVariables[propName] = v;
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
    displayIconContext(false);
    displayNormalContext(false);
    refreshAllIconsPositions();
});

// Close context menu when background clicked
elemHolder.addEventListener('click', (e) => {
    if (e.target == elemHolder || e.target == elemContent || e.target == elemGrid){
        // holder clicked
        displayIconContext(false);
        if (e.button !== 2){
            displayNormalContext(false);
        }
    }
});


//!------------------------- ICON CONTEXT MENU -------------------------//


function displayIconContext(e, icon){
    // Open icon context menu

    if (e === false){
        // hide
        iconRightClicked = null;
        elemIconEdit.style.display = 'none';
        return;
    }

    displayNormalContext(false);

    // Position
    const screensx = window.innerWidth;
    const screensy = window.innerHeight;

    elemIconEdit.style.display = 'flex';

    let rectmenu = elemIconEdit.getBoundingClientRect();
    let menusx = rectmenu.right-rectmenu.left;
    let menusy = rectmenu.bottom-rectmenu.top;

    if (e.x<menusx){
        elemIconEdit.style.left = `${e.x}px`;
    } else {
        elemIconEdit.style.left = `${e.x-menusx}px`;
    }
    if (e.y>screensy-menusy){
        elemIconEdit.style.top = `${e.y-menusy}px`;
    } else {
        elemIconEdit.style.top = `${e.y}px`;
    }

    // Actions

    elemIconLabel.value = icon.label.innerText;
    setIconMenuActionType(icon.actionType);
    elemIconActionValue.value = icon.actionValue;
}

// Image
elemIconImage.onchange = (e) => {
    let reader = new FileReader();
    reader.onload = function(){
        let dataURL = reader.result;
        iconRightClicked.setImage(dataURL);
        iconRightClicked.save();
        displayIconContext(false);
    };
    reader.readAsDataURL(elemIconImage.files[0]);
};

// Text
elemIconLabel.addEventListener('change', (e) => {
    iconRightClicked.setText(elemIconLabel.value);
    iconRightClicked.save();
    displayIconContext(false);
}, false);

// Destroy
elemIconDel.addEventListener('click', () => {
    iconRightClicked.destroy();
    displayIconContext(false);
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


//!------------------------- NORMAL CONTEXT MENU -------------------------//

var contextpx = 0;
var contextpy = 0;

function displayNormalContext(e){
    elemNormalContext.style.display = e ? 'flex' : 'none';
    if (!e) return;

    contextpx = e.x;
    contextpy = e.y;

    displayIconContext(false);

    const screensx = window.innerWidth;
    const screensy = window.innerHeight;

    let rectmenu = elemNormalContext.getBoundingClientRect();
    let menusx = rectmenu.right-rectmenu.left;
    let menusy = rectmenu.bottom-rectmenu.top;

    if (e.x<menusx){
        elemNormalContext.style.left = `${e.x}px`;
    } else {
        elemNormalContext.style.left = `${e.x-menusx}px`;
    }
    if (e.y>screensy-menusy){
        elemNormalContext.style.top = `${e.y-menusy}px`;
    } else {
        elemNormalContext.style.top = `${e.y}px`;
    }
}

// ADD WIDGETS
function addWidget(ty, func){
    displayNormalContext(false);

    // Add widget on mouse
    let widget = new ty();

    const size = elemIconSize.offsetHeight;
    const anchor = getAnchorPoint();
    widget.setRelPos(
        (contextpx - anchor.x) / size * anchor.dx -.5,
        (contextpy - anchor.y) / size * anchor.dy -.5
    )
    widget.applyRelPos();
    if (func){
        func(widget);
    }
    widget.save();
}
elemBtnAddIcon.addEventListener('click', (e) => {
    addWidget(Icon, (icon) => {
        icon.setText('Unnamed');
        icon.setImage('placeholder.png');
    });
});
elemBtnAddText.addEventListener('click', (e) => {
    addWidget(Label, (icon) => {
        icon.setText('Lorem ipsum');
    });
});


//!-------------------------------- INIT ---------------------------------//


let bgimg = localStorage.getItem('bgimg');
if (bgimg){
    elemBackground.style.backgroundImage = `url('${atob(bgimg)}')`;
}

document.addEventListener('mousemove', (e) => {
    if (iconDragged){
        const anchor = getAnchorPoint();
        const size = elemIconSize.offsetHeight;
        const x = e.x - iconDragged.mdx + iconDragged.mox;
        const y = e.y - iconDragged.mdy + iconDragged.moy;
        iconDragged.elem.style.left = `${x}px`;
        iconDragged.elem.style.top  = `${y}px`;

        // Snapping preview
        if (inputVariables['iconsnapping']){
            elemIconPreview.style.display = 'flex';

            let ax = Math.floor((x - anchor.x)/size+.5)*size;
            let ay = Math.floor((y - anchor.y)/size+.5)*size;
            if (inputVariables['cornersnapping']){
                ax += size/2;
                ay += size/2;
            }

            elemIconPreview.style.left = `${ax + anchor.x}px`;
            elemIconPreview.style.top  = `${ay + anchor.y}px`;

            iconDragged.setRelPos(
                ax * anchor.dx /size,
                ay * anchor.dy /size,
            );
        } else {
            iconDragged.setRelPos(
                x/size * anchor.dx - anchor.x,
                x/size * anchor.dy - anchor.y,
            );
        }
    }
}, false);

document.addEventListener('mouseup', (e) => {
    if (iconDragged){
        iconDragged.applyRelPos();
        iconDragged.save();
    }
    stopIconDrag();
}, false);

showMenu(false);
stopIconDrag();
displayNormalContext(false);
displayIconContext(false);

loadSavedTab(currentTabName);

