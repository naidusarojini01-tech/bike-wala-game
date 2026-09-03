// --- Game Variables & Physics Setup ---
let scene, camera, renderer;
let bike, road, terrain;
let speed = 0;
const maxSpeed = 700; // Max speed set to 700 KM/H
const acceleration = 2.5;
const deceleration = 1.2;
const friction = 0.5;
let bikeX = 0;
const roadWidth = 20;

// Key state tracker
const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    w: false,
    s: false,
    a: false,
    d: false
};

// --- Initialization ---
function init() {
    // 1. Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    scene.fog = new THREE.FogExp2(0x1a1a2e, 0.003);

    // 2. Camera setup
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);

    // 3. Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(20, 40, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);

    // 5. Build World & Bike
    createRoad();
    createTerrain();
    createBike();

    // 6. Event Listeners
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('keydown', (e) => handleKey(e, true));
    window.addEventListener('keyup', (e) => handleKey(e, false));

    // 7. Start Loop
    animate();
}

// --- Create 3D Realistic Bike ---
function createBike() {
    bike = new THREE.Group();

    // Bike Frame / Body
    const bodyGeo = new THREE.BoxGeometry(0.8, 0.6, 2.2);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xff0033, roughness: 0.2, metalness: 0.8 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.8;
    body.castShadow = true;
    bike.add(body);

    // Windshield
    const glassGeo = new THREE.BoxGeometry(0.6, 0.4, 0.5);
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.1, metalness: 0.9 });
    const windshield = new THREE.Mesh(glassGeo, glassMat);
    windshield.position.set(0, 1.2, -0.3);
    windshield.rotation.x = -0.4;
    bike.add(windshield);

    // Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 32);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 });
    
    // Front Wheel
    const frontWheel = new THREE.Mesh(wheelGeo, wheelMat);
    frontWheel.rotation.z = Math.PI / 2;
    frontWheel.position.set(0, 0.4, -1);
    frontWheel.castShadow = true;
    bike.add(frontWheel);

    // Rear Wheel
    const rearWheel = new THREE.Mesh(wheelGeo, wheelMat);
    rearWheel.rotation.z = Math.PI / 2;
    rearWheel.position.set(0, 0.4, 1);
    rearWheel.castShadow = true;
    bike.add(rearWheel);

    scene.add(bike);
}

// --- Create Infinite Road ---
function createRoad() {
    const roadGeo = new THREE.PlaneGeometry(roadWidth, 2000);
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 });
    road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.z = -800;
    road.receiveShadow = true;
    scene.add(road);

    // Road Markings
    const lineGeo = new THREE.PlaneGeometry(0.4, 2000);
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const centerLine = new THREE.Mesh(lineGeo, lineMat);
    centerLine.rotation.x = -Math.PI / 2;
    centerLine.position.set(0, 0.01, -800);
    scene.add(centerLine);
}

// --- Environment Terrain ---
function createTerrain() {
    const terrainGeo = new THREE.PlaneGeometry(400, 2000);
    const terrainMat = new THREE.MeshStandardMaterial({ color: 0x052e16, roughness: 0.9 });
    terrain = new THREE.Mesh(terrainGeo, terrainMat);
    terrain.rotation.x = -Math.PI / 2;
    terrain.position.y = -0.01;
    terrain.position.z = -800;
    scene.add(terrain);
}

// --- Controls Input Handler ---
function handleKey(e, isPressed) {
    if (keys.hasOwnProperty(e.key) || keys.hasOwnProperty(e.key.toLowerCase())) {
        keys[e.key] = isPressed;
        keys[e.key.toLowerCase()] = isPressed;
    }
}

// --- Main Game Loop ---
function animate() {
    requestAnimationFrame(animate);

    // 1. Acceleration & Speed Physics
    if (keys.ArrowUp || keys.w) {
        if (speed < maxSpeed) speed += acceleration;
    } else if (keys.ArrowDown || keys.s) {
        if (speed > 0) speed -= deceleration * 2;
    } else {
        if (speed > 0) speed -= friction;
    }

    if (speed < 0) speed = 0;

    // 2. Steering Physics
    const turnSpeed = 0.08 * (speed / maxSpeed + 0.2);
    if (keys.ArrowLeft || keys.a) {
        if (speed > 0) bikeX -= turnSpeed * 8;
    }
    if (keys.ArrowRight || keys.d) {
        if (speed > 0) bikeX += turnSpeed * 8;
    }

    // Road Boundary Limits
    bikeX = Math.max(-roadWidth / 2 + 1, Math.min(roadWidth / 2 - 1, bikeX));

    // Update Bike Position & Lean Effect
    bike.position.x = bikeX;
    
    // Realistic Lean on turns
    let targetLean = 0;
    if ((keys.ArrowLeft || keys.a) && speed > 10) targetLean = 0.35;
    if ((keys.ArrowRight || keys.d) && speed > 10) targetLean = -0.35;
    bike.rotation.z += (targetLean - bike.rotation.z) * 0.1;

    // High Speed Camera Dynamics & FOV Warp
    const speedFactor = speed / maxSpeed;
    camera.position.x = bike.position.x * 0.7;
    camera.position.y = bike.position.y + 2.8 + speedFactor * 0.5;
    camera.position.z = bike.position.z + 6.5 + speedFactor * 2.0;
    
    // Dynamic FOV for speed sensation
    camera.fov = 60 + speedFactor * 25;
    camera.updateProjectionMatrix();

    camera.lookAt(bike.position.x, bike.position.y + 1.2, bike.position.z - 10);

    // Move Environment relative to Speed
    const moveDistance = (speed / 3.6) * 0.08;
    road.position.z += moveDistance;
    if (road.position.z > 0) road.position.z = -800;

    // Update Speedometer UI
    document.getElementById('speed').innerText = Math.floor(speed);

    renderer.render(scene, camera);
}

// Window Resize Handler
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Initialize on Load
window.onload = init;
