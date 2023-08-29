
import * as THREE         from 'three';
import {OrbitControls}    from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader}       from 'three/addons/loaders/GLTFLoader.js';
import { CSS2DRenderer, CSS2DObject }  from 'three/addons/renderers/CSS2DRenderer.js';

const listener = new THREE.AudioListener();
var loader = new GLTFLoader();

const contentHolder = document.getElementById("contentHolder");

const cssRenderer = new CSS2DRenderer({element: contentHolder});
cssRenderer.setSize(window.innerWidth, window.innerHeight);
cssRenderer.domElement.style.position = 'absolute';
cssRenderer.domElement.style.top = '0px';
document.body.appendChild(cssRenderer.domElement);

var volume3D = 2;

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

var pbrMatsLoaded = {};
var pbrMatsFolder = "assets/textures";
var pbrMatsPath = {
    "Planks024":  ["map", "normalMap", "roughnessMap", "metalnessMap", "-tile:4","-normalScale:10"],
    "Marble009":  ["map", "normalMap", "roughnessMap", "-tile:2"],
    "Marble008":  ["map", "normalMap", "roughnessMap", "-tile:2", "-side:DoubleSide"],
    //"Wood060a":   ["map", "normalMap", "roughnessMap", "aoMap", "displacementMap", "-tile:8"],
    "Lava001":    ["map", "normalMap", "roughnessMap", "emissiveMap", "-tile:2", "_emissiveIntensity:1", "_emissive:0xFF0000"],

    "Glass0":    ["-mat:MeshPhysicalMaterial", "_transmission:1", "_thickness:1", "_roughness:.2"],
}

var modelRandomMaterial = {
    "d20a": [
        ["Marble008"],
        ["Marble009","Glass0"],
    ],
    "d6a": [
        ["Marble009","Glass0"],
        ["Marble008"],
    ],
}

var diceFaceVectors = {
    d20: [
        new THREE.Vector3( 1.21,  3.71, -0.74),
        new THREE.Vector3( 1.21, -3.71, -0.74),
        new THREE.Vector3(-0.74,  2.29,  3.16),
        new THREE.Vector3(-1.95, -1.42, -3.16),
        new THREE.Vector3( 2.41,     0, -3.16),

        new THREE.Vector3(-3.90, 0, 0.74),//6
        new THREE.Vector3(3.16, 2.29, 0.74),
        new THREE.Vector3(-0.74, -2.29, 3.15),
        new THREE.Vector3(-3.15, 2.29, -.74),
        new THREE.Vector3(1.95, -1.41, 3.15),

        new THREE.Vector3(-1.95, 1.41, -3.15),
        new THREE.Vector3(3.15, -2.29, 0.74),
        new THREE.Vector3(0.74, 2.29, -3.15),
        new THREE.Vector3(-3.15, -2.29, -0.74),
        new THREE.Vector3(3.90, 0, -0.74),

        new THREE.Vector3(-2.41, 0, 3.15),
        new THREE.Vector3(1.95, 1.41, 3.15),
        new THREE.Vector3(0.74, -2.29, -3.15),
        new THREE.Vector3(-1.20, 3.71, 0.74),
        new THREE.Vector3(-1.20, -3.71, 0.74),
    ],
    d6: [
        new THREE.Vector3(0,0,-3),
        new THREE.Vector3(0,-3,0),
        new THREE.Vector3(3,0,0),
        new THREE.Vector3(-3,0,0),
        new THREE.Vector3(0,3,0),
        new THREE.Vector3(0,0,3),
    ],
}

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
        mesh.children[i].material = pbrMatsLoaded[ranList(layers[i])];
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

function preloadMaterials() {
    for (const [name, data] of Object.entries(pbrMatsPath)){
        const folder = pbrMatsFolder+"/"+name+"/";
        const ext = ".jpg";

        const textures = {};
        const args = [];
        let matType = THREE.MeshStandardMaterial;

        for (let i = 0; i<data.length; i++){
            const name = data[i];
            if (name.charAt(0) == "-") {
                args.push(name.substring(1,name.length));

            } else if (name.charAt(0) == "_") {
                const [k,v] = name.substring(1,name.length).split(":");
                if (v.startsWith("0x")){
                    textures[k] = parseInt(v, 16);
                } else {
                    textures[k] = parseFloat(v);
                }
            } else {
                textures[name] = loadTextureRepeat(folder+name+ext);
            }
        }

        // custom arguments
        args.map((str) => {
            const v = str.split(":")[1];
            if (str.startsWith("tile")){
                Array.from(Object.values(textures)).map((tex) => {
                    if (typeof(tex) == 'object'){
                        tex.repeat.set(v,v);
                    }
                });
            }
            if (str.startsWith("mat")){
                matType = THREE[v];
            }
            if (str.startsWith("side")){
                textures.side = THREE[v];
            }
            if (str.startsWith("normalScale")){
                textures.normalScale = new THREE.Vector2(v,v);
            }
        });

        //MeshPhongMaterial
        pbrMatsLoaded[name] = new matType(textures);
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

const texLoader = new THREE.TextureLoader();
function loadTextureRepeat(path){
    const tex = texLoader.load(path);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
}
function loadTextureTile(path, tiling = 1){
    const tex = loadTextureRepeat(path);
    tex.repeat.set( tiling, tiling );
    return tex;
}

function addMiscMaterials(){
    pbrMatsLoaded['Glass0'] = new THREE.MeshPhysicalMaterial({
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


class BasicWorldDemo {
    constructor() {
        this.floorY = 10;
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

        let light = new THREE.PointLight(0xFFB05C, 1, 100);
        light.position.set(10, 50, 0);
        light.castShadow = true;
        light.shadow.mapSize.width = 512;
        light.shadow.mapSize.height = 512;
        light.shadow.camera.near = .5;
        light.shadow.camera.far = 500;
        this.scene.add(light);

        //light = new THREE.AmbientLight(0x808080);
        //this.scene.add(light);

        // camera controls
        this.controls = new OrbitControls( this.camera, this.renderer.domElement );
        this.controls.enableDamping = true;
        this.controls.target.set(0,20,0);
        this.controls.update();

        // scene
        const ground = new THREE.Mesh(
            new THREE.BoxGeometry(500, 1, 500),
            pbrMatsLoaded.Planks024
        );
        ground.castShadow = false;
        ground.receiveShadow = true;


        const rbGround = new RigidBody();
        rbGround.createBox(0, ground.position, ground.quaternion, new THREE.Vector3(500, 1, 500));
        rbGround.setRestitution(0.99);

        this.physicsWorld.addRigidBody(rbGround.body);
        this.scene.add(ground);

        this.ground = ground;

        // init
        this.rigidBodies = [];
        this.tmpTransform = new Ammo.btTransform();

        this.cycle();

        for (let i=0; i<this.diceMax; i++){
            let light = new THREE.PointLight(0xFFB05C, 1, 30);
            light.position.set(500,500,500);
            this.scene.add(light);
            this.rollingDicesLight.push(light);
        }
    }

    spawnDice() {
        const diceTypes = ["d20","d6"];
        //const diceType = ranList(diceTypes);
        const diceType = "d6";

        const meshName = diceType+"phy";
        const meshPhy = diceType+"phy";
        const [mesh, rb] = this.createMeshPhysLOD(meshName, meshPhy);

        //randomizeModelMaterial(mesh, meshName);

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
                if (r<.9 || mesh.position.y < this.floorY){
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
            light.position.set(mesh.position.x, mesh.position.y+10, mesh.position.z);
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


let APP = null;

window.addEventListener('DOMContentLoaded', async () => {
    await preloadMeshes();
    await preloadAudio();
    preloadMaterials();

    Ammo().then((lib) => {
        Ammo = lib;
        APP = new BasicWorldDemo();
        APP.initialize();
    });
});

