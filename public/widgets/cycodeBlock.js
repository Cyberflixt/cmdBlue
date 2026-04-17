
var elemHighlightsMap = new Map();

function compareNumbers(a, b) {
  return a - b;
}



function format(elem){
    // Get or create highlights element
    let elemHighlights;
    if (elemHighlightsMap.has(elem)){
        elemHighlights = elemHighlightsMap.get(elem);
    } else {
        elemHighlights = document.createElement("pre");
        elemHighlights.className = "codeblockHighlights";
        elem.parentNode.appendChild(elemHighlights);
        elemHighlightsMap.set(elem, elemHighlights);
    }

    let text = elem.value ?? elem.innerText;

    let indicesStart = [];
    let indicesEnd = [];
    let indicesStartTag = new Map();

    function isIndexTagged(index){
        for (let i = 0; i < indicesStart.length; i++){
            if (index >= indicesStart[i] && index < indicesEnd[i])
                return true;
        }
        return false;
    }

    function applyRegex(tag, regex, noNest = false){
        text.replace(regex, function(match, indexStart) {
            const indexEnd = indexStart + match.length;
            if (!indicesStart.includes(indexStart) && !indicesEnd.includes(indexEnd)){
                if (noNest && isIndexTagged(indexStart)){
                    return;
                }
                indicesStart.push(indexStart);
                indicesEnd.push(indexEnd);
                indicesStartTag.set(indexStart, tag);
            }
        });
    }

    // Hell
    applyRegex("function", /(?:[A-Za-z])[a-zA-Z0-9\$_-]+(?=\()/g);
    applyRegex("parenthesis", /[\(\)\{\}]/g);
    applyRegex("keyword", /new(?=\s)/g);
    applyRegex("keyword", /let(?=\s)/g);
    applyRegex("keyword", /const(?=\s)/g);
    applyRegex("keyword", /var(?=\s)/g);
    applyRegex("keyword", /if(?=\s)/g);
    applyRegex("keyword", /else(?=\s)/g);
    applyRegex("keyword", /function(?=\s)/g);
    applyRegex("string", /"[^"]+"/g);
    applyRegex("number", /(?<=[^a-zA-Z])[0-9]+(?:\.[0-9]+)?/g);
    applyRegex("comments", /\/\/.*/g);
    applyRegex("variable", /[A-z][A-z0-9]*/g, true);
    
    
    
    // Apply tags
    indicesStart.sort(compareNumbers);
    indicesEnd.sort(compareNumbers);

    // Start at the end
    const classNameBase = "code-";
    for (let i = indicesStart.length-1; i >= 0; i--){
        const className = classNameBase + indicesStartTag.get(indicesStart[i]);
        text = text.slice(0, indicesEnd[i]) + "</span class=\""+className+"\">" + text.slice(indicesEnd[i]);
        text = text.slice(0, indicesStart[i]) + "<span class=\""+className+"\">" + text.slice(indicesStart[i]);
    }


    elemHighlights.innerHTML = text;

    
}





function registerCodeElement(elem){
    elem.addEventListener("input", function() {
        format(elem);
    }, false);
    format(elem);

    const btnExec = elem.parentNode.getElementsByClassName("btnExecCode")[0];
    if (btnExec){
        btnExec.addEventListener("click", () => {
            const code = elem.value ?? elem.innerText;
            let r = eval(code);
            console.log("Eval return:", r);
        });
    }
}

const blocks = document.getElementsByClassName("codeformat");
for (let i = 0; i < blocks.length; i++){
    registerCodeElement(blocks[i]);
}
