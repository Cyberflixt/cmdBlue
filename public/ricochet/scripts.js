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
const elemBtnBlockBreakableCreator = document.getElementById("elemBtnBlockBreakableCreator");

const btnPlayStep = document.getElementById("btnPlayStep");
const btnPlay = document.getElementById("btnPlay");
const btnPlayFast = document.getElementById("btnPlayFast");
const btnResetExec = document.getElementById("btnResetExec");


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
    BREAKABLE_CREATOR: 7,
};
const TILE_TEX_PATH = {
    [TILE_TYPES.SOLID]: "assets/BlockSolid.png",
    [TILE_TYPES.WEDGE]: "assets/BlockWedge.png",
    [TILE_TYPES.BREAKABLE]: "assets/BlockBreakable.png",
    [TILE_TYPES.BULLET_GEN]: "assets/BlockBulletGen.png",
    [TILE_TYPES.BULLET_SPLIT]: "assets/BlockBulletSplit.png",
    [TILE_TYPES.FLIPPER]: "assets/BlockFlipper.png",
    [TILE_TYPES.BREAKABLE_CREATOR]: "assets/BlockBreakableCreator.png",
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
function posmod4sub1(x)
{
    if (x == 0)
        return 3;
    return x-1;
}
function posmod4add1(x)
{
    if (x == 3)
        return 0;
    return x+1;
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
    onBulletRicochet = null;
    onTilesChanged = null;
    onBlockDestroyed = null;

    firstStep = true;
    playing = false;
    playSpeedMS = 500;
    playFastFrames = 1000;

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
        if (this.bulletsX){
            for (let i = 0; i < this.bulletsX.length; i++)
            {
                this.onBulletDestroyed(i, this.bulletsX[i], this.bulletsY[i], this.bulletsRot[i]);
            }
        }

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

    SetTileRotation(gridX, gridY, rotation)
    {
        const i = this.PosToIndex(gridX, gridY);
        this.tilesRotation[i] = posmod4(rotation);
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

    ExecuteBulletStep(update)
    {
        for (let i = 0; i < this.bulletsX.length; i++)
        {
            const x = this.bulletsX[i];
            const y = this.bulletsY[i];
            const rot = this.bulletsRot[i];

            // Move bullet
            const [ux, uy] = this.GetRotationUpVector(rot);

            //const tarX = x+ux;
            //const tarY = y+uy;
            const tarIndex = (x+ux) + (y+uy) * this.width;
            const tarRot = this.tilesRotation[tarIndex];

            switch (this.tilesType[tarIndex])
            {
                case TILE_TYPES.EMPTY:
                    this.bulletsX[i] += ux;
                    this.bulletsY[i] += uy;
                    break;

                case TILE_TYPES.WEDGE:
                    this.bulletsX[i] += ux;
                    this.bulletsY[i] += uy;
                    if (rot == tarRot || rot == (tarRot + 1)%4){
                        this.bulletsRot[i] = (rot + 2) % 4;
                        this.onBulletRicochet(i, x+ux, y+uy, rot * Math.PI / 2);
                    } else if (rot == (tarRot + 2)%4){
                        this.bulletsRot[i] = posmod4sub1(rot);
                        this.onBulletRicochet(i, x+ux, y+uy, (rot+.5) * Math.PI / 2);
                    } else {
                        this.bulletsRot[i] = posmod4add1(rot);
                        this.onBulletRicochet(i, x+ux, y+uy, (rot-.5) * Math.PI / 2);
                    }
                    break;

                case TILE_TYPES.FLIPPER:
                    this.bulletsX[i] += ux;
                    this.bulletsY[i] += uy;
                    if (rot%2 == tarRot%2){
                        this.bulletsRot[i] = posmod4sub1(rot);
                        this.onBulletRicochet(i, x+ux, y+uy, (rot+.5) * Math.PI / 2);
                    }
                    else
                    {
                        this.bulletsRot[i] = posmod4add1(rot);
                        this.onBulletRicochet(i, x+ux, y+uy, (rot-.5) * Math.PI / 2);
                    }

                    this.tilesRotation[tarIndex]++;

                    break;

                case TILE_TYPES.BREAKABLE:
                    this.onBlockDestroyed(tarIndex, x+ux, y+uy, TILE_TYPES.BREAKABLE);
                    this.tilesType[tarIndex] = TILE_TYPES.EMPTY;
                    if (rot > 1)
                        this.bulletsRot[i] = rot-2;
                    else
                        this.bulletsRot[i] = rot+2
                    break;

                case TILE_TYPES.BREAKABLE_CREATOR:
                    this.onBulletRicochet(i, x+ux, y+uy, rot * Math.PI / 2);
                    if (rot > 1)
                        this.bulletsRot[i] = rot-2;
                    else
                        this.bulletsRot[i] = rot+2

                    if (rot == tarRot)
                    {
                        // Create breakable & Push blocks
                        const [tux, tuy] = this.GetRotationUpVector(tarRot);
                        const dirAddIndex = tux + tuy * this.width;

                        let curType = TILE_TYPES.BREAKABLE;
                        let curRot = tarRot;
                        let curIndex = x+ux+tux + (y+uy+tuy) * this.width;

                        let minIndex = 0;
                        let maxIndex = this.width * this.height;
                        if (tux != 0)
                        {
                            minIndex = (y+uy) * this.width;
                            maxIndex = (y+uy+1) * this.width-1;
                        }

                        while (curIndex >= minIndex && curIndex < maxIndex && this.tilesType[curIndex] != 0)
                        {
                            const nextType = this.tilesType[curIndex];
                            const nextRot = this.tilesRotation[curIndex];
                            this.tilesType[curIndex] = curType;
                            this.tilesRotation[curIndex] = curRot;
                            curType = nextType;
                            curRot = nextRot;
                            
                            curIndex += dirAddIndex;
                        }
                        if (curIndex >= 0 && curIndex < maxIndex)
                        {
                            this.tilesType[curIndex] = curType;
                            this.tilesRotation[curIndex] = curRot;
                        }

                        break;
                    }
                default:
                    if (rot > 1)
                        this.bulletsRot[i] = rot-2;
                    else
                        this.bulletsRot[i] = rot+2;
                    this.onBulletRicochet(i, x+ux, y+uy, rot * Math.PI / 2);
                    break;
            }

            // Update
            //this.bulletsX[i] = x;
            //this.bulletsY[i] = y;
            //this.bulletsRot[i] = rot;
            
            if (update)
                this.onBulletMoved(i, this.bulletsX[i], this.bulletsY[i], this.bulletsRot[i]);
        }

    }

    ExecuteStep(update = true)
    {
        this.ExecuteBulletStep(update);

        if (this.firstStep)
        {
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

        if (update)
            this.onTilesChanged();
    }

    SendUpdateAllBullets()
    {
        for (let i = 0; i < this.bulletsX.length; i++)
        {
            this.onBulletMoved(i, this.bulletsX[i], this.bulletsY[i], this.bulletsRot[i]);
        }
    }

    Play()
    {
        this.playing = true;
        const ts = this;
        function cycle(){
            if (ts.playing){
                ts.ExecuteStep();
                setTimeout(cycle, ts.playSpeedMS);
            }
        }
        cycle();
    }
    Stop(){
        this.playing = false;
    }

    PlayFast()
    {
        this.playing = true;
        const ts = this;
        function cycle(){
            if (ts.playing){
                for (let i = 0; i < ts.playFastFrames; i++)
                    ts.ExecuteStep();
                ts.SendUpdateAllBullets();
                ts.onTilesChanged();
                requestAnimationFrame(cycle)
            }
        }
        requestAnimationFrame(cycle);
    }
}


class BulletTrail
{
    constructor(trailTexture, app, parent, followTarget)
    {
        this.texture = trailTexture;
        
        this.historyX = [];
        this.historyY = [];

        // historySize determines how long the trail will be.
        this.count = 60;

        // Create history array.
        this.points = [];
        for (let i = 0; i < this.count; i++) {
            this.historyX.push(0);
            this.historyY.push(0);
        }
        // Create rope points.
        for (let i = 0; i < this.count; i++) {
            this.points.push(new PIXI.Point(0, 0));
        }

        // Create the rope
        this.rope = new PIXI.MeshRope({ texture: this.texture, points: this.points });

        // Set the blendmode
        this.rope.blendmode = 'add';

        parent.addChild(this.rope);

        // Listen for animate update
        const ts = this;
        this._update = function(){
            ts.update(followTarget.x, followTarget.y);
        }
        app.ticker.add(this._update);
    }

    destroy()
    {
        this.rope.destroy();
        app.ticker.remove(this._update);
    }

    update(new_x, new_y)
    {
        // Update the mouse values to history
        this.historyX.pop();
        this.historyX.unshift(new_x);
        this.historyY.pop();
        this.historyY.unshift(new_y);

        // Update the points to correspond with history.
        for (let i = 0; i < this.count; i++) {
            const p = this.points[i];
            p.x = this.historyX[i];
            p.y = this.historyY[i];
        }
    }
}

const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function PlaySound(audioBuffer) {
    if (!audioContext) return;
    
    // Resume audio context (required by browsers)
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    
    // If we have a loaded sound, play it
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0.3;
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);
    source.start(0);
}

async function loadSound(soundPath)
{
    const response = await fetch(soundPath);
    const arrayBuffer = await response.arrayBuffer();
    return await audioContext.decodeAudioData(arrayBuffer);
}

// Asynchronous IIFE
(async () => {
    await setup();

    // Load textures
    const textures = {
        gridBg: await PIXI.Assets.load("assets/GridBg.png"),
        bullet: await PIXI.Assets.load("assets/Bullet.png"),
        red: await PIXI.Assets.load("assets/PixRed.png"),
        white: await PIXI.Assets.load("assets/PixWhite.png"),
        bulletTrail: await PIXI.Assets.load('assets/trailBullet.png'),
        bulletDarken: await PIXI.Assets.load('assets/trailDarken.png'),
    };

    const sounds = {
        blockBreak: await loadSound("assets/blockBreak.ogg"),
        bulletRicochet: await loadSound("assets/bulletRicochet.ogg"),
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

    const particleContainer = new PIXI.Container();
    /*
    const particleContainer = new PIXI.ParticleContainer(10000, {
        scale: true,
        position: true,
        rotation: true,
        alpha: true,
        tint: true
    });
    */
    grid.addChild(particleContainer);
    const particleSystem0 = [];

    //const spritea = new PIXI.Sprite(textures.red);
    //particleContainer.addChild(spritea);
    
    // Constants
    const TILE_SIZE = 32;
    
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
    let draggedTileRot = null;
    let draggedSprite = null;
    
    function CreateDestructionEffect(gridX, gridY)
    {
        const colors = [0x183442, 0x529273, 0xadd794];
        
        // World position of the tile
        const worldX = (gridX + .5) * TILE_SIZE;
        const worldY = (gridY + .5) * TILE_SIZE;
        
        // Create 20-30 particles
        const particleCount = 20 + Math.floor(Math.random() * 10);
        for (let i = 0; i < particleCount; i++) {
            //const particle = new PIXI.Sprite(pixelTexture);
            const sprite = new PIXI.Sprite(textures.white);
            
            // Random velocity
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 4;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            
            // Set initial position (in world coordinates)
            sprite.x = worldX;
            sprite.y = worldY;
            sprite.tint = colors[i % colors.length];
            //sprite.tint = Math.random() * 0x808080;
            sprite.alpha = 1;

            sprite.ps_vx = vx;
            sprite.ps_vy = vy;
            sprite.ps_life = 1;
            sprite.ps_decay = 0.02 + Math.random() * 0.02;
            sprite.ps_drag = .1;
            
            particleSystem0.push(sprite);
            //particleContainer.addParticle(sprite);
            particleContainer.addChild(sprite);
        }
    }
    function CreateRicochetEffect(gridX, gridY, ricoAngle)
    {
        const colors = [0xffcf00, 0xff8500, 0xffd053];
        
        // World position of the tile
        const worldX = (gridX + .5) * TILE_SIZE;
        const worldY = (gridY + .5) * TILE_SIZE;
        const ricoPsAngle = ricoAngle - Math.PI / 2;
        
        // Create 20-30 particles
        const particleCount = 3 + Math.floor(Math.pow(Math.random(), 4) * 20);
        for (let i = 0; i < particleCount; i++) {
            //const particle = new PIXI.Sprite(pixelTexture);
            const sprite = new PIXI.Sprite(textures.white);
            
            // Random velocity
            const angle = ricoPsAngle + (Math.random()-.5) * Math.PI * .3;
            const speed = 1 + Math.random() * 20;
            const dx = Math.cos(angle);
            const dy = Math.sin(angle);
            
            // Set initial position (in world coordinates)
            sprite.x = worldX + dx * TILE_SIZE / 3;
            sprite.y = worldY + dy * TILE_SIZE / 3;
            sprite.tint = colors[i % colors.length];
            sprite.alpha = 1;

            sprite.ps_vx = dx * speed;
            sprite.ps_vy = dy * speed;
            sprite.ps_life = 1;
            sprite.ps_decay = 0.02 + Math.random() * 0.02;
            sprite.ps_drag = .3;
            
            particleSystem0.push(sprite);
            //particleContainer.addParticle(sprite);
            particleContainer.addChild(sprite);
        }
    }
    sim.onBlockDestroyed = function(index, x, y, type) {
        CreateDestructionEffect(x, y);
    };
    sim.onBulletRicochet = function(bulletIndex, x, y, ricoAngle) {
        CreateRicochetEffect(x, y, ricoAngle);
        //PlaySound(sounds.bulletRicochet);
    };

    function ScreenToGridCoords(screenX, screenY) {
        const worldX = (screenX - cameraX) / cameraZoom;
        const worldY = (screenY - cameraY) / cameraZoom;
        const gridX = Math.floor(worldX / TILE_SIZE);
        const gridY = Math.floor(worldY / TILE_SIZE);
        return [ gridX, gridY ];
    }
    function GridToScreenCoords(gridX, gridY) {
        const worldX = (gridX + .5) * TILE_SIZE * cameraZoom + cameraX;
        const worldY = (gridY + .5) * TILE_SIZE * cameraZoom + cameraY;
        return [ worldX, worldY ];
    }
    
    function setTile(gridX, gridY, tileType) {
        sim.SetTileType(gridX, gridY, tileType);
        UpdateVisibleTiles();
    }

    let bullet_sprites = [];
    let bullet_trails = [];
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

        const trail = new BulletTrail(textures.bulletTrail, app, grid, sprite);
        bullet_trails.push(trail);
    }
    sim.onBulletMoved = function(bulletIndex, x, y, rot)
    {
        const sprite = bullet_sprites[bulletIndex];
        const trail = bullet_trails[bulletIndex];
        sprite.x = (x+.5) * TILE_SIZE;
        sprite.y = (y+.5) * TILE_SIZE;
        sprite.rotation = rot * Math.PI / 2;
        trail.update(sprite.x, sprite.y);
    }
    sim.onBulletDestroyed = function(bulletIndex, x, y, rot)
    {
        const trail = bullet_trails[bulletIndex];
        const sprite = bullet_sprites[bulletIndex];

        trail.destroy();
        sprite.destroy();

        bullet_sprites.splice(bulletIndex, 1);
        bullet_trails.splice(bulletIndex, 1);
    }
    
    function UpdateVisibleTiles() {
        // Calculate visible tile range with padding
        const padding = 2;
        const minX = Math.max(0, Math.floor(-cameraX / cameraZoom / TILE_SIZE) - padding);
        const maxX = Math.min(sim.width, Math.ceil((app.screen.width - cameraX) / cameraZoom / TILE_SIZE) + padding);
        const minY = Math.max(0, Math.floor(-cameraY / cameraZoom / TILE_SIZE) - padding);
        const maxY = Math.min(sim.height, Math.ceil((app.screen.height - cameraY) / cameraZoom / TILE_SIZE) + padding);
        
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
                        sprite.tileType = tileType;
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
                            draggedTileRot = sim.GetTileRotation(sprite.gridX, sprite.gridY);
                            //DestroyTile();
                            setTile(x, y, TILE_TYPES.EMPTY);
                            
                            // Create visual feedback sprite
                            draggedSprite = new PIXI.Sprite(textures[draggedTileType]);
                            draggedSprite.alpha = 0.7;
                            draggedSprite.anchor.set(0.5);

                            const [ screenX, screenY ] = GridToScreenCoords(sprite.gridX, sprite.gridY);
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
        if (e.button === 0)
        {
            cameraDragging = false;
            
            // Drop tile if we're dragging one
            if (draggedTileType) {
                const [ gridX, gridY ] = ScreenToGridCoords(e.clientX, e.clientY);
                sim.SetTileRotation(gridX, gridY, draggedTileRot);
                setTile(gridX, gridY, draggedTileType);
                
                if (draggedSprite) {
                    draggedSprite.destroy();
                    draggedSprite = null;
                }
                draggedTileType = null;
            }
        }
        else if (e.button === 2)
        {
            // Right click to delete
            const [ gridX, gridY ] = ScreenToGridCoords(e.clientX, e.clientY);
            if (sim.GetTileType(gridX, gridY) != TILE_TYPES.EMPTY){
                setTile(gridX, gridY, TILE_TYPES.EMPTY);
                CreateDestructionEffect(gridX, gridY);
            }
        }
    });
    document.addEventListener("pointerup", (e) => {
        if (newBlockDraggedType != null)
        {
            const [ gridX, gridY ] = ScreenToGridCoords(e.clientX, e.clientY);
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
        const [x, y] = ScreenToGridCoords(mouseX, mouseY);
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
                const [ gridX, gridY ] = ScreenToGridCoords(mouseX, mouseY);
                const [ snapX, snapY ] = GridToScreenCoords(gridX, gridY);
                
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
        const [ x, y ] = ScreenToGridCoords(mouseX, mouseY);
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
            const [ gridX, gridY ] = ScreenToGridCoords(mouseX, mouseY);
            const [ snapX, snapY ] = GridToScreenCoords(gridX, gridY);
            
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
    btnDragNewBlock(elemBtnBlockBreakableCreator, TILE_TYPES.BREAKABLE_CREATOR);

    btnPlayStep.addEventListener("pointerdown", () => {
        // Play single step
        sim.ExecuteStep();
    });
    btnPlay.addEventListener("pointerdown", () => {
        // Toggle playing
        if (sim.playing){
            delete btnPlay.dataset.playing;
            sim.Stop();
        } else {
            btnPlay.dataset.playing = "true";
            sim.Play();
        }
    });
    btnPlayFast.addEventListener("pointerdown", () => {
        if (!sim.playing){
            sim.PlayFast();
        }
    });
    btnResetExec.addEventListener("pointerdown", () => {
        sim.Stop();
        sim.ResetBullets();
    });

    sim.onTilesChanged = UpdateVisibleTiles;

    app.ticker.add((e) => {
        const delta = e.deltaMS / 1000;
        updateDraggedSprite(delta);

        // Update particles
        for (let i = particleSystem0.length - 1; i >= 0; i--) {
            const sprite = particleSystem0[i];
            
            // Update position
            sprite.x += sprite.ps_vx;
            sprite.y += sprite.ps_vy;
            
            // Drag
            sprite.ps_vx /= 1 + sprite.ps_drag;
            sprite.ps_vy /= 1 + sprite.ps_drag;
            
            // Fade out
            sprite.ps_life -= sprite.ps_decay;
            sprite.alpha = sprite.ps_life;
            
            // Remove dead particles
            if (sprite.ps_life <= 0) {
                sprite.destroy();
                particleSystem0.splice(i, 1);
            }
        }
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



