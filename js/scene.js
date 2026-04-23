import * as THREE from 'three';
import * as OIMO from 'oimo'; // Motor de física simples e rápido

let renderer, scene, camera, world;
let ballBody, ballMesh;

export function initScene() {
    // Container
    const container = document.getElementById('game-container');

    // 1. Scene & Renderer
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050a18); // Fundo escuro
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // 2. Camera (Posição clássica atrás do jogador)
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.5, 5); // x, y (altura), z (distância)
    camera.lookAt(0, 0, -10); // Olhando para o fim da pista

    // 3. Luzes (Neon Style)
    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    scene.add(ambientLight);

    const spotLight = new THREE.SpotLight(0xffffff, 10);
    spotLight.position.set(0, 5, 0);
    spotLight.castShadow = true;
    scene.add(spotLight);
    
    // Luzes de Neon laterais (Glow)
    const blueNeon = new THREE.PointLight(0x00d9ff, 5, 20);
    blueNeon.position.set(-2, 1, -5);
    scene.add(blueNeon);

    // 4. A Pista (Chão)
    const laneGeometry = new THREE.BoxGeometry(2, 0.1, 20);
    // Nota: Você precisará de uma textura de madeira real aqui
    const laneMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.1 }); 
    const lane = new THREE.Mesh(laneGeometry, laneMaterial);
    lane.position.set(0, -0.05, -10);
    lane.receiveShadow = true;
    scene.add(lane);

    // 5. Inicializar Motor de Física (OIMO)
    world = new OIMO.World({ 
        timestep: 1/60, 
        iterations: 8, 
        broadphase: 2, // 1: brute force, 2: sweep & prune, 3: volume tree
        worldscale: 1, 
        random: true, 
        info: false,
        gravity: [0,-9.8,0] 
    });

    // Chão Físico
    world.add({size:[2, 0.1, 20], pos:[0,-0.05,-10], rot:[0,0,0], move:false, density:1});

    // 6. Criar Pinos (Exemplo de 1 pino)
    createPin(scene, world, 0, 0, -18); // Fim da pista

    window.addEventListener('resize', onWindowResize, false);

    return { scene, camera, renderer, world };
}

function createPin(scene, world, x, y, z) {
    // Visual
    const pinGeom = new THREE.CylinderGeometry(0.05, 0.1, 0.4, 16);
    const pinMat = new THREE.MeshStandardMaterial({color: 0xffffff});
    const pinMesh = new THREE.Mesh(pinGeom, pinMat);
    pinMesh.position.set(x, y + 0.2, z);
    pinMesh.castShadow = true;
    scene.add(pinMesh);

    // Física
    world.add({
        type: 'cylinder',
        size: [0.1, 0.4, 0.1], // raio top, altura, raio bot (Oimo usa diâmetro em alguns casos, verifique doc)
        pos: [x, y + 0.2, z],
        move: true,
        density: 1,
        friction: 0.2,
        restitution: 0.5,
        belongsTo: 1, // bits
        collidesWith: 0xffffffff // bits
    });
}

export function createBowlingBall(scene, world) {
    // Visual
    const ballGeom = new THREE.SphereGeometry(0.11, 32, 32); // Tamanho escala aproximada
    // Textura da bola azul da imagem
    const ballMat = new THREE.MeshStandardMaterial({ color: 0x0000ff, roughness: 0.2 });
    ballMesh = new THREE.Mesh(ballGeom, ballMat);
    ballMesh.position.set(0, 0.11, 3); // Posição inicial na frente da camera
    ballMesh.castShadow = true;
    scene.add(ballMesh);

    // Física
    ballBody = world.add({
        type: 'sphere',
        size: [0.11],
        pos: [0, 0.11, 3],
        move: true,
        density: 10, // Bola de boliche é pesada
        friction: 0.1,
        restitution: 0.5
    });

    return { mesh: ballMesh, body: ballBody };
}

export function launchBall(ball, power, spin) {
    // Converte power (0-100) em força física (z negativo)
    const forceZ = -(power * 0.5); // Ajuste este multiplicador
    const forceX = spin * 0.1; // Spin desvia a bola

    // Aplica impulso no motor físico
    ball.body.applyImpulse({x:0, y:0, z:0}, {x: forceX, y: 0, z: forceZ});
}

export function animateScene(scene, camera, renderer, world) {
    requestAnimationFrame(() => animateScene(scene, camera, renderer, world));

    // 1. Atualizar Mundo Físico
    world.step();

    // 2. Sincronizar Visual (Three) com Física (Oimo)
    // Para cada objeto móvel, precisamos copiar a posição/rotação
    if (ballMesh && ballBody) {
        ballMesh.position.copy(ballBody.getPosition());
        ballMesh.quaternion.copy(ballBody.getQuaternion());
    }
    
    // (Você precisará fazer um loop para os pinos também)

    // 3. Renderizar
    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
