
//import dict from './jsondata.json' assert {type: 'json'};

const dict = undefined;

const wordNature = document.getElementById('wordNature');
const wordTitle = document.getElementById('wordTitle');
const wordDef = document.getElementById('wordDef');
const topBar = document.getElementById('topBar');

const apiUrl = "https://api.dictionaryapi.dev/api/v2/entries/en/";

const randomNumber = (maxNumber) => { 
	return Math.ceil(Math.random() * maxNumber);
}

function clearSelection(){
	if (window.getSelection) {window.getSelection().removeAllRanges();}
	else if (document.selection) {document.selection.empty();}
}

function httpGetAsync(url, callback, callbackErr) {
	var xmlHttp = new XMLHttpRequest();
	xmlHttp.onreadystatechange = function() {
		if (xmlHttp.readyState == 4) {
			if (xmlHttp.status == 200) {
				callback(xmlHttp.responseText);
			} else {
				if (callbackErr){
					callbackErr();
				}
			}
		}
	}
	xmlHttp.open("GET", url, true); // true for asynchronous
	xmlHttp.send(null);
}
function httpPostAsync(url, data, callback, errCallback) {
	var xmlHttp = new XMLHttpRequest();
	xmlHttp.onreadystatechange = function() {
		if (xmlHttp.readyState == 4) {
			if (xmlHttp.status == 200){
				callback(xmlHttp.responseText);
			} else {
				if (errCallback){
					errCallback(xmlHttp.responseText)
				}
			}
		}
	}
	xmlHttp.open("POST", url, true);
	xmlHttp.setRequestHeader('Content-Type', 'application/json');
	try{
		xmlHttp.send(JSON.stringify(data));
	}catch(err){
		if (errCallback){
			errCallback(err);
		}
	}
}

function showWord(word, nature, def){
	wordTitle.innerHTML = word;
	wordNature.innerHTML = nature;
	wordDef.innerHTML = def;

    let hist = document.createElement('div');
    hist.innerText = word;
    topBar.appendChild(hist);

    hist.addEventListener('click', (e) => {
        showWord(word, nature, def);
    })
}

wordDef.onclick = function(e){
    // Getting clicked word

	let s = window.getSelection();
	var range = s.getRangeAt(0);
	var node = s.anchorNode;

	// Find starting point
	try{
		while(range.toString().indexOf(' ') != 0) { 
			range.setStart(node,(range.startOffset -1));
		}
		range.setStart(node, range.startOffset+1);
	} catch(exceptionVar) {}

	// Find ending point
	try{
		do {
			range.setEnd(node,range.endOffset+1);
		} while (
			(
				(range.toString().indexOf(' ')==-1)&&
				(range.toString().indexOf('!')==-1)&&
				(range.toString().indexOf('/')==-1)&&
				(range.toString().indexOf('?')==-1)&&
				(range.toString().indexOf(';')==-1)&&
				(range.toString().indexOf(':')==-1)&&
				(range.toString().indexOf(',')==-1)&&
				(range.toString().indexOf('.')==-1)&&
				(range.toString().indexOf('(')==-1)&&
				(range.toString().indexOf(')')==-1)
			)
			&& range.toString().trim() != ''
		);
		range.setEnd(node,range.endOffset-1);
	} catch(exceptionVar) {}
    
    // Get selected word
	const word = range.toString().trim();
	clearSelection();

	httpGetAsync(apiUrl + word, function(r){
		const data = JSON.parse(r);
		let desc = data[0].meanings[0]["definitions"][0]["definition"]
		if (data[0].meanings.length>1){
			let i = 0;
			data[0].meanings.map(meaning => {
				i+=1;
				if (i>1){
					//desc = desc.concat("\n\n").concat(meaning["partOfSpeech"]).concat(": ").concat(meaning["definitions"][0]["definition"])
                    desc += `\n\n${meaning["partOfSpeech"]}: ${meaning["definitions"][0]["definition"]}`;
                }
			})
		}
		showWord(word,
			data[0].meanings[0]["partOfSpeech"],
			desc,
		);
	}, function(){
		console.log("Word data not found");
	})
};

if (dict === undefined){
	showWord('title','noun','this is an example def.');
} else {
	const i = randomNumber(dict.length);
	const e = dict[i];
	showWord(e[0],e[1],e[2]);
}

