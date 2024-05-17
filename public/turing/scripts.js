
const elemTuringOffset = document.getElementById("turingOffset");
const elemRulesHolder = document.getElementById("elemRulesHolder");
const elemRuleAdd = document.getElementById("elemRuleAdd");
const elemTuringState = document.getElementById("elemTuringState");
const elemTuringPos = document.getElementById("elemTuringPos");

const elemControlPrevious = document.getElementById("elemControlPrevious");
const elemControlPause = document.getElementById("elemControlPause");
const elemControlPlay = document.getElementById("elemControlPlay");

const elemDataDefault = document.getElementById("elemDataDefault");
const elemDataCurrent = document.getElementById("elemDataCurrent");
const elemDefaultPos = document.getElementById("elemDefaultPos");
const elemDefaultState = document.getElementById("elemDefaultState");

const elemTuringHolder = document.getElementById("turingHolder");

const elemControlGoto = document.getElementById("elemControlGoto");
const elemInputGoto = document.getElementById("elemInputGoto");
const elemInputSpeed = document.getElementById("elemInputSpeed");

const elemParallax0 = document.getElementById("parallax0");
const elemParallax1 = document.getElementById("parallax1");

var turingRules = {};
var currentData = [];
var defaultData = [];

var currentPos = 0;
var currentState = 0;
var currentStep = 0;
var currentHeading = 0;
var defaultPos = 0;
var defaultState = 0;

var playing = false;
var lastStep = 0;
var stepCool = 500;
var stepSpeed = 1;

var currentPosAnim = currentPos;

var delta = 1/60;
var oldTime = 0;
var cursorSpeed = 20;
var visibleCells = 9;

var holderCellsChildren = Array.from(elemTuringHolder.children);
var holderCellsChildrenText = [];

//const baseUrl = window.location.origin + window.location.pathname;
var urlSave = new URL(window.location.href);

function saveRules(){
    //localStorage.setItem("rules", JSON.stringify(turingRules));
    urlSave.searchParams.set('r', encodeURIComponent(JSON.stringify(turingRules)));
    urlEncode();
} function saveDefaultData(){
    //localStorage.setItem("defdata", JSON.stringify(defaultData));
    urlSave.searchParams.set('d', encodeURIComponent(JSON.stringify(defaultData)));
    urlEncode();
}

function saveDefaultCursor(){
    //localStorage.setItem("defstate", defaultState);
    //localStorage.setItem("defpos", defaultPos);
    //localStorage.setItem("speed", stepSpeed);
    urlSave.searchParams.set('s', encodeURIComponent(defaultState));
    urlSave.searchParams.set('p', defaultPos);
    urlSave.searchParams.set('t', stepSpeed);
    urlEncode();
}

function rebuildRules(){
    Object.keys(turingRules).map((k) => {
        const v = turingRules[k];
        const ks = k.split(";");
        buildRuleElement(ks[0], ks[1], v[0], v[1], v[2], false);
    });
}

/*
function retrieveLocalStorageData(){
    const saveRules = localStorage.getItem("rules");
    if (saveRules){
        turingRules = JSON.parse(saveRules);
        rebuildRules();
    }

    const saveDefData = localStorage.getItem("defdata");
    if (saveDefData){
        defaultData = JSON.parse(saveDefData);
        elemDataDefault.value = defaultData.join(',');
        setCurrentData(defaultData);
    }

    const saveDefState = localStorage.getItem("defstate");
    if (saveDefState){
        elemDefaultState.value = saveDefState;
        defaultState = saveDefState;
        setCurrentState(defaultState);
    } const saveDefPos = localStorage.getItem("defpos");
    if (saveDefPos){
        elemDefaultPos.value = saveDefPos;
        defaultPos = parseInt(saveDefPos);
        setCurrentPos(defaultPos);
    } const saveSpeed = localStorage.getItem("speed");
    if (saveSpeed){
        elemInputSpeed.value = saveSpeed;
        stepSpeed = parseInt(saveSpeed) || 1;
    }
}
*/

elemInputSpeed.addEventListener("input", () => {
    stepSpeed = parseInt(elemInputSpeed.value) || 1;
    saveDefaultCursor()
});

function buildRuleElement(a,b,c,d,e, save = true){
    const inner = `
    <div class="flexx alt-gap05">
        <input type="text" placeholder="cell"  id="inputCell"></input>
        <input type="text" placeholder="state" id="inputState"></input>
    </div>
    <div>➤</div>
    <div class="flexx alt-gap05">
        <input type="text" placeholder="cell"      id="outputCell"></input>
        <input type="text" placeholder="state"     id="outputState"></input>
        <input type="number" placeholder="heading" id="outputHeading"></input>
    </div>
    <button>
        <img src="/assets/images/iconClose.png" id="btnDel">
    </button>
    `;
    const child = document.createElement("div");
    child.className = "rad prim flexx space";
    child.innerHTML = inner;

    const elemClose = child.querySelector("#btnDel");
    const inputCell = child.querySelector("#inputCell");
    const inputState = child.querySelector("#inputState");
    const outputCell = child.querySelector("#outputCell");
    const outputState = child.querySelector("#outputState");
    const outputHeading = child.querySelector("#outputHeading");

    inputCell.value = a || '';
    inputState.value = b || '';
    outputCell.value = c || '';
    outputState.value = d || '';
    outputHeading.value = e || '';

    let oldKey;

    elemClose.addEventListener("click", () => {
        elemRulesHolder.removeChild(child);
        delete turingRules[oldKey];
        saveRules();
    });

    function ruleChanged(save){
        delete turingRules[oldKey];

        oldKey = inputCell.value + ";" + inputState.value;
        const v = [outputCell.value, outputState.value, parseInt(outputHeading.value || 0)];

        turingRules[oldKey] = v;
        if (save){
            saveRules();
        }
    }

    inputCell.addEventListener("input", ruleChanged);
    inputState.addEventListener("input", ruleChanged);
    outputCell.addEventListener("input", ruleChanged);
    outputState.addEventListener("input", ruleChanged);
    outputHeading.addEventListener("input", ruleChanged);
    ruleChanged(save);

    elemRulesHolder.appendChild(child);
    return child;
}

function addEmptyRule(){
    buildRuleElement();
}


elemRuleAdd.addEventListener("click", addEmptyRule);
elemDataDefault.addEventListener("input", () => {
    const text = elemDataDefault.value;
    defaultData = text.split(",");
    setCurrentData(defaultData);
    saveDefaultData();
})

function turingStop(){
    setPlaying(false);
    refreshCurrentData();
}

elemControlPlay.addEventListener("click", () => {
    setPlaying(true);
});
elemControlPause.addEventListener("click", turingStop);
elemControlPrevious.addEventListener("click", () => {
    setPlaying(false);
    currentStep = 0;
    setCurrentPos(defaultPos);
    setCurrentState(defaultState);
    setCurrentData(defaultData);
});

elemDefaultState.addEventListener("input", () => {
    defaultState = elemDefaultState.value;
    saveDefaultCursor();
}); elemDefaultPos.addEventListener("input", () => {
    defaultPos = parseInt(elemDefaultPos.value);
    saveDefaultCursor();
});

function enterPressed(elem, callback){
    elem.addEventListener("keyup", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            callback();
        }
    })
}

function setPlaying(v, save = true){
    playing = v;
    elemControlPlay.style.opacity = playing ? '.2' : '1';
    elemControlPause.style.opacity = playing ? '1' : '.2';
    if (save){
        urlSave.searchParams.set('f', playing ? 1 : 0);
        urlEncode();
    }
}

function btnGoto(){
    setCurrentPos(elemInputGoto.value || 0);
}
elemControlGoto.addEventListener("click", btnGoto);
enterPressed(elemInputGoto, btnGoto);



function setCurrentData(v){
    currentData = [...v];
    refreshCurrentData();
} function refreshCurrentData(){
    elemDataCurrent.value = currentData.join(',');
}
function setCurrentState(v){
    currentState = v;
    elemTuringState.innerText = "state: "+v;
} function setCurrentPos(v){
    currentPos = v;
    elemTuringPos.innerText = "x: "+v;
}



function turingStep(){
    
    let cell = '';
    if (currentPos > -1 && currentPos < currentData.length){
        cell = currentData[currentPos];
    }
    const key = cell + ";" + currentState;
    const res = turingRules[key];
    if (res != undefined){
        currentData[currentPos] = res[0];
        setCurrentState(res[1]);
        currentHeading = res[2] || 0;
    }

    if (currentState == "end" || currentState == "stop"){
        turingStop();
    }

    setCurrentPos(currentPos + currentHeading);
}

function lerp(a,b,t){
    return a+(b-a)*t;
}


function initHolderCellsChildrenText(){
    holderCellsChildren.map((elem) => {
        holderCellsChildrenText.push(elem.children[0]);
    })
}

function refreshTuringBand(centerInt){
    for (let i=0; i<holderCellsChildren.length; i++){
        const elemCell = holderCellsChildren[i];
        const elemText = holderCellsChildrenText[i];

        const vi = i+centerInt - Math.ceil(visibleCells/2);
        if (vi > -1 && vi < currentData.length){
            elemText.innerText = currentData[vi];
        } else {
            elemText.innerText = '';
        }
    }
}

function parallaxBackground(elem, factor = 1){
    const screenHeight = window.innerHeight;
    var pageHeight = (document.height !== undefined) ? document.height : document.body.offsetHeight;
    const scrollRel = window.scrollY / (pageHeight - screenHeight);

    const imgHeight = elem.offsetHeight;
    const dif = imgHeight - screenHeight;

    elem.style.transform = `translate(0, ${-dif * scrollRel * factor}px)`;
}

function cycle(time){
    delta = (time-oldTime)/1000;
    oldTime = time;

    if (playing && Date.now()>lastStep){
        lastStep = Date.now() + stepCool / stepSpeed;
        turingStep();
    }

    // Refresh turing band cells text

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    currentPosAnim = lerp(currentPosAnim, currentPos, Math.min(delta * cursorSpeed, 1));
    const offset = -innerWidth / visibleCells * (currentPosAnim%1);
    elemTuringOffset.style.transform = `translate(calc(${offset}px), 0)`;

    refreshTuringBand(Math.floor(currentPosAnim));

    // refresh parallax backgrounds
    parallaxBackground(elemParallax1, .5);
    parallaxBackground(elemParallax0, .2);

    requestAnimationFrame(cycle);
}

function urlEncode(){
    window.history.replaceState(null, null, urlSave.search);
}

function getUrlData(){
    const urlParams = new URLSearchParams(window.location.search);
    let urlRules = urlParams.get('r');
    let urldata = urlParams.get('d');
    let urldefstate = urlParams.get('s');
    let urldefpos = urlParams.get('p');
    let urldefspeed = urlParams.get('t');
    let urlplaying = urlParams.get('f');

    if (urlRules){
        urlRules = decodeURIComponent(urlRules);
        turingRules = JSON.parse(urlRules);
        rebuildRules();
    }
    if (urldata){
        urldata = decodeURIComponent(urldata);
        defaultData = JSON.parse(urldata);
        elemDataDefault.value = defaultData.join(',');
        setCurrentData(defaultData);
    }
    if (urldefstate){
        urldefstate = decodeURIComponent(urldefstate);
        defaultState = urldefstate;
        setCurrentState(defaultState);
    }
    if (urldefpos){
        elemDefaultPos.value = urldefpos;
        defaultPos = parseInt(urldefpos);
        setCurrentPos(defaultPos);
    }
    if (urldefspeed){
        elemInputSpeed.value = urldefspeed;
        stepSpeed = parseInt(urldefspeed) || 1;
    }
    setPlaying(urlplaying == 1, false);

    // ensure same url
    // urlEncode();
}


setPlaying(false, false);
initHolderCellsChildrenText();
//retrieveLocalStorageData();
getUrlData();
requestAnimationFrame(cycle);

/*


#,1,0,0,1,1,#



*/
/*
data = ['#',1,0,0,1,1,'#']

# data, state
rules = {
    (1, 0):   (1, 0, 1),
    (0, 0):   (0, 0, 1),
    ('#', 0): ('#', 1, -1),
    (1, 1):   (0, 1, -1),
    (0, 1):   (1, 2),
    ('#', 1): (1, 2),
}

*/