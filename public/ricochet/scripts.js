import * as PIXI from "https://cdn.jsdelivr.net/npm/pixi.js@8.13.2/dist/pixi.min.mjs";

const elemCanvasGrid = document.getElementById('canvasGrid');
const btnHideSidebar = document.getElementById("btnHideSidebar");
const elemSidebar = document.getElementById("sidebar");

const app = new PIXI.Application();
PIXI.TextureStyle.defaultOptions.scaleMode = 'nearest';

// Tile type constants
const TILE_TYPES = {
    EMPTY: 0,
    SOLID: 1,
    WEDGE: 2,
    BREAKABLE: 3,
};

function lerp(a,b,t)
{
    return a + (b-a) * t;
}

let mouseX = 0;
let mouseY = 0;
let tickerDelta = 0;

let sidebarHidden = false;

// Asynchronous IIFE
(async () => {
    await setup();

    // Load textures
    const textures = {
        gridBg: await PIXI.Assets.load("assets/gridBg.png"),
        [TILE_TYPES.SOLID]: await PIXI.Assets.load("assets/BlockSolid.png"),
        [TILE_TYPES.WEDGE]: await PIXI.Assets.load("assets/BlockWedge.png"),
        [TILE_TYPES.BREAKABLE]: await PIXI.Assets.load("assets/BlockBreakable.png"),
    };
    
    const gridBgSprite = new PIXI.TilingSprite({
        texture: textures.gridBg,
        width: app.screen.width,
        height: app.screen.height,
    });
    app.stage.addChild(gridBgSprite);
    
    // Create a container for all tiles
    const grid = new PIXI.Container();
    app.stage.addChild(grid);
    
    // Constants
    const TILE_SIZE = 32;
    const GRID_W = 1000; // Very large grid
    const GRID_H = 1000;
    
    // Grid data - stores tile types (int values)
    const gridData = Array(GRID_H).fill(null).map(() => Array(GRID_W).fill(TILE_TYPES.EMPTY));
    
    // Initialize with some random tiles
    for (let i = 0; i < 5000; i++) {
        const x = Math.floor(Math.random() * GRID_W);
        const y = Math.floor(Math.random() * GRID_H);
        gridData[y][x] = Math.random() > 0.5 ? TILE_TYPES.SOLID : TILE_TYPES.BREAKABLE;
    }
    
    // Sprite pool - only stores currently visible sprites
    const spritePool = new Map(); // key: "x,y", value: sprite
    
    // Camera state
    let dragging = false;
    let dragMX = 0;
    let dragMY = 0;
    let dragCamX = 0;
    let dragCamY = 0;
    let cameraX = 0;
    let cameraY = 0;
    let cameraZoom = 1;
    
    // Dragging tile state
    let draggedTileType = null;
    let draggedSprite = null;
    
    function getGridCoords(screenX, screenY) {
        const worldX = (screenX - cameraX) / cameraZoom;
        const worldY = (screenY - cameraY) / cameraZoom;
        const gridX = Math.floor(worldX / TILE_SIZE);
        const gridY = Math.floor(worldY / TILE_SIZE);
        return { gridX, gridY };
    }
    function gridToScreenCoords(gridX, gridY) {
        const worldX = (gridX + .5) * TILE_SIZE * cameraZoom + cameraX;
        const worldY = (gridY + .5) * TILE_SIZE * cameraZoom + cameraY;
        return [ worldX, worldY ];
    }
    
    function setTile(gridX, gridY, tileType) {
        if (gridX < 0 || gridX >= GRID_W || gridY < 0 || gridY >= GRID_H) return;
        gridData[gridY][gridX] = tileType;
        updateVisibleTiles();
    }
    
    function getTile(gridX, gridY) {
        if (gridX < 0 || gridX >= GRID_W || gridY < 0 || gridY >= GRID_H) return TILE_TYPES.EMPTY;
        return gridData[gridY][gridX];
    }
    
    function updateVisibleTiles() {
        // Calculate visible tile range with padding
        const padding = 2;
        const minX = Math.max(0, Math.floor(-cameraX / cameraZoom / TILE_SIZE) - padding);
        const maxX = Math.min(GRID_W, Math.ceil((app.screen.width - cameraX) / cameraZoom / TILE_SIZE) + padding);
        const minY = Math.max(0, Math.floor(-cameraY / cameraZoom / TILE_SIZE) - padding);
        const maxY = Math.min(GRID_H, Math.ceil((app.screen.height - cameraY) / cameraZoom / TILE_SIZE) + padding);
        
        // Track which sprites should exist
        const shouldExist = new Set();
        
        // Create/update sprites for visible tiles
        for (let y = minY; y < maxY; y++) {
            for (let x = minX; x < maxX; x++) {
                const tileType = gridData[y][x];
                if (tileType === TILE_TYPES.EMPTY) continue;
                
                const key = `${x},${y}`;
                shouldExist.add(key);
                
                if (!spritePool.has(key)) {
                    // Create new sprite
                    const sprite = new PIXI.Sprite(textures[tileType]);
                    sprite.x = x * TILE_SIZE;
                    sprite.y = y * TILE_SIZE;
                    sprite.width = TILE_SIZE;
                    sprite.height = TILE_SIZE;
                    sprite.eventMode = 'static';
                    sprite.cursor = 'pointer';
                    
                    // Store grid coords on sprite for easy access
                    sprite.gridX = x;
                    sprite.gridY = y;
                    
                    // Click to pick up tile
                    sprite.on('pointerdown', (e) => {
                        if (e.button === 0) { // Left click
                            draggedTileType = getTile(sprite.gridX, sprite.gridY);
                            setTile(sprite.gridX, sprite.gridY, TILE_TYPES.EMPTY);
                            
                            // Create visual feedback sprite
                            draggedSprite = new PIXI.Sprite(textures[draggedTileType]);
                            draggedSprite.alpha = 0.7;
                            draggedSprite.anchor.set(0.5);

                            const [ screenX, screenY ] = gridToScreenCoords(sprite.gridX, sprite.gridY);
                            draggedSprite.width = TILE_SIZE * cameraZoom;
                            draggedSprite.height = TILE_SIZE * cameraZoom;
                            draggedSprite.x = screenX;
                            draggedSprite.y = screenY;

                            app.stage.addChild(draggedSprite);
                            
                            e.stopPropagation();
                        }
                    });
                    
                    grid.addChild(sprite);
                    spritePool.set(key, sprite);
                }
            }
        }
        
        // Remove sprites that are no longer visible
        for (const [key, sprite] of spritePool) {
            if (!shouldExist.has(key)) {
                sprite.destroy();
                spritePool.delete(key);
            }
        }
    }
    
    // Mouse/touch events
    app.view.addEventListener("pointerdown", (e) => {
        if (e.button === 0 && !draggedTileType) { // Left click for dragging camera
            dragging = true;
            dragMX = e.clientX;
            dragMY = e.clientY;
            dragCamX = cameraX;
            dragCamY = cameraY;
        }
    });
    
    app.view.addEventListener("pointerup", (e) => {
        if (e.button === 0) {
            dragging = false;
            
            // Drop tile if we're dragging one
            if (draggedTileType) {
                const { gridX, gridY } = getGridCoords(e.clientX, e.clientY);
                setTile(gridX, gridY, draggedTileType);
                
                if (draggedSprite) {
                    draggedSprite.destroy();
                    draggedSprite = null;
                }
                draggedTileType = null;
            }
        } else if (e.button === 2) { // Right click to delete
            const { gridX, gridY } = getGridCoords(e.clientX, e.clientY);
            setTile(gridX, gridY, TILE_TYPES.EMPTY);
        }
    });
    
    app.view.addEventListener("pointerleave", () => {
        dragging = false;
    });
    
    app.view.addEventListener("pointermove", (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;

        if (dragging) {
            cameraX = e.clientX - dragMX + dragCamX;
            cameraY = e.clientY - dragMY + dragCamY;
            OnCameraMoved();
        }
    });

    function updateDraggedSprite(delta)
    {
        // Update dragged sprite position
        if (draggedSprite)
        {
            // Snap to nearest cell
            const { gridX, gridY } = getGridCoords(mouseX, mouseY);
            const [ snapX, snapY ] = gridToScreenCoords(gridX, gridY);
            
            const speed = 20 * delta;
            draggedSprite.x = lerp(draggedSprite.x, snapX, speed);
            draggedSprite.y = lerp(draggedSprite.y, snapY, speed);

            draggedSprite.width = TILE_SIZE * cameraZoom;
            draggedSprite.height = TILE_SIZE * cameraZoom;
        }
    }
    
    app.view.addEventListener("wheel", (e) => {
        e.preventDefault();
        
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        
        const worldXBefore = (mouseX - cameraX) / cameraZoom;
        const worldYBefore = (mouseY - cameraY) / cameraZoom;
        
        const zoomFactor = 1 - e.deltaY * 0.0005;
        cameraZoom = Math.max(0.1, Math.min(5, cameraZoom * zoomFactor));
        
        const worldXAfter = (mouseX - cameraX) / cameraZoom;
        const worldYAfter = (mouseY - cameraY) / cameraZoom;
        
        cameraX += (worldXAfter - worldXBefore) * cameraZoom;
        cameraY += (worldYAfter - worldYBefore) * cameraZoom;
        
        OnCameraMoved();
    });
    
    // Disable right-click context menu
    app.view.addEventListener("contextmenu", (e) => e.preventDefault());
    
    function OnCameraMoved() {
        grid.x = cameraX;
        grid.y = cameraY;
        grid.scale.x = cameraZoom;
        grid.scale.y = cameraZoom;
        
        gridBgSprite.tilePosition.x = cameraX;
        gridBgSprite.tilePosition.y = cameraY;
        gridBgSprite.tileScale.x = cameraZoom;
        gridBgSprite.tileScale.y = cameraZoom;
        
        updateVisibleTiles();
    }
    
    OnCameraMoved();

    function ResizeCanvas()
    {
        const rect = elemCanvasGrid.parentElement.getBoundingClientRect();
        const width = rect.right - rect.left;
        const height = rect.bottom - rect.top;
        app.renderer.resize(width, height);

        gridBgSprite.width = width;
        gridBgSprite.height = height;
    }
    window.addEventListener("resize", ResizeCanvas);

    btnHideSidebar.addEventListener("click", () => {
        sidebarHidden = !sidebarHidden;
        if (sidebarHidden){
            elemSidebar.dataset.hidden = "true";
            btnHideSidebar.dataset.hid = "true";
        } else {
            delete elemSidebar.dataset.hidden;
            delete btnHideSidebar.dataset.hid;
        }
        ResizeCanvas();
    });
    
    // Show stats

    app.ticker.add((e) => {
        const delta = e.deltaMS / 1000
        tickerDelta = delta;

        const stats = `Tiles: ${spritePool.size} | Grid: ${GRID_W}x${GRID_H} | Zoom: ${cameraZoom.toFixed(2)}`;
        document.title = stats;

        updateDraggedSprite(delta);
    });
})();


function refreshRawCanvasSize()
{
    const rect = elemCanvasGrid.parentElement.getBoundingClientRect();
    elemCanvasGrid.width = rect.right - rect.left;
    elemCanvasGrid.height = rect.bottom - rect.top;
}
refreshRawCanvasSize();

async function setup()
{
    await app.init({
        backgroundColor: 0x1e1e1e,
        antialias: false, // Important: keep pixelated look
        resolution: 1,
        canvas: elemCanvasGrid,
        width: elemCanvasGrid.width,
        height: elemCanvasGrid.height,
    });

    // Then adding the application's canvas to the DOM body.
}



