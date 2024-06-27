
const elemCmdHolder = document.getElementById('elemCmdHolder');


const iconTerminal = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill="currentColor" d="M0 2.75C0 1.784.784 1 1.75 1h12.5c.966 0 1.75.784 1.75 1.75v10.5A1.75 1.75 0 0 1 14.25 15H1.75A1.75 1.75 0 0 1 0 13.25Zm1.75-.25a.25.25 0 0 0-.25.25v10.5c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25V2.75a.25.25 0 0 0-.25-.25ZM7.25 8a.75.75 0 0 1-.22.53l-2.25 2.25a.749.749 0 0 1-1.275-.326a.75.75 0 0 1 .215-.734L5.44 8L3.72 6.28a.749.749 0 0 1 .326-1.275a.75.75 0 0 1 .734.215l2.25 2.25c.141.14.22.331.22.53m1.5 1.5h3a.75.75 0 0 1 0 1.5h-3a.75.75 0 0 1 0-1.5"/></svg>`;

var filesData = {};
var terminalDragged;

const commandHelp = {
    'cls': 'Syntax: cls\nclears the output.',
    'help': 'Syntax: help [command*]\nDisplays the documentation of the given commands or all commands.',
    'touch': 'Syntax: touch [file name*]\nCreates a file with a given name'
};


function createElement(ty, parent, className){
    const elem = document.createElement(ty);
    if (className !== undefined){
        elem.className = className;
    } if (parent !== undefined){
        parent.appendChild(elem);
    }
    return elem;
} function createDiv(parent, className){
    return createElement('div', parent, className);
}

function removeEdgeSpaces(text){
    // remove first spaces
    while (text[0] === ' '){
        text = text.substring(1, text.length);
    }
    // remove trailing spaces
    while (text[text.length-1] === ' '){
        text = text.substring(0, text.length-1);
    }
    return text;
}

class TerminalCommand{
    constructor(text){
        this.raw = text;

        this.text = removeEdgeSpaces(text);
        this.args = this.text.split(' ');
        this.first = this.args.shift();
        this.textRight = this.args.join(' ');

        this.clearEmptyArgs();
    }

    clearEmptyArgs(){
        for (let i=this.args.length-1; i>-1; i--){
            if (this.args[i] == ''){
                this.args.splice(i, 1);
            }
        }
    }
}

class TerminalGui{
    constructor(parent){
        // Construct DOM elements

        this.elem = createDiv(undefined, 'cmd');
        this.elem.style.transform = 'scale(.9)';
        this.elem.style.opacity = '0';

        // Head
        this.elemHead = createDiv(this.elem, 'cmdhead flexx');
        this.iconHolder = createDiv(this.elemHead, 'fullChild');

        this.elemTitle = createDiv(this.elemHead);
        createDiv(this.elemHead).style.flexGrow = 1;

        this.elemBtnA = createDiv(this.elemHead, 'cmdbtn a');
        this.elemBtnB = createDiv(this.elemHead, 'cmdbtn b');
        this.elemBtnC = createDiv(this.elemHead, 'cmdbtn c');
        this.elemBtns = [this.elemBtnA, this.elemBtnB, this.elemBtnC];

        // Body
        const border = createDiv(this.elem);
        this.elemBody = createDiv(border, 'cmdbody');

        this.elemBar = createDiv(this.elemBody, 'flexx');
        this.elemPrefix = createDiv(this.elemBar);
        this.elemPrefix.style.whiteSpace = 'pre';
        this.elemPrefix.style.userSelect = 'none';
        this.elemPrefix.style.pointerEvents = 'none';
        this.elemInput = createElement('input', this.elemBar);
        this.elemInput.style.pointerEvents = 'none';
        this.elemBar.style.pointerEvents = 'none';

        if (parent){
            parent.appendChild(this.elem);
        }

        // Initialize

        this.setTitle('Terminal');
        this.setPrefix('/> ');
        this.setIcon(iconTerminal);

        const ter = this;

        function capture(e){
            if (e.target == ter.elemBody){
                ter.elemInput.focus();
            }
        }
        this.elemBody.addEventListener('click', capture);
        this.elemBody.addEventListener('mouseenter', capture);

        this.elemInput.addEventListener('keydown', (e) => {
            if (e.key === "Enter"){
                if (this.inputcallback){
                    const v = this.elemInput.value;
                    this.elemInput.value = '';
                    this.setPrefix('');
                    this.inputcallback(v);
                }
            }
        });
        this.elemBtnC.addEventListener('click', (e) => {
            ter.close();
        });

        this.elemHead.addEventListener('mousedown', function(e){
            terminalDragged = ter;
            ter.dragmx = e.x;
            ter.dragmy = e.y;
            ter.dragpx = ter.elem.offsetLeft;
            ter.dragpy = ter.elem.offsetTop;
        });

        requestAnimationFrame(() => {
            ter.elem.style.transform = '';
            ter.elem.style.opacity = '';
        });
    }

    // Dom elements
    
    setPosition(x, y){
        this.elem.style.left = `${x}px`;
        this.elem.style.top = `${y}px`;
    }
    setSize(x, y){
        this.elem.style.width = `${x}px`;
        this.elem.style.height = `${y}px`;
    }
    setCenterPosition(x, y){
        this.elem.style.left = `${x-this.elem.offsetWidth/2}px`;
        this.elem.style.top = `${y-this.elem.offsetHeight/2}px`;
    }

    setPrefix(text){
        this.elemPrefix.innerText = text;
    } setTitle(text){
        this.elemTitle.innerText = text;
    } setIcon(html){
        this.iconHolder.innerHTML = html;
    }

    // Utilities

    input(prefix, callback){
        this.setPrefix(prefix);
        this.elemInput.focus();
        this.inputcallback = callback;
    }
    print(text){
        const elem = document.createElement('div');
        elem.style.whiteSpace = 'pre';
        elem.innerText = text;

        this.elemBody.insertBefore(elem, this.elemBar);
        return elem;
    }
    destroy(){
        this.elem.remove();
    } close(){
        const ter = this;
        this.elem.style.transform = 'scale(.9)';
        this.elem.style.opacity = '0';
        this.elem.style.pointerEvents = 'none';
        setTimeout(() => {
            ter.destroy();
        }, 200);
    }

    getPrints(){
        var arr = Array.from(this.elemBody.children);
        const i = arr.indexOf(this.elemBar);
        arr.splice(i, 1);
        return arr;
    } getPrint(i){
        var elems = this.getPrints();
        if (i < 0){
            return elems[elems.length+i]; //ignore this.elemBar
        }
        return elems[i];
    } clearPrints(){
        const children = this.getPrints();
        children.map((elem) => {
            elem.remove();
        })
    }

    clearInput(){
        this.elemInput.value = '';
    }
}

class Terminal extends TerminalGui{
    constructor(parent){
        super(parent);

        this.pathArr = [];
        this.env = {};

        this.inputCycle();
        
    }

    getFullPath(){
        let s = '';
        for (let i = 0; i < this.pathArr.length; i++){
            s += '/' + this.pathArr[i];
        }
        return s + '/';
    }

    

    inputCycle(){
        const prefix = this.getFullPath()+'> ';
        this.input(prefix, (input) => {
            this.print(prefix + input);
            this.command(input);
            this.inputCycle();
        });
    }

    command(text){
        const cmd = new TerminalCommand(text);

        const funcname = 'cmd_' + cmd.first;
        if (this[funcname] === undefined){
            this.print(`Command "${cmd.first}" is not defined`);
        } else {
            this[funcname](cmd);
        }
    }

    cmd_cls(cmd){
        this.clearPrints();
    }
    cmd_help(cmd){
        if (cmd.args.length > 0){
            cmd.args.map((name) => {
                const funcname = 'cmd_' + name;
                if (name in commandHelp){
                    this.print(`- [${name}]: ${commandHelp[name]}`);
                } else if (this[funcname] === undefined){
                    this.print(`- [?]: Command "${name}" is not defined`);
                } else {
                    this.print(`- [i]: Command "${name}" does not have documentation`);
                }
            });
        } else {
            Object.keys(commandHelp).map((k) => {
                this.print(`- [${k}]: ${commandHelp[k]}`);
            });
        }
    }
    cmd_exit(cmd){
        this.close();
    }
    cmd_(cmd){
        // add space
        const elem = this.getPrint(-1);
        elem.remove();
        this.print(' ');
    }
    cmd_touch(cmd){
        let name = cmd.textRight;
        const relPos = findEmptyCellPlacement();
        
        if (relPos === undefined){
            relPos = [Math.random()*3, Math.random()*3];
        } if (name == ''){
            name = 'Unnamed';
        }

        // Create widget
        const widget = new Icon();
        widget.setText(name);
        widget.setImage('iconUnknown.svg');
        widget.setRelPos(relPos[0], relPos[1]);
        widget.applyRelPos();
        widget.save();
        
        this.print(`File "${name}" created successfully.`);
    }
}

function getDirectoryData(pathArr){
    // Returns the directory
    let dir = filesData;
    for (let i = 0; i < pathArr.length; i++){
        const name = pathArr[i];
        if (dir[name] === undefined){
            pathArr = pathArr.slice(0, i);
            break;
        } else {
            dir = dir[name];
        }
    }
    return dir;
}


document.addEventListener('mousemove', (e) => {
    if (terminalDragged){
        terminalDragged.setPosition(
            e.x - terminalDragged.dragmx + terminalDragged.dragpx,
            e.y - terminalDragged.dragmy + terminalDragged.dragpy,
        )
    }
});
document.addEventListener('mouseup', (e) => {
    if (terminalDragged){
        terminalDragged = null
    }
});


