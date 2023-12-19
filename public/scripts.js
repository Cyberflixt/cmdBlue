

//const scrollElems = document.querySelectorAll('[data-scroll-event]');

const scrollElemsDynamic = false;
var scrollElems = Array.from(document.getElementsByClassName('scrollevent'));
scrollElems.push(document.body);





function refreshScrollElems(){
    if (scrollElemsDynamic){
        scrollElems = Array.from(document.getElementsByClassName('scrollevent'));
    }
    const y = Math.floor(window.scrollY);
    scrollElems.map((elem) => {
        elem.dataset.scroll = y;
    });
}
function getUnitList(ma, res){
    let s = "0";
    for (let i=res; i<ma; i+=res){
        s += " "+i.toString();
    }
    return s;
}
function mainScroll(){
    // Set scrolli list in VH units

    const res = 2;

    const vmin = Math.min(window.innerHeight, window.innerWidth);

    const maxVh = Math.floor(window.scrollY/window.innerHeight*100);
    const maxVw = Math.floor(window.scrollY/window.innerWidth*100);
    const maxVmin = Math.floor(window.scrollY/vmin*100);

    document.body.dataset.scrollvh = getUnitList(maxVh, res);
    document.body.dataset.scrollvw = getUnitList(maxVw, res);
    document.body.dataset.scrollvmin = getUnitList(maxVmin, res);
}

function cycle(){
    mainScroll();
    refreshScrollElems();
    requestAnimationFrame(cycle);
}

document.addEventListener("DOMContentLoaded", () => {
    requestAnimationFrame(cycle);
});
