import * as THREE from 'three';
import { initScene, animateScene, createBowlingBall, launchBall } from './js/scene.js';
import { initUIHandlers } from './js/ui.js';

// 1. Inicializar o ambiente 3D (Câmera, Luzes, Pista)
const { scene, camera, renderer, world } = initScene();

// 2. Carregar Modelos (Pinos e Bola)
// Nota: Em um projeto real, você usaria GLTFLoader aqui.
// Para este exemplo, criaremos formas básicas.
const bowlingBall = createBowlingBall(scene, world);

// 3. Inicializar Ouvintes da UI (Botões, Sliders)
initUIHandlers((power, spin) => {
    // Esta função é chamada quando o jogador clica em "THROW"
    console.log(`Lançando bola com força ${power}% e spin ${spin}`);
    launchBall(bowlingBall, power, spin);
});

// 4. Iniciar Loop de Animação
animateScene(scene, camera, renderer, world);
