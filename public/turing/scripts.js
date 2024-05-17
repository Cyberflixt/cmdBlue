
const elemTuringOffset = document.getElementById("turingOffset");
const elemRulesHolder = document.getElementById("elemRulesHolder");
const elemRuleAdd = document.getElementById("elemRuleAdd");
const elemTuringState = document.getElementById("elemTuringState");

const elemControlPrevious = document.getElementById("elemControlPrevious");
const elemControlPause = document.getElementById("elemControlPause");
const elemControlPlay = document.getElementById("elemControlPlay");

var turingRules = {};

function buildRuleElement(){
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

    let oldKey;

    elemClose.addEventListener("click", () => {
        elemRulesHolder.removeChild(child);
        delete turingRules[oldKey];
    });

    function ruleChanged(){
        delete turingRules[oldKey];

        oldKey = inputCell.value + ";" + inputState.value;
        const v = [outputCell.value, outputState.value, outputHeading.value];

        turingRules[oldKey] = v;
        console.log(turingRules);
    }

    inputCell.addEventListener("input", ruleChanged);
    inputState.addEventListener("input", ruleChanged);
    outputCell.addEventListener("input", ruleChanged);
    outputState.addEventListener("input", ruleChanged);
    outputHeading.addEventListener("input", ruleChanged);

    elemRulesHolder.appendChild(child);
    return child;
}

function addRule(){
    buildRuleElement();
}

elemRuleAdd.addEventListener("click", addRule);

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