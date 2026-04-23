const canvas = document.getElementById('poolTable');
const ctx = canvas.getContext('2d');

// --- CONFIGURAÇÕES DE PROPORÇÃO PROFISSIONAL ---
let GAME_SCALE = 1; // Definido dinamicamente no resize
const PROPORTIONS = {
    tableAspectRatio: 2 / 1, // Comprimento : Largura
    ballToTableRatio: 0.025, // Diâmetro da bola é 2.5% da largura da mesa
    pocketToBallRatio: 1.8,   // Buraco é 1.8x maior que a bola (Profissional)
    cueWidthToBall: 0.2,     // Ponta do taco em relação à bola
};

let tableSettings = {};
let balls = [];
let whiteBall;
let poolCue;

// --- 1. FUNÇÃO DE RESIZE (Aumenta a Mesa e Tudo Junto) ---
function resizeGame() {
    // Define o tamanho do canvas baseado na janela, mantendo a proporção 2:1
    let windowWidth = window.innerWidth;
    let windowHeight = window.innerHeight;

    if (windowWidth / windowHeight > PROPORTIONS.tableAspectRatio) {
        canvas.height = windowHeight * 0.95; // 95% da altura para deixar margem
        canvas.width = canvas.height * PROPORTIONS.tableAspectRatio;
    } else {
        canvas.width = windowWidth * 0.95;
        canvas.height = canvas.width / PROPORTIONS.tableAspectRatio;
    }

    // Define a Escala Global baseada na nova largura da mesa
    GAME_SCALE = canvas.width / 1000; // Baseamos nossa física em uma mesa virtual de 1000px

    // Atualiza Tamanhos dos Elementos
    tableSettings.ballRadius = (canvas.width * PROPORTIONS.ballToTableRatio) / 2;
    tableSettings.pocketRadius = tableSettings.ballRadius * PROPORTIONS.pocketToBallRatio;
    tableSettings.cushionWidth = tableSettings.pocketRadius * 0.8; // Borda da mesa

    console.log(`Mesa redimensionada: ${canvas.width}x${canvas.height}. Bola Radius: ${tableSettings.ballRadius}`);
    
    // Recria/Repocisiona as bolas se necessário aqui
    if(whiteBall) whiteBall.radius = tableSettings.ballRadius;
}

// Chama no início e quando a janela mudar de tamanho
window.addEventListener('resize', resizeGame);
resizeGame(); // Primeira execução


// --- 2. CLASSE BOLA ATUALIZADA (Maior e com Atrito Profissional) ---
class Ball {
    constructor(x, y, radius, color, isWhite = false) {
        this.x = x; this.y = y;
        this.radius = radius;
        this.color = color;
        this.isWhite = isWhite;
        this.velX = 0; this.velY = 0;
        // Atrito físico real (não depende do FPS se usar deltaTime, mas vamos simplificar)
        this.friction = 0.988; 
    }

    draw() {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        
        // --- IDEIA PROFISSIONAL: Sombra e Brilho (Efeito 3D) ---
        // Sombra Projetada na mesa
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 10 * GAME_SCALE;
        ctx.shadowOffsetX = 3 * GAME_SCALE;
        ctx.shadowOffsetY = 5 * GAME_SCALE;
        ctx.fill();
        ctx.restore();

        // Brilho (Highlight) para parecer esférica
        ctx.beginPath();
        ctx.arc(this.x - this.radius*0.3, this.y - this.radius*0.3, this.radius/3, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fill();
        ctx.closePath();
    }

    update() {
        this.velX *= this.friction;
        this.velY *= this.friction;

        // Parada suave (Dead zone)
        if (Math.abs(this.velX) < 0.05 * GAME_SCALE) this.velX = 0;
        if (Math.abs(this.velY) < 0.05 * GAME_SCALE) this.velY = 0;

        this.x += this.velX;
        this.y += this.velY;
        
        // Lógica de colisão com bordas e caçapas vai aqui, usando tableSettings
    }
}


// --- 3. CLASSE TACO DE SINUCA (Professional Pool Cue) ---
class Cue {
    constructor(whiteBall) {
        this.whiteBall = whiteBall;
        this.angle = 0; // Ângulo de mira em radianos
        this.power = 0; // Força da tacada
        this.maxPower = 50 * GAME_SCALE;
        this.isDragging = false;
        this.length = canvas.width * 0.4; // Taco longo, 40% da mesa
    }

    update(mouseX, mouseY) {
        // Calcula o ângulo entre o mouse e a bola branca
        this.angle = Math.atan2(mouseY - this.whiteBall.y, mouseX - this.whiteBall.x);
    }

    draw(mouseX, mouseY) {
        if (!this.whiteBall || whiteBall.velX !== 0 || whiteBall.velY !== 0) return; // Só desenha se a branca estiver parada

        // Desenha a linha de mira (Guideline) à frente da bola
        ctx.beginPath();
        ctx.lineWidth = 1 * GAME_SCALE;
        ctx.setLineDash([5 * GAME_SCALE, 5 * GAME_SCALE]);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.moveTo(this.whiteBall.x, this.whiteBall.y);
        ctx.lineTo(this.whiteBall.x + Math.cos(this.angle) * 500 * GAME_SCALE, this.whiteBall.y + Math.sin(this.angle) * 500 * GAME_SCALE);
        ctx.stroke();
        ctx.setLineDash([]); // Reseta tracejado
        ctx.closePath();

        // Desenha o Taco atrás da bola
        const cueTipDistance = this.whiteBall.radius + 5 * GAME_SCALE + this.power; // Distância da ponta à bola
        const startX = this.whiteBall.x - Math.cos(this.angle) * cueTipDistance;
        const startY = this.whiteBall.y - Math.sin(this.angle) * cueTipDistance;
        const endX = this.whiteBall.x - Math.cos(this.angle) * (cueTipDistance + this.length);
        const endY = this.whiteBall.y - Math.sin(this.angle) * (cueTipDistance + this.length);

        ctx.beginPath();
        ctx.lineWidth = tableSettings.ballRadius * PROPORTIONS.cueWidthToBall;
        ctx.lineCap = 'round';

        // --- IDEIA PROFISSIONAL: Degradê no Taco (Efeito Madeira) ---
        let gradient = ctx.createLinearGradient(startX, startY, endX, endY);
        gradient.addColorStop(0, '#f1c40f'); // Ponta amarela/giz
        gradient.addColorStop(0.1, '#e67e22'); // Madeira clara
        gradient.addColorStop(1, '#A0522D');   // Madeira escura (Cabo)
        
        ctx.strokeStyle = gradient;
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.closePath();
    }
    
    shoot() {
        // Aplica a velocidade baseada no 'power' e no 'angle'
        this.whiteBall.velX = Math.cos(this.angle) * this.power * 0.5;
        this.whiteBall.velY = Math.sin(this.angle) * this.power * 0.5;
        this.power = 0; // Reseta força
    }
}

// --- INITIALIZATION & LOOP ---
function init() {
    whiteBall = new Ball(canvas.width / 4, canvas.height / 2, tableSettings.ballRadius, 'white', true);
    poolCue = new Cue(whiteBall);
    
    // Adicione os event listeners de mouse (mousedown, mousemove, mouseup) para interagir com o taco
    window.addEventListener('mousemove', (e) => poolCue.update(e.clientX, e.clientY));
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Desenhar a Mesa (Fundo verde com sombra nas bordas)
    ctx.fillStyle = '#0a6c3f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Desenhar Buracos (Grandes e Profissionais)
    // Exemplo: Buraco Superior Esquerdo
    ctx.beginPath();
    ctx.arc(tableSettings.cushionWidth, tableSettings.cushionWidth, tableSettings.pocketRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#111'; // Preto fosco
    ctx.fill();
    ctx.closePath();

    whiteBall.update();
    whiteBall.draw();
    poolCue.draw(); // O taco desenha a mira

    requestAnimationFrame(gameLoop);
}

// Iniciar
init();
gameLoop();
