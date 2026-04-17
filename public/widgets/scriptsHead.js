
/* Theme */

let themeIndex = localStorage.getItem("theme");
if (themeIndex == undefined){
    themeIndex = 0;
}

function setTheme(index, init){
    themeIndex = index;
    document.documentElement.setAttribute('data-theme', index);

    if (!init){
        localStorage.setItem("theme", index);
        document.documentElement.setAttribute('data-theme-changed', true);

        renderAllSavedWidgets();
    }
}

function toggleTheme(){
    setTheme(themeIndex == 0 ? 1 : 0, false);
}
setTheme(themeIndex, true);

