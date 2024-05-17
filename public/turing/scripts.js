
const elemTuringOffset = document.getElementById("turingOffset");
const elemRulesHolder = document.getElementById("elemRulesHolder");
const elemRuleAdd = document.getElementById("elemRuleAdd");
const elemTuringState = document.getElementById("elemTuringState");

const elemControlPrevious = document.getElementById("elemControlPrevious");
const elemControlPause = document.getElementById("elemControlPause");
const elemControlPlay = document.getElementById("elemControlPlay");

const elemDataDefault = document.getElementById("elemDataDefault");
const elemDataCurrent = document.getElementById("elemDataCurrent");
const elemDataCopy = document.getElementById("elemDataCopy");

var turingRules = {};
var currentData = [];
var defaultData = [];
var currentPos = 0;
var currentState = 0;
var defaultPos = 0;

var playing = false;
var lastStep = 0;
var stepCool = 1000;


function saveRules(){
    localStorage.setItem("rules", JSON.stringify(turingRules));
}
function retrieveRules(){
    const save = localStorage.getItem("rules");
    if (save){
        turingRules = JSON.parse(save);
        rebuildRules();
    }
}
function rebuildRules(){
    console.log(turingRules);
    Object.keys(turingRules).map((k) => {
        const v = turingRules[k];
        const ks = k.split(";");
        buildRuleElement(ks[0], ks[1], v[0], v[1], v[2]);
    });
}

function buildRuleElement(a,b,c,d,e){
    const inner = `
    <div class="flexx">
        <input type="text" placeholder="cell"  id="inputCell"></input>
        <input type="text" placeholder="state" id="inputState"></input>
    </div>
    <div>➤</div>
    <div class="flexx">
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

    function ruleChanged(){
        delete turingRules[oldKey];

        oldKey = inputCell.value + ";" + inputState.value;
        const v = [outputCell.value, outputState.value, outputHeading.value];

        turingRules[oldKey] = v;
        saveRules();
    }

    inputCell.addEventListener("input", ruleChanged);
    inputState.addEventListener("input", ruleChanged);
    outputCell.addEventListener("input", ruleChanged);
    outputState.addEventListener("input", ruleChanged);
    outputHeading.addEventListener("input", ruleChanged);
    ruleChanged();

    elemRulesHolder.appendChild(child);
    return child;
}

function addRule(){
    buildRuleElement();
}

function setCurrentData(v){
    currentData = v;
    elemDataCurrent.value = v.join(',');
}

elemRuleAdd.addEventListener("click", addRule);
elemDataDefault.addEventListener("input", () => {
    const text = elemDataDefault.value;
    defaultData = text.split(",");
    setCurrentData(defaultData);
})



elemControlPlay.addEventListener("click", () => {
    playing = true;
}); elemControlPause.addEventListener("click", () => {
    playing = false;
}); elemControlPrevious.addEventListener("click", () => {
    playing = false;
    currentPos = 0;
    currentData = defaultData;
});


function turingStep(){
    const cell = '';
    if (currentPos > -1 && currentPos < currentData.length){
        cell = currentData[currentPos];
    }
    const key = cell + ";" + currentState;
    const v = turingRules[key];
    if (v != undefined){
        currentData[currentPos] = v[0];
        currentState = v[1];
        currentPos += v[2];
    }
    console.log(currentData);
}

function cycle(){
    if (playing && Date.now()>lastStep){
        lastStep = Date.now() + stepCool;
        turingStep();
    }
    requestAnimationFrame(cycle);
}

retrieveRules();
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


def turing(data, rules, pos = 1, state = 0):
    cur = (data[pos], state)
    if cur in rules:
        res = rules[cur]
        offset = 0
        if len(res)>2:
            offset = res[2]

        data[pos] = res[0]
        turing(data, rules, pos+offset, res[1])
    return data
        


print(turing(data, rules, 1, 0))
*/