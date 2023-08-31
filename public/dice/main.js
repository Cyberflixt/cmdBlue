
import * as THREE         from 'three';
import {OrbitControls}    from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader}       from 'three/addons/loaders/GLTFLoader.js';
import { CSS2DRenderer, CSS2DObject }  from 'three/addons/renderers/CSS2DRenderer.js';

const listener = new THREE.AudioListener();
var loader = new GLTFLoader();

const contentHolder = document.getElementById("contentHolder");
const elemLoadingBar = document.getElementById("loadingBar");
const elemLoadingScreen = document.getElementById("elemLoadingScreen");

const cssRenderer = new CSS2DRenderer({element: contentHolder});
cssRenderer.setSize(window.innerWidth, window.innerHeight);
cssRenderer.domElement.style.position = 'absolute';
cssRenderer.domElement.style.top = '0px';
document.body.appendChild(cssRenderer.domElement);

var volume3D = 2;

const loadingManager = new THREE.LoadingManager();

const cubeLoader = new THREE.CubeTextureLoader(loadingManager);
const texLoader = new THREE.TextureLoader(loadingManager);


var LOD = 0;

function skybox(a,b,c,d,e,f){
    if (b) {
        return cubeLoader.load([a,b,c,d,e,f]);
    } else {
        return cubeLoader.load([
            a+'/px.png',
            a+'/nx.png',
            a+'/py.png',
            a+'/ny.png',
            a+'/pz.png',
            a+'/nz.png',
        ]);
    }
}

var meshesLoaded = {};
var meshesPaths = {
    "d20phy": "assets/meshes/dice20phy.glb",
    "d20a": "assets/meshes/dice20a.glb",

    "d6phy": "assets/meshes/dice6phy.glb",
    "d6a": "assets/meshes/dice6a.glb",
}

var audioLoaded = {};
var audioPath = {
    "dice0": "assets/audio/dice/dice0.mp3",
    "dice1": "assets/audio/dice/dice1.mp3",
    "dice2": "assets/audio/dice/dice2.mp3",
    "dice3": "assets/audio/dice/dice3.mp3",
    "dice4": "assets/audio/dice/dice4.mp3",
    "dice5": "assets/audio/dice/dice5.mp3",
    "dice6": "assets/audio/dice/dice6.mp3",

    "diceSmall0": "assets/audio/dice/diceSmall0.mp3",
    "diceSmall1": "assets/audio/dice/diceSmall1.mp3",
    "diceSmall2": "assets/audio/dice/diceSmall2.mp3",
    "diceSmall3": "assets/audio/dice/diceSmall3.mp3",
    "diceSmall4": "assets/audio/dice/diceSmall4.mp3",

    "sfxImpact0": "assets/audio/sfxImpact0.mp3",
    "sfxImpact1": "assets/audio/sfxImpact1.mp3",
    "sfxImpact2": "assets/audio/sfxImpact2.mp3",

    "sfxGong": "assets/audio/sfxGong.mp3",
    "sfxGongFail": "assets/audio/sfxGongFail.mp3",
    "sfxHorn0": "assets/audio/sfxHorn0.mp3",
};

const skyRefraction = texLoader.load( 'assets/textures/ice004.jpg' );
skyRefraction.mapping = THREE.EquirectangularRefractionMapping;
skyRefraction.colorSpace = THREE.SRGBColorSpace;

const skyReflection = skybox("assets/textures/ice004.jpg","assets/textures/ice004.jpg","assets/textures/ice004.jpg","assets/textures/ice004.jpg","assets/textures/ice004.jpg","assets/textures/ice004.jpg");

const matTest = new THREE.MeshBasicMaterial({envMap: skyRefraction, reflectivity: 1, refractionRatio: .9, transparent: true, opacity: .9, color: 0x700000});


var matsLoaded = {};
var matsFolder = "assets/textures";
var matsDataDict = {
    "Planks024_low":  ["-map", "tex:assets/textures/planks024v.jpg", "-normalMap", "tex:assets/textures/planks024nor.jpg", "-tile", 1,"-normalScale", 10, "-color", 0xA08060],
    "Planks024":  ["-map", "tex:assets/textures/planks024v.jpg", "-normalMap", "tex:assets/textures/planks024nor.jpg", "-tile", 1,"-normalScale", 10, "-color", 0xA08060],
    "Marble009":  ["-map", "tex:assets/textures/marble009.jpg", "-tile", 2, "-reflectivity", 1,"-envMap", skyReflection],
    "Marble008":  ["-map", "tex:assets/textures/marble008.jpg", "-tile", 2, "-side", THREE.DoubleSide],
    "Glass0": matTest,
}
//MeshToonMaterial, MeshPhysicalMaterial, MeshLambertMaterial, MeshBasicMaterial

var modelRandomMaterial = {
    "d20a": [
        ["Marble008"],
        ["Marble009", "Glass0"],
    ],
    "d6a": [
        ["Marble009", "Glass0"],
        ["Marble008"],
    ],
}

var diceFaceVectors = {
    d20: [
        new THREE.Vector3( 1.21,  3.71, -0.74),
        new THREE.Vector3( 1.21, -3.71, -0.74),
        new THREE.Vector3(-0.74,  2.29,  3.16),
        new THREE.Vector3(-1.95, -1.42, -3.16),
        new THREE.Vector3( 2.41,  0,    -3.16),

        new THREE.Vector3(-3.90,  0,     0.74),//6
        new THREE.Vector3( 3.16,  2.29,  0.74),
        new THREE.Vector3(-0.74, -2.29,  3.15),
        new THREE.Vector3(-3.15,  2.29, -0.74),
        new THREE.Vector3( 1.95, -1.41,  3.15),

        new THREE.Vector3(-1.95,  1.41, -3.15),
        new THREE.Vector3( 3.15, -2.29,  0.74),
        new THREE.Vector3( 0.74,  2.29, -3.15),
        new THREE.Vector3(-3.15, -2.29, -0.74),
        new THREE.Vector3( 3.90,  0,    -0.74),

        new THREE.Vector3(-2.41,  0,     3.15),
        new THREE.Vector3( 1.95,  1.41,  3.15),
        new THREE.Vector3( 0.74, -2.29, -3.15),
        new THREE.Vector3(-1.20,  3.71,  0.74),
        new THREE.Vector3(-1.20, -3.71,  0.74),
    ],
    d6: [
        new THREE.Vector3( 0, 0,-3),
        new THREE.Vector3( 0,-3, 0),
        new THREE.Vector3( 3, 0, 0),
        new THREE.Vector3(-3, 0, 0),
        new THREE.Vector3( 0, 3, 0),
        new THREE.Vector3( 0, 0, 3),
    ],
};





// [a;b[
function ranRange(a,b) { 
    return Math.floor(Math.random()*(b-a))+a;
}
function ranList(li) {
    return li[Math.floor(Math.random()*li.length)];
}
function setModelMaterial(model, mat) {
    model.traverse((child) => {
        child.material = mat;
        child.material.needsUpdate = true;
    });
}
function randomizeModelMaterial(mesh, name) {
    const layers = modelRandomMaterial[name];
    for (let i = 0; i<layers.length; i++){
        mesh.children[i].material = matsLoaded[ranList(layers[i])];
    }
}

async function preloadMeshes() {
    for (const [name, path] of Object.entries(meshesPaths)){
        const result = await loader.loadAsync(path);
        let model = result.scene;

        model.traverse((child) => {
            child.castShadow = true;
            child.receiveShadow = true;
        });

        meshesLoaded[name] = model;
    }
}


async function preloadAudio() {
    const loader = new THREE.AudioLoader();
    for (const [name, path] of Object.entries(audioPath)){
        const sound = new THREE.PositionalAudio(listener);
        const buffer = await loader.loadAsync(path);

        sound.setBuffer(buffer);
        sound.setVolume(volume3D);
        sound.setRefDistance(1);
        audioLoaded[name] = sound;
    }
}
function playAudio3D(name, object, ranMax, volume = 1) {
    if (ranMax){
        name += Math.floor(Math.random()*(ranMax+1));
    }

    const ref = audioLoaded[name];
    const sound = new THREE.PositionalAudio(listener);
    sound.setBuffer(ref.buffer);
    sound.setVolume(volume*volume3D);
    sound.setRolloffFactor(0);

    object.add(sound);
    sound.play();
    return sound;
}


const specialMetarialParameter = {
    tile: (textures, args, v) => {
        Array.from(Object.values(textures)).map((tex) => {
            if (typeof(tex) == 'object'){
                tex.repeat.set(v,v);
            }
        });
    },
    mat: (textures, args, v) => {
        args.matType = v;
    },
    side: (textures, args, v) => {
        textures.side = THREE[v];
    },
    normalScale: (textures, args, v) => {
        textures.normalScale = new THREE.Vector2(v,v);
    },
};
async function preloadMaterials() {
    for (const [name, data] of Object.entries(matsDataDict)){
        if (! Array.isArray(data)) {
            matsLoaded[name] = data;
            continue;
        };

        const dirName = name.split("_")[0];
        let folder = matsFolder+"/"+dirName+"/";
        if (matsFolder.charAt(0) == "/"){
            folder = matsFolder.substring(1,matsFolder.length);
        }
        const ext = ".jpg";

        const textures = {};
        const speArgs = {
            //matType: THREE.MeshLambertMaterial,
            matType: (LOD>0) ? THREE.MeshLambertMaterial : THREE.MeshBasicMaterial,
        };

        for (let i = 0; i<data.length; i++){
            let name = data[i];
            if (name.charAt(0) == "-") {
                name = name.substring(1,name.length);
                const func = specialMetarialParameter[name];

                i++;
                if (func) {
                    func(textures, speArgs, data[i]);
                } else {

                    if (typeof(data[i]) == "string"){
                        if (data[i].startsWith("tex:")){
                            data[i] = await loadTextureRepeat(data[i].substring(4,data[i].length));
                        }
                    }
                    textures[name] = data[i];
                }

            } else {
                textures[name] = await loadTextureRepeat(folder+name+ext);
            }
        }

        //MeshPhongMaterial
        matsLoaded[name] = new speArgs.matType(textures);
    }
}

function HexByHue(hue) {
    // full saturation & value, random hue
    const r = Math.min(Math.max(1 - Math.abs(hue * 3), 0), .5) * 2 + Math.min(Math.max(1 - Math.abs(hue * 3 - 3), 0), .5) * 2;
    const g = Math.min(Math.max(1 - Math.abs(hue * 3 - 1), 0), .5) * 2;
    const b = Math.min(Math.max(1 - Math.abs(hue * 3 - 2), 0), .5) * 2;

    const str = "0x"
        + Math.floor(r*255).toString(16).padStart(2, '0')
        + Math.floor(g*255).toString(16).padStart(2, '0')
        + Math.floor(b*255).toString(16).padStart(2, '0');
    
    return Number(str);
}
function RandomHexFull() {
    return HexByHue(Math.random());
}

async function loadTextureRepeat(path){
    const tex = await texLoader.loadAsync(path);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
}
async function loadTextureTile(path, tiling = 1){
    const tex = await loadTextureRepeat(path);
    tex.repeat.set( tiling, tiling );
    return tex;
}

function addMiscMaterials(){
    matsLoaded['Glass0'] = new THREE.MeshPhysicalMaterial({
        transmission: 1,
        thickness: 1,
        roughness: .2,
    });
}

function getDiceUpFace(mesh, name, world){
    const quat = mesh.quaternion;

    let bestY = -99;
    let bestV;

    const faces = diceFaceVectors[name];
    for (let i=0; i<faces.length; i++){
        const blenderVec = faces[i];
        // blender vectors are ( x , z ,-y );

        const vec = new THREE.Vector3(blenderVec.x, blenderVec.z, -blenderVec.y);
        vec.normalize();
        vec.applyQuaternion(quat);
        if (vec.y > bestY) {
            bestY = vec.y;
            bestV = i+1;
        }
    }

    return bestV;
}

class RigidBody {
    constructor(){ }

    setRestitution(val) {
        this.body.setRestitution(val);
    }
    setFriction(val) {
        this.body.setFriction(val);
    }
    setRollingFriction(val) {
        this.body.setRollingFriction(val);
    }

    createBox(mass, pos, quat, size) {
        this.transform = new Ammo.btTransform();
        this.transform.setIdentity();
        this.transform.setOrigin(new Ammo.btVector3(pos.z, pos.y, pos.x));
        this.transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));

        this.motionState = new Ammo.btDefaultMotionState(this.transform);

        const btSize = new Ammo.btVector3(size.x * .5, size.y * .5, size.z *.5);
        this.shape = new Ammo.btBoxShape(btSize);
        this.shape.setMargin(0.05);

        this.inertia = new Ammo.btVector3(0,0,0);
        if (mass > 0){
            this.shape.calculateLocalInertia(mass, this.inertia);
        }

        this.info = new Ammo.btRigidBodyConstructionInfo( mass, this.motionState, this.shape, this.inertia );
        this.body = new Ammo.btRigidBody(this.info);

        Ammo.destroy(btSize);
    }
    createSphere(mass, pos, radius) {
        this.transform = new Ammo.btTransform();
        this.transform.setIdentity();
        this.transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
        this.transform.setRotation(new Ammo.btQuaternion(0, 0, 0, 1));

        this.motionState = new Ammo.btDefaultMotionState(this.transform);

        this.shape = new Ammo.btSphereShape(radius);
        this.shape.setMargin(0.05);

        this.inertia = new Ammo.btVector3(0,0,0);
        if (mass > 0){
            this.shape.calculateLocalInertia(mass, this.inertia);
        }

        this.info = new Ammo.btRigidBodyConstructionInfo( mass, this.motionState, this.shape, this.inertia );
        this.body = new Ammo.btRigidBody(this.info);
    }
    fromMesh(model, mass, pos, quat){
        this.mesh = model.children[0];

        this.transform = new Ammo.btTransform();
        this.transform.setIdentity();
        this.transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
        this.transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));

        this.motionState = new Ammo.btDefaultMotionState(this.transform);

        // convex hull
        /*
        const verticesPos = this.mesh.geometry.getAttribute('position').array;
        let tris = [];
        for (let i=0; i<verticesPos.length; i+=3) {
            tris.push({
                x: verticesPos[i],
                y: verticesPos[i+1],
                z: verticesPos[i+2]
            })
        }

        let triangle, triangle_mesh = new Ammo.btTriangleMesh();
        let vecA = new Ammo.btVector3(0,0,0);
        let vecB = new Ammo.btVector3(0,0,0);
        let vecC = new Ammo.btVector3(0,0,0);

        for (let i=0; i<tris.length-3; i+=3){
            vecA.setX(tris[i].x);
            vecA.setY(tris[i].y);
            vecA.setZ(tris[i].z);

            vecB.setX(tris[i+1].x);
            vecB.setY(tris[i+1].y);
            vecB.setZ(tris[i+1].z);

            vecC.setX(tris[i+2].x);
            vecC.setY(tris[i+2].y);
            vecC.setZ(tris[i+2].z);

            triangle_mesh.addTriangle(vecA, vecB, vecC, true);
        }
        Ammo.destroy(vecA);
        Ammo.destroy(vecB);
        Ammo.destroy(vecC);

        this.shape = new Ammo.btConvexTriangleMeshShape(triangle_mesh, true);
        this.shape.setMargin(0.05);
        */

        /*
        const verticesPos = this.mesh.geometry.getAttribute('position').array;
        let triangle, triangle_mesh = new Ammo.btTriangleMesh();
        let vecA = new Ammo.btVector3(0,0,0);
        let vecB = new Ammo.btVector3(0,0,0);
        let vecC = new Ammo.btVector3(0,0,0);

        for (let i=0; i<verticesPos.length; i+=9) {
            vecA.setX(verticesPos[i]);
            vecA.setY(verticesPos[i+1]);
            vecA.setZ(verticesPos[i+2]);

            vecB.setX(verticesPos[i+3]);
            vecB.setY(verticesPos[i+4]);
            vecB.setZ(verticesPos[i+5]);

            vecC.setX(verticesPos[i+6]);
            vecC.setY(verticesPos[i+7]);
            vecC.setZ(verticesPos[i+8]);

            triangle_mesh.addTriangle(vecA, vecB, vecC, true);
        }

        Ammo.destroy(vecA);
        Ammo.destroy(vecB);
        Ammo.destroy(vecC);

        this.shape = new Ammo.btConvexTriangleMeshShape(triangle_mesh, true);
        this.shape.setMargin(0.05);
        */

        // new empty ammo shape
        const shape = new Ammo.btConvexHullShape();

        //new ammo triangles
        let triangle, triangle_mesh = new Ammo.btTriangleMesh;

        //new ammo vectors
        let vectA = new Ammo.btVector3(0,0,0);
        let vectB = new Ammo.btVector3(0,0,0);
        let vectC = new Ammo.btVector3(0,0,0);

        //retrieve vertices positions from object
        let verticesPos = this.mesh.geometry.getAttribute('position').array;
        let triangles = [];
        for ( let i = 0; i < verticesPos.length; i += 3 ) {
            triangles.push({ x:verticesPos[i], y:verticesPos[i+1], z:verticesPos[i+2] })
        }

        //use triangles data to draw ammo shape
        for ( let i = 0; i < triangles.length-3; i += 3 ) {
            vectA.setX(triangles[i].x);
            vectA.setY(triangles[i].y);
            vectA.setZ(triangles[i].z);
            shape.addPoint(vectA,true);

            vectB.setX(triangles[i+1].x);
            vectB.setY(triangles[i+1].y);
            vectB.setZ(triangles[i+1].z);
            shape.addPoint(vectB,true);

            vectC.setX(triangles[i+2].x);
            vectC.setY(triangles[i+2].y);
            vectC.setZ(triangles[i+2].z);
            shape.addPoint(vectC,true);
                
            triangle_mesh.addTriangle( vectA, vectB, vectC, true );
        }
        this.shape = shape;
        this.shape.setMargin(.2);


        /////////////////////

        this.mesh.geometry.verticesNeedUpdate = true;

        this.inertia = new Ammo.btVector3(0,0,0);
        if (mass > 0){
            this.shape.calculateLocalInertia(mass, this.inertia);
        }

        this.info = new Ammo.btRigidBodyConstructionInfo(mass, this.motionState, this.shape, this.inertia);
        this.body = new Ammo.btRigidBody(this.info);
    }
}


class World {
    constructor() {
        this.rigidBodies = [];
        this.tmpTransform = new Ammo.btTransform();

        this.floorY = 4.5;
        this.rollingDices = [];
        this.rollingDicesOldVel = new Map();
        this.rollingDicesDist = new Map();
        this.rollingDicesRolled = [];
        this.rollingDicesMesh = [];
        this.rollingDicesLight = [];
        this.rollingDicesDone = [];
        this.rollingDiceType = [];
        this.diceAnimFinished = [];

        this.countdown = 0;
        this.spawnCount = 0;
        this.lastTick = 0;
        this.diceMax = 5;
        this.diceResults = [];
    }

    initialize() {
        // Scene initialisation

        this.collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
        this.dispatcher = new Ammo.btCollisionDispatcher(this.collisionConfiguration);
        this.broadphase = new Ammo.btDbvtBroadphase();
        this.solver = new Ammo.btSequentialImpulseConstraintSolver();
        this.physicsWorld = new Ammo.btDiscreteDynamicsWorld(
            this.dispatcher, this.broadphase, this.solver, this.collisionConfiguration
        );
        this.physicsWorld.setGravity(new Ammo.btVector3(0, -200, 0));

        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
        });
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        document.body.appendChild(this.renderer.domElement);

        window.addEventListener('resize', () => {
            this.onWindowResize();
        }, false);

        // camera
        const fov = 60;
        const aspect = 1920/1080;
        const near = 1.0;
        const far = 1000.0;
        this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        this.camera.position.set(75, 20, 0);
        this.camera.add(listener);
        this.onWindowResize();

        // lighting setup
        this.scene = new THREE.Scene();

        if (LOD > 0){
            let light = new THREE.PointLight(0xFFB05C, 3, 100);
            light.position.set(10, 50, 0);
            light.castShadow = true;
            light.shadow.mapSize.width = 256;
            light.shadow.mapSize.height = 256;
            light.shadow.camera.near = .5;
            light.shadow.camera.far = 400;
            this.scene.add(light);
        }

        //light = new THREE.AmbientLight(0x808080);
        //this.scene.add(light);

        // camera controls
        this.controls = new OrbitControls( this.camera, this.renderer.domElement );
        this.controls.enableDamping = true;
        this.controls.target.set(0,20,0);
        this.controls.update();

        // scene
        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(100, 100),
            matsLoaded.Planks024
        );
        ground.rotation.x = -Math.PI / 2;
        ground.castShadow = false;
        ground.receiveShadow = true;


        const rbGround = new RigidBody();
        rbGround.createBox(0, new THREE.Vector3(0,-2.5,0), new THREE.Quaternion(), new THREE.Vector3(500, 5, 500));
        rbGround.setRestitution(0.99);

        this.physicsWorld.addRigidBody(rbGround.body);
        this.scene.add(ground);

        this.ground = ground;

        if (LOD > 0){
            for (let i=0; i<this.diceMax; i++){
                let light = new THREE.PointLight(0xFFB05C, .5, 30);
                light.position.set(500,500,500);
                this.scene.add(light);
                this.rollingDicesLight.push(light);
            }
        }

        // init
        this.cycle();
    }

    spawnDice() {
        const diceTypes = ["d20","d6"];
        //const diceType = ranList(diceTypes);
        const diceType = "d20";

        const meshName = diceType+"a";
        const meshPhy = diceType+"phy";
        const [mesh, rb] = this.createMeshPhysLOD(meshName, meshPhy);

        randomizeModelMaterial(mesh, meshName);

        this.rollingDices.push(rb);
        this.rollingDicesMesh.push(mesh);
        this.rollingDiceType.push(diceType);
    }

    createMesh(name, mat){
        let mesh = meshesLoaded[name].clone();
        if (mat)
            setModelMaterial(model, mat);

        return mesh;
    }
    createMeshPhysLOD(nameMesh, namePhy, mat){
        const mesh = this.createMesh(nameMesh, mat);
        mesh.position.set(Math.random() * 2 - 1, 200.0, Math.random() * 2 - 1);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        let rb = new RigidBody();
        rb.fromMesh(meshesLoaded[namePhy], 1, mesh.position, mesh.quaternion);
        rb.body.setAngularVelocity(new Ammo.btVector3(Math.random()*10, Math.random()*10, Math.random()*10));

        rb.body.setFriction(1);

        this.physicsWorld.addRigidBody(rb.body);
        this.rigidBodies.push({ mesh: mesh, rigidBody: rb});
        this.scene.add(mesh);

        return [mesh, rb];
    }

    spawnObjectCycle() {
        this.countdown -= this.deltaTime;

        if (this.countdown < 0 && this.spawnCount < this.diceMax){
            this.countdown = .1;
            this.spawnCount += 1;

            this.spawnDice();
        }
    }

    diceFinished(mesh, name){
        this.rollingDicesDone.push(mesh);

        const v = getDiceUpFace(mesh, name, this);
        this.diceResults.push(v);
    }
    diceAllFinished() {
        if (! this.diceAllFinisedBool) {
            this.diceAllFinisedBool = true;
            this.diceAllFinisedAnimTime = 0;

            this.dicePlayOrder = [];
            for (let i=0; i<this.diceResults.length; i++){
                const v = this.diceResults[i];

                let priority = v
                if (v==1) {
                    priority = 21;
                }
                this.dicePlayOrder.push([priority, i]);
            }
            this.dicePlayOrder.sort((a, b) => a[0] - b[0]);
        }
        this.diceAllFinisedAnimTime += this.deltaTime;


        for (let x=0; x<this.dicePlayOrder.length; x++){
            const [priority, i] = this.dicePlayOrder[x];

            const v = this.diceResults[i];
            const mesh = this.rollingDicesDone[i];

            if (!this.diceAnimFinished.includes(mesh)){
                if (x/5 < this.diceAllFinisedAnimTime){ //once
                    this.diceAnimFinished.push(mesh);

                    //CSS2DRenderer
                    const el = document.createElement('div')
                    el.className = "diceLabel";
                    el.innerHTML = v;
                    const objectCSS = new CSS2DObject(el);
                    objectCSS.position.set(0, 0, 0)

                    mesh.add(objectCSS);

                    if (v == 1){
                        const sound = playAudio3D('sfxGongFail', mesh, false, .4);
                    } else {
                        const sound = playAudio3D('sfxGong', mesh);
                        sound.setDetune((v-5)*100);

                        if (v==20){
                            const sound2 = playAudio3D('sfxHorn0', mesh, false, .2);
                            sound2.setDetune(500);
                        }
                    }
                }
            }
        }
    }

    refreshDices(){
        for (let i = 0; i<this.rollingDices.length; i++) {
            const rb = this.rollingDices[i];
            const mesh = this.rollingDicesMesh[i];
            const name = this.rollingDiceType[i];

            if (this.rollingDicesDone.includes(mesh)) continue;

            const oldVel = this.rollingDicesOldVel.get(rb);
            const velRef = rb.body.getLinearVelocity();
            let vel = new Ammo.btVector3(velRef.x(),velRef.y(),velRef.z());
            vel.normalize();
            
            if (oldVel) {
                const r = oldVel.dot(vel);
                if (mesh.position.y < this.floorY){
                //if (r<.9 || mesh.position.y < this.floorY){
                    if (this.rollingDicesRolled.includes(rb)){

                        let x = this.rollingDicesDist.get(rb);
                        x -= velRef.length()*this.deltaTime;
                        if (x<0){
                            x = 20;
                            playAudio3D('diceSmall', mesh, 4,
                                Math.min(Math.max(velRef.length()/30, .5),2)
                            );
                        }
                        this.rollingDicesDist.set(rb, x);

                        if (velRef.length()<.1){
                            if (! this.rollingDicesDone.includes(mesh)){
                                this.diceFinished(mesh, name);
                                break; // lazy to fix index issues
                            }
                        }
                    } else {
                        this.rollingDicesRolled.push(rb);
                        playAudio3D('dice', mesh, 6);

                        this.rollingDicesDist.set(rb, 20);
                    }
                }
            }
            this.rollingDicesOldVel.set(rb, vel);

            const light = this.rollingDicesLight[i];
            if (light){
                light.position.set(mesh.position.x, mesh.position.y+10, mesh.position.z);
            }
        }

        // if finished
        if (this.diceMax == this.rollingDicesDone.length){
            this.diceAllFinished();
        }
    }

    refreshCamera() {
        this.cameraDice = true;
        this.cameraDir = new THREE.Vector3(1,-1,1);

        if (this.cameraDice && this.rollingDicesMesh.length>0) {

            // calculate dice bounding box
            let dicesCenter = new THREE.Vector3(0,0,0);
            let minX,minY,minZ, maxX,maxY,maxZ;
            this.rollingDicesMesh.map((mesh) => {
                dicesCenter = dicesCenter.add(mesh.position);
                if (!minX){
                    minX = mesh.position.x;
                    minY = mesh.position.y;
                    minZ = mesh.position.z;
                    maxX = mesh.position.x;
                    maxY = mesh.position.y;
                    maxZ = mesh.position.z;
                }

                if (mesh.position.x < minX){
                    minX = mesh.position.x;
                } if (mesh.position.y < minY){
                    minY = mesh.position.y;
                } if (mesh.position.z < minZ){
                    minZ = mesh.position.z;
                }
                if (mesh.position.x > maxX){
                    maxX = mesh.position.x;
                } if (mesh.position.y > maxY){
                    maxY = mesh.position.y;
                } if (mesh.position.z > maxZ){
                    maxZ = mesh.position.z;
                }
            });
            const vecMin = new THREE.Vector3(minX,minY,minZ);
            const vecMax = new THREE.Vector3(maxX,maxY,maxZ);
            dicesCenter = vecMin.lerp(vecMax, .5);
            const diceMaxDist = vecMin.distanceTo(vecMax);
            //console.log(diceMaxDist);

            const b = dicesCenter.add(this.cameraDir.multiplyScalar(1));
            const a = this.controls.target;
            const r = b.lerp(a, 1-this.deltaTime*5);

            this.controls.target.set(r.x,r.y,r.z);
            this.controls.minDistance = diceMaxDist*.8;
            this.controls.maxDistance = diceMaxDist*1.3;
            this.controls.minPolarAngle = .3;
            this.controls.maxPolarAngle = 1.5;
            this.controls.update();
            //this.controls.lookAt(new THREE.Vector3(0,0,0));
            //this.camera.updateProjectionMatrix ();
        }
        //this.camera.position.set(this.camera.position.lerp())
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        cssRenderer.setSize(window.innerWidth, window.innerHeight);
    }

    step(deltaTimeMil){
        this.deltaTime = Math.min(deltaTimeMil * .001, .2);

        this.spawnObjectCycle();
        
        this.physicsWorld.stepSimulation(this.deltaTime, 10);

        this.rigidBodies.map((links) => {
            links.rigidBody.motionState.getWorldTransform(this.tmpTransform);
            const pos = this.tmpTransform.getOrigin();
            const quat = this.tmpTransform.getRotation();
            const pos3 = new THREE.Vector3(pos.x(), pos.y(), pos.z());
            const quat3 = new THREE.Quaternion(quat.x(), quat.y(), quat.z(), quat.w());

            links.mesh.position.copy(pos3);
            links.mesh.quaternion.copy(quat3);
        });

        this.refreshDices();
        this.refreshCamera();
    }

    cycle() {
        requestAnimationFrame((t) => {
            this.step(t - this.lastTick);
            this.renderer.render(this.scene, this.camera);
            cssRenderer.render(this.scene, this.camera);

            this.lastTick = t;
            this.cycle();
        });
    }
}



loadingManager.onProgress = (url, loaded, total) => {
    elemLoadingBar.value = (loaded / total) * 100;
}
loadingManager.onLoad = () => {
    elemLoadingScreen.style.display = "none";
}


let APP = null;
window.addEventListener('DOMContentLoaded', async () => {
    if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)){
        LOD = 0;
    } else {
        LOD = 1;
    }

    await preloadMeshes();
    await preloadAudio();
    await preloadMaterials();

    Ammo().then((lib) => {
        Ammo = lib;
        APP = new World();

        setTimeout(() => {
            APP.initialize();
        })
    });
});

