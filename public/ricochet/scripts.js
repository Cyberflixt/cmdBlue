import * as PIXI from "https://cdn.jsdelivr.net/npm/pixi.js@8.13.2/dist/pixi.min.mjs";

const elemCanvasGrid = document.getElementById('canvasGrid');
const btnHideSidebar = document.getElementById("btnHideSidebar");
const elemSidebar = document.getElementById("sidebar");
const elemDraggedBlock = document.getElementById("elemDraggedBlock");
const elemLog = document.getElementById("elemLog");

const elemBtnBlockSolid = document.getElementById("elemBtnBlockSolid");
const elemBtnBlockBreakable = document.getElementById("elemBtnBlockBreakable");
const elemBtnBlockBulletGen = document.getElementById("elemBtnBlockBulletGen");
const elemBtnBlockBulletSplit = document.getElementById("elemBtnBlockBulletSplit");
const elemBtnBlockWedge = document.getElementById("elemBtnBlockWedge");
const elemBtnBlockFlipper = document.getElementById("elemBtnBlockFlipper");

const btnPlayStep = document.getElementById("btnPlayStep");


const app = new PIXI.Application();
PIXI.TextureStyle.defaultOptions.scaleMode = 'nearest';

// Tile type constants
const TILE_TYPES = {
    EMPTY: 0,
    SOLID: 1,
    WEDGE: 2,
    BREAKABLE: 3,
    BULLET_GEN: 4,
    BULLET_SPLIT: 5,
    FLIPPER: 6,
};
const TILE_TEX_PATH = {
    [TILE_TYPES.SOLID]: "assets/BlockSolid.png",
    [TILE_TYPES.WEDGE]: "assets/BlockWedge.png",
    [TILE_TYPES.BREAKABLE]: "assets/BlockBreakable.png",
    [TILE_TYPES.BULLET_GEN]: "assets/BlockBulletGen.png",
    [TILE_TYPES.BULLET_SPLIT]: "assets/BlockBulletSplit.png",
    [TILE_TYPES.FLIPPER]: "assets/BlockFlipper.png",
};

function lerp(a,b,t)
{
    return a + (b-a) * t;
}

function posmod4(x)
{
    x = x % 4;
    if (x < 0)
        return x + 4;
    return x;
}

let mouseX = 0;
let mouseY = 0;

let sidebarHidden = false;

function SetLog(text = null)
{
    if (text == null)
    {
        elemLog.style.visibility = "hidden";
    }
    else
    {
        elemLog.style.visibility = "";
        elemLog.innerText = text;
    }
}
SetLog();

class Simulator
{
    onBulletCreated = null;
    onBulletDestroyed = null;
    onBulletMoved = null;
    firstStep = true;

    constructor()
    {
        this.width = 1000;
        this.height = 1000;
        
        this.ResetTiles();
        this.GridRandomFill();
        this.ResetBullets();
    }

    ResetBullets()
    {
        this.firstStep = true;
        this.bulletsX = [];
        this.bulletsY = [];
        this.bulletsRot = [];
    }

    ResetTiles()
    {
        this.tilesType = new Uint8Array(this.width * this.height);
        this.tilesRotation = new Uint8Array(this.width * this.height);
    }

    PosToIndex(x,y)
    {
        return y * this.width + x;
    }

    IndexToPos(i)
    {
        return [
            i % this.width,
            Math.floor(i / this.width)
        ]
    }

    GridRandomFill()
    {
        // Initialize with some random tiles
        for (let i = 0; i < 5000; i++) {
            const x = Math.floor(Math.random() * this.width);
            const y = Math.floor(Math.random() * this.height);
            this.SetTileType(x, y, Math.random() > 0.5 ? TILE_TYPES.SOLID : TILE_TYPES.BREAKABLE);
        }
    }

    SetTileType(gridX, gridY, tileType)
    {
        if (gridX < 0 || gridX >= this.width || gridY < 0 || gridY >= this.height) return;
        this.tilesType[this.PosToIndex(gridX, gridY)] = tileType;
    }
    
    GetTileType(gridX, gridY)
    {
        if (gridX < 0 || gridX >= this.width || gridY < 0 || gridY >= this.height) return TILE_TYPES.EMPTY;
        return this.tilesType[this.PosToIndex(gridX, gridY)];
    }

    RotateTile(gridX, gridY, rotation = 1)
    {
        const i = this.PosToIndex(gridX, gridY);

        let rot = posmod4(this.tilesRotation[i] + rotation);
        this.tilesRotation[i] = rot;
        return rot;
    }

    GetTileRotation(gridX, gridY)
    {
        return this.tilesRotation[this.PosToIndex(gridX, gridY)];
    }

    GetTileRotationRadians(gridX, gridY)
    {
        return this.tilesRotation[this.PosToIndex(gridX, gridY)] * Math.PI / 2;
    }

    GetRotationUpVector(rotation)
    {
        if (rotation < 0 || rotation >= 4)
            console.error("Rotation out of range!");

        if (rotation < 2)
        {
            if (rotation == 0)
                return [0,-1]; // 0
            return [1,0]; // 1
        }
        if (rotation == 2)
            return [0,1]; // 2
        return [-1,0]; // 3
    }

    ExecuteBulletStep()
    {
        for (let i = 0; i < this.bulletsX.length; i++)
        {
            let x = this.bulletsX[i];
            let y = this.bulletsY[i];
            let rot = this.bulletsRot[i];

            // Move bullet
            const [ux, uy] = this.GetRotationUpVector(rot);

            const tarX = x+ux;
            const tarY = y+uy;
            const tarIndex = tarX + tarY * this.width;
            const tarType = this.tilesType[tarIndex];
            const tarRot = this.tilesRotation[tarType];

            switch (tarType)
            {
                case TILE_TYPES.EMPTY:
                    x += ux;
                    y += uy;
                    break;
                case TILE_TYPES.WEDGE:
                    break;
                case TILE_TYPES.FLIPPER:
                    x += ux;
                    y += uy;
                    console.log(rot, tarRot);
                    if (rot%2 == tarRot%2)
                        rot = posmod4(rot-1);
                    else
                        rot = (rot+1)%4;
                    console.log("then", rot, tarRot);
                    const [nux, nuy] = this.GetRotationUpVector(rot);
                    x += nux;
                    y += nuy;

                    this.tilesRotation[tarIndex]++;

                    break;
                default:
                    rot = (rot + 2) % 4;
                    x -= ux;
                    y -= uy;
                    break;
            }

            // Update
            this.bulletsX[i] = x;
            this.bulletsY[i] = y;
            this.bulletsRot[i] = rot;

            this.onBulletMoved(i, x, y, rot);
            

        }
    }

    ExecuteStep()
    {
        this.ExecuteBulletStep();

        let i = 0;
        for (let y = 0; y < this.height; y++)
        {
            for (let x = 0; x < this.width; x++)
            {
                const ty = this.tilesType[i];
                switch (ty)
                {
                    case TILE_TYPES.BULLET_GEN:
                        if (this.firstStep)
                        {
                            // Create bullet
                            const rot = this.tilesRotation[i];
                            const [ux, uy] = this.GetRotationUpVector(rot);
                            const bulletIndex = this.bulletsX.length;

                            this.bulletsX.push(x+ux);
                            this.bulletsY.push(y+uy);
                            this.bulletsRot.push(rot);

                            this.onBulletCreated(bulletIndex, x+ux, y+uy, rot);
                        }
                        break;
                }
                i++;
            }
        }

        this.firstStep = false;
    }
}

// Asynchronous IIFE
(async () => {
    await setup();

    // Load textures
    const textures = {
        gridBg: await PIXI.Assets.load("assets/GridBg.png"),
        bullet: await PIXI.Assets.load("assets/Bullet.png"),
    };

    for (let value of Object.values(TILE_TYPES))
    {
        if (value in TILE_TEX_PATH){
            textures[value] = await PIXI.Assets.load(TILE_TEX_PATH[value]);
        }
    }
    
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
    
    const sim = new Simulator();
    
    // Sprite pool - only stores currently visible sprites
    const spritePool = new Map(); // key: "x,y", value: sprite
    
    // Camera state
    let cameraDragging = false;
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
        return [ gridX, gridY ];
    }
    function gridToScreenCoords(gridX, gridY) {
        const worldX = (gridX + .5) * TILE_SIZE * cameraZoom + cameraX;
        const worldY = (gridY + .5) * TILE_SIZE * cameraZoom + cameraY;
        return [ worldX, worldY ];
    }
    
    function setTile(gridX, gridY, tileType) {
        sim.SetTileType(gridX, gridY, tileType);
        UpdateVisibleTiles();
    }

    let bullet_sprites = [];
    sim.onBulletCreated = function(bulletIndex, x, y, rot)
    {
        const sprite = new PIXI.Sprite(textures.bullet);
        sprite.x = (x+.5) * TILE_SIZE;
        sprite.y = (y+.5) * TILE_SIZE;
        sprite.width = TILE_SIZE;
        sprite.height = TILE_SIZE;
        sprite.eventMode = 'static';
        sprite.anchor.set(0.5);

        sprite.rotation = rot * Math.PI / 2;

        grid.addChild(sprite);
        bullet_sprites.push(sprite);
    }
    sim.onBulletMoved = function(bulletIndex, x, y, rot)
    {
        const sprite = bullet_sprites[bulletIndex];
        sprite.x = (x+.5) * TILE_SIZE;
        sprite.y = (y+.5) * TILE_SIZE;
        sprite.rotation = rot * Math.PI / 2;
    }
    sim.onBulletDestroyed = function(bulletIndex, x, y, rot)
    {
        const sprite = bullet_sprites[bulletIndex];
        bullet_sprites.splice(bulletIndex, 1);

        sprite.destroy();
    }
    
    function UpdateVisibleTiles() {
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
                const tileType = sim.GetTileType(x,y);
                if (tileType === TILE_TYPES.EMPTY) continue;
                
                const key = `${x},${y}`;
                shouldExist.add(key);
                
                if (spritePool.has(key)) {
                    // Sprite
                    const sprite = spritePool.get(key);
                    if (sprite.tileType != tileType){
                        sprite.texture = textures[tileType];
                    }

                    // Rotation
                    const rot = sim.GetTileRotationRadians(x,y);
                    if (sprite.rotation != rot)
                        sprite.rotation = rot;
                } else {
                    
                    // Create new sprite
                    const sprite = new PIXI.Sprite(textures[tileType]);
                    sprite.x = (x+.5) * TILE_SIZE;
                    sprite.y = (y+.5) * TILE_SIZE;
                    sprite.width = TILE_SIZE;
                    sprite.height = TILE_SIZE;
                    sprite.eventMode = 'static';
                    sprite.cursor = 'pointer';
                    sprite.anchor.set(0.5);
                    
                    const rot = sim.GetTileRotationRadians(x,y);
                    sprite.rotation = rot;
                    
                    // Store grid coords on sprite for easy access
                    sprite.gridX = x;
                    sprite.gridY = y;
                    sprite.tileType = tileType;
                    
                    // Click to pick up tile
                    sprite.on('pointerdown', (e) => {
                        if (e.button === 0) { // Left click
                            draggedTileType = sim.GetTileType(sprite.gridX, sprite.gridY);
                            //DestroyTile();
                            setTile(x, y, TILE_TYPES.EMPTY);
                            
                            // Create visual feedback sprite
                            draggedSprite = new PIXI.Sprite(textures[draggedTileType]);
                            draggedSprite.alpha = 0.7;
                            draggedSprite.anchor.set(0.5);

                            const [ screenX, screenY ] = gridToScreenCoords(sprite.gridX, sprite.gridY);
                            draggedSprite.width = TILE_SIZE * cameraZoom;
                            draggedSprite.height = TILE_SIZE * cameraZoom;
                            draggedSprite.x = screenX;
                            draggedSprite.y = screenY;
                            const rot = sim.GetTileRotationRadians(x,y);
                            draggedSprite.rotation = rot;

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

        UpdateLog();
    }

    function DestroyTile(x, y)
    {
        sim.SetTileType(x, y, TILE_TYPES.EMPTY);

        const key = `${x},${y}`;
        const sprite = spritePool.get(key);
        sprite.destroy();
        spritePool.delete(key);
    }
    
    // Mouse/touch events
    app.view.addEventListener("pointerdown", (e) => {
        if (e.button === 0 && !draggedTileType) { // Left click for dragging camera
            cameraDragging = true;
            dragMX = e.clientX;
            dragMY = e.clientY;
            dragCamX = cameraX;
            dragCamY = cameraY;
            SetLog();
        }
    });
    
    app.view.addEventListener("pointerup", (e) => {
        if (e.button === 0) {
            cameraDragging = false;
            
            // Drop tile if we're dragging one
            if (draggedTileType) {
                const [ gridX, gridY ] = getGridCoords(e.clientX, e.clientY);
                setTile(gridX, gridY, draggedTileType);
                
                if (draggedSprite) {
                    draggedSprite.destroy();
                    draggedSprite = null;
                }
                draggedTileType = null;
            }
        } else if (e.button === 2) { // Right click to delete
            const [ gridX, gridY ] = getGridCoords(e.clientX, e.clientY);
            setTile(gridX, gridY, TILE_TYPES.EMPTY);
        }
    });
    document.addEventListener("pointerup", (e) => {
        if (newBlockDraggedType != null)
        {
            const [ gridX, gridY ] = getGridCoords(e.clientX, e.clientY);
            sim.SetTileType(gridX, gridY, newBlockDraggedType);

            newBlockDraggedType = null;
            elemDraggedBlock.style.visibility = "hidden";
            UpdateVisibleTiles();
        }
    });
    
    app.view.addEventListener("pointerleave", () => {
        cameraDragging = false;
    });
    
    app.view.addEventListener("pointermove", (e) => {
        // Camera dragging
        if (cameraDragging) {
            cameraX = e.clientX - dragMX + dragCamX;
            cameraY = e.clientY - dragMY + dragCamY;
            OnCameraMoved();
        } else {
            UpdateLog();
        }
    });

    function UpdateLog()
    {
        const [x, y] = getGridCoords(mouseX, mouseY);
        const ty = sim.GetTileType(x,y);
        if (ty == TILE_TYPES.EMPTY)
            SetLog();
        else
            SetLog(`Type ${ty}, Rotation ${sim.GetTileRotation(x,y)}`);
    }
    
    let newBlockDraggedType = null;
    let newBlockDraggedX = null;
    let newBlockDraggedY = null;

    document.addEventListener("pointermove", (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;

        // New block dragging
        if (newBlockDraggedType != null)
        {
            const rect = app.canvas.getBoundingClientRect();

            const speed = 20 * 1/60;
            if (mouseX > rect.left && mouseX < rect.right)
            {
                const [ gridX, gridY ] = getGridCoords(mouseX, mouseY);
                const [ snapX, snapY ] = gridToScreenCoords(gridX, gridY);
                
                newBlockDraggedX = lerp(newBlockDraggedX, snapX, speed);
                newBlockDraggedY = lerp(newBlockDraggedY, snapY, speed);
            }
            else
            {
                newBlockDraggedX = lerp(newBlockDraggedX, mouseX, speed);
                newBlockDraggedY = lerp(newBlockDraggedY, mouseY, speed);
            }
            RefreshElemDraggedBlockPos();
        }
    });
    function RefreshElemDraggedBlockPos()
    {
        const size = TILE_SIZE * cameraZoom;
        elemDraggedBlock.style.transform = `translate(${newBlockDraggedX - size/2}px, ${newBlockDraggedY - size/2}px)`;
        elemDraggedBlock.style.width = `${size}px`;
        elemDraggedBlock.style.height = `${size}px`;
    }

    function OnInputRotate()
    {
        const [ x, y ] = getGridCoords(mouseX, mouseY);
        sim.RotateTile(x,y,1);
        UpdateVisibleTiles();
    }

    document.addEventListener("keydown", (e) => {
        if (e.key == "r")
        {
            OnInputRotate();
        }
    });

    function updateDraggedSprite(delta)
    {
        // Update dragged sprite position
        if (draggedSprite)
        {
            // Snap to nearest tile
            const [ gridX, gridY ] = getGridCoords(mouseX, mouseY);
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
        
        const zoomSpeed = .002;
        if (e.deltaY > 0){
            cameraZoom = Math.max(0.1, Math.min(5, cameraZoom / (1 + e.deltaY * zoomSpeed)));
        } else {
            cameraZoom = Math.max(0.1, Math.min(5, cameraZoom * (1 - e.deltaY * zoomSpeed)));
        }
        
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
        
        UpdateVisibleTiles();
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
    ResizeCanvas();

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


    function btnDragNewBlock(elemBtn, blockType)
    {
        elemBtn.addEventListener("pointerdown", (e) => {
            newBlockDraggedType = blockType;
            elemDraggedBlock.src = TILE_TEX_PATH[blockType];
            elemDraggedBlock.style.visibility = "";
            newBlockDraggedX = e.clientX;
            newBlockDraggedY = e.clientY;
            RefreshElemDraggedBlockPos();
        });
    }
    elemDraggedBlock.style.visibility = "hidden";

    btnDragNewBlock(elemBtnBlockSolid, TILE_TYPES.SOLID);
    btnDragNewBlock(elemBtnBlockBreakable, TILE_TYPES.BREAKABLE);
    btnDragNewBlock(elemBtnBlockBulletGen, TILE_TYPES.BULLET_GEN);
    btnDragNewBlock(elemBtnBlockBulletSplit, TILE_TYPES.BULLET_SPLIT);
    btnDragNewBlock(elemBtnBlockWedge, TILE_TYPES.WEDGE);
    btnDragNewBlock(elemBtnBlockFlipper, TILE_TYPES.FLIPPER);

    btnPlayStep.addEventListener("click", () => {
        sim.ExecuteStep();
        UpdateVisibleTiles();
    });

    app.ticker.add((e) => {
        const delta = e.deltaMS / 1000

        //const stats = `Tiles: ${spritePool.size} | Grid: ${GRID_W}x${GRID_H} | Zoom: ${cameraZoom.toFixed(2)}`;

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



