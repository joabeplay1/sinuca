export function initUIHandlers(onThrowCallback) {
    const throwBtn = document.getElementById('throw-btn');
    const powerSlider = document.getElementById('power-slider');
    const powerValDisplay = document.querySelector('.power-val');

    // Atualizar display de força ao mover o slider
    powerSlider.addEventListener('input', (e) => {
        powerValDisplay.textContent = `${e.target.value}%`;
    });

    // Lógica do botão THROW
    throwBtn.addEventListener('click', () => {
        const power = powerSlider.value;
        const spin = 0; // Você precisará implementar a lógica do controle de spin

        // Chama a função lá no main.js que por sua vez chama a física
        onThrowCallback(power, spin);

        // Desabilitar botão para evitar múltiplos lançamentos
        throwBtn.disabled = true;
        throwBtn.textContent = "ROLLING...";
        
        // Simular reset após 5 segundos (Em produção, use detecção física)
        setTimeout(() => {
            throwBtn.disabled = false;
            throwBtn.textContent = "THROW";
        }, 5000);
    });
}
