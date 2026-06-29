document.addEventListener('DOMContentLoaded', () => {
    // --- Seletores do DOM ---
    const mainDisplay = document.getElementById('main-display');
    const historyDisplay = document.getElementById('history-display');
    const calculatorContainer = document.querySelector('.calculator-container');
    const themeToggle = document.getElementById('theme-toggle');
    const modeButtons = document.querySelectorAll('.mode-button');
    const modeSpecificButtons = document.querySelectorAll('.mode-specific-buttons');
    const keyboard = document.querySelector('.keyboard');

    const fullHistoryPanel = document.getElementById('full-history-panel');
    const fullHistoryList = document.getElementById('full-history-list');
    const clearHistoryButton = document.getElementById('clear-history');
    const closeHistoryButton = document.getElementById('close-history');

    const programmerDecDisplay = document.getElementById('prog-dec');
    const programmerBinDisplay = document.getElementById('prog-bin');
    const programmerHexDisplay = document.getElementById('prog-hex');
    const baseRadios = document.querySelectorAll('input[name="base"]');

    const unitCategorySelect = document.getElementById('unit-category');
    const unitFromSelect = document.getElementById('unit-from');
    const unitToSelect = document.getElementById('unit-to');
    const unitInput = document.getElementById('unit-input');
    const unitOutput = document.getElementById('unit-output');
    const convertUnitButton = document.getElementById('convert-unit');

    const billAmountInput = document.getElementById('bill-amount');
    const tipPercentInput = document.getElementById('tip-percent');
    const numPeopleInput = document.getElementById('num-people');
    const calculateTipButton = document.getElementById('calculate-tip');
    const tipTotalSpan = document.getElementById('tip-total');
    const totalWithTipSpan = document.getElementById('total-with-tip');
    const tipPerPersonSpan = document.getElementById('tip-per-person');

    // --- Estado da Calculadora ---
    let currentInput = '0';
    let storedOperator = '';
    let previousInput = '';
    let memory = 0;
    let waitForNewNumber = false;
    let angleUnit = 'DEG'; 
    let currentMode = 'standard';
    let history = [];
    let programmerBase = 'dec';

    // --- Funções Principais de Exibição ---
    function updateDisplay(value) {
        if (value === 'Erro') {
            mainDisplay.textContent = 'Erro';
            return;
        }
        if (value.length > 15) {
            mainDisplay.textContent = parseFloat(value).toPrecision(12);
        } else {
            mainDisplay.textContent = value;
        }
    }

    function updateHistoryDisplay(expression) {
        historyDisplay.textContent = expression;
    }

    function resetCalculator() {
        currentInput = '0';
        storedOperator = '';
        previousInput = '';
        waitForNewNumber = false;
        updateDisplay(currentInput);
        updateHistoryDisplay('');
        if (currentMode === 'programmer') {
            updateProgrammerDisplay(0);
        }
    }

    // --- Operações Básicas de Cálculo ---
    function calculate() {
        if (!previousInput || !storedOperator || waitForNewNumber) return;

        let num1 = parseFloat(previousInput);
        let num2 = parseFloat(currentInput);
        let currentExpression = `${previousInput} ${storedOperator} ${currentInput}`;
        let calculatedResult;

        try {
            switch (storedOperator) {
                case '+': calculatedResult = num1 + num2; break;
                case '-': calculatedResult = num1 - num2; break;
                case '*': calculatedResult = num1 * num2; break;
                case '/':
                    if (num2 === 0) throw new Error("Divisão por zero");
                    calculatedResult = num1 / num2;
                    break;
                case '^': calculatedResult = Math.pow(num1, num2); break;
                default: return;
            }

            if (isNaN(calculatedResult) || !isFinite(calculatedResult)) {
                throw new Error("Resultado indefinido");
            }

            currentInput = calculatedResult.toString();
            updateDisplay(currentInput);
            addHistory(currentExpression, currentInput);
            previousInput = '';
            storedOperator = '';
            waitForNewNumber = true;
        } catch (error) {
            currentInput = 'Erro';
            updateDisplay(currentInput);
            updateHistoryDisplay(error.message);
            previousInput = '';
            storedOperator = '';
            waitForNewNumber = true;
        }
    }

    function addHistory(expression, result) {
        history.push({ expression: expression, result: result });
        renderHistoryList();
    }

    function renderHistoryList() {
        fullHistoryList.innerHTML = '';
        history.slice().reverse().forEach((item) => {
            const li = document.createElement('li');
            li.innerHTML = `<span class="expression">${item.expression}</span><span class="result">${item.result}</span>`;
            li.addEventListener('click', () => {
                currentInput = item.result;
                updateDisplay(currentInput);
                fullHistoryPanel.classList.remove('visible');
            });
            fullHistoryList.appendChild(li);
        });
        if (history.length > 0) {
            historyDisplay.textContent = history[history.length - 1].expression + ' =';
        } else {
            historyDisplay.textContent = '';
        }
    }

    // --- Event Listeners do Teclado Virtual ---
    keyboard.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (!button) return;

        const action = button.dataset.action;
        const op = button.dataset.op;
        const func = button.dataset.func;
        const bitwise = button.dataset.bitwise;
        const hex = button.dataset.hex;

        if (button.classList.contains('number-button') && !button.disabled) {
            if (currentInput === '0' || waitForNewNumber || currentInput === 'Erro') {
                currentInput = button.textContent;
                waitForNewNumber = false;
            } else {
                currentInput += button.textContent;
            }
            updateDisplay(currentInput);
            if (currentMode === 'programmer') {
                let currentRadix = programmerBase === 'hex' ? 16 : programmerBase === 'bin' ? 2 : 10;
                updateProgrammerDisplay(parseInt(currentInput, currentRadix));
            }
        } else if (button.classList.contains('func-button')) {
            handleFunction(action);
        } else if (button.classList.contains('operator-button')) {
            handleOperator(op);
        } else if (button.classList.contains('equals-button')) {
            calculate();
        } else if (button.classList.contains('scientific-button') && currentMode === 'scientific') {
            handleScientificFunction(func);
        } else if (button.classList.contains('bitwise-button') && currentMode === 'programmer') {
            handleBitwiseOperation(bitwise);
        } else if (button.classList.contains('programmer-button') && currentMode === 'programmer') {
             if (programmerBase === 'hex' && hex) {
                if (currentInput === '0' || waitForNewNumber || currentInput === 'Erro') {
                    currentInput = hex;
                    waitForNewNumber = false;
                } else {
                    currentInput += hex;
                }
                updateDisplay(currentInput);
                updateProgrammerDisplay(parseInt(currentInput, 16));
            }
        }
    });

    function handleOperator(op) {
        if (currentInput === 'Erro') return;
        if (previousInput && storedOperator && !waitForNewNumber) {
            calculate();
        }
        previousInput = currentInput;
        storedOperator = op;
        updateHistoryDisplay(`${previousInput} ${op.replace('*', '×').replace('/', '÷')}`);
        waitForNewNumber = true;
    }

    function handleFunction(action) {
        if (currentInput === 'Erro') {
            if (action === 'clear-all' || action === 'clear-entry') resetCalculator();
            return;
        }

        let num = parseFloat(currentInput);
        switch (action) {
            case 'clear-all': resetCalculator(); break;
            case 'clear-entry':
                currentInput = '0';
                updateDisplay(currentInput);
                break;
            case 'backspace':
                currentInput = currentInput.slice(0, -1);
                if (currentInput === '' || currentInput === '-') currentInput = '0';
                updateDisplay(currentInput);
                break;
            case 'negate':
                currentInput = (num * -1).toString();
                updateDisplay(currentInput);
                break;
            case 'decimal':
                if (!currentInput.includes('.')) currentInput += '.';
                updateDisplay(currentInput);
                break;
            case 'memory-clear': memory = 0; break;
            case 'memory-recall':
                currentInput = memory.toString();
                updateDisplay(currentInput);
                waitForNewNumber = true;
                break;
            case 'memory-add': memory += num; break;
            case 'memory-subtract': memory -= num; break;
        }
    }

    // --- Funções do Modo Científico ---
    const DEG_TO_RAD = Math.PI / 180;

    function toRadians(angle) { return angleUnit === 'DEG' ? angle * DEG_TO_RAD : angle; }

    function handleScientificFunction(func) {
        if (currentInput === 'Erro') return;
        let num = parseFloat(currentInput);
        let calculatedResult;
        let expression = '';

        try {
            switch (func) {
                case 'toggle-angle-unit':
                    angleUnit = angleUnit === 'DEG' ? 'RAD' : 'DEG';
                    const angleUnitButton = document.querySelector('[data-func="toggle-angle-unit"]');
                    if (angleUnitButton) angleUnitButton.textContent = angleUnit;
                    return;
                case 'sin': calculatedResult = Math.sin(toRadians(num)); expression = `sin(${num})`; break;
                case 'cos': calculatedResult = Math.cos(toRadians(num)); expression = `cos(${num})`; break;
                case 'tan':
                    if (Math.abs(Math.cos(toRadians(num))) < 1e-10) throw new Error("Tan indefinida");
                    calculatedResult = Math.tan(toRadians(num));
                    expression = `tan(${num})`;
                    break;
                case 'sqrt':
                    if (num < 0) throw new Error("Raiz de número negativo");
                    calculatedResult = Math.sqrt(num);
                    expression = `√(${num})`;
                    break;
                case 'pow2': calculatedResult = Math.pow(num, 2); expression = `(${num})²`; break;
                case 'powY': handleOperator('^'); return;
                case 'log':
                    if (num <= 0) throw new Error("Log inválido");
                    calculatedResult = Math.log10(num); expression = `log(${num})`;
                    break;
                case 'ln':
                    if (num <= 0) throw new Error("Ln inválido");
                    calculatedResult = Math.log(num); expression = `ln(${num})`;
                    break;
                case 'exp': calculatedResult = Math.exp(num); expression = `e^(${num})`; break;
                case 'pi': currentInput = Math.PI.toString(); updateDisplay(currentInput); waitForNewNumber = true; return;
                case 'e': currentInput = Math.E.toString(); updateDisplay(currentInput); waitForNewNumber = true; return;
                default: return;
            }
            if (isNaN(calculatedResult) || !isFinite(calculatedResult)) throw new Error("Resultado inválido");
            currentInput = parseFloat(calculatedResult.toPrecision(15)).toString();
            updateDisplay(currentInput);
            updateHistoryDisplay(expression + ' =');
            addHistory(expression, currentInput);
            waitForNewNumber = true;
        } catch (error) {
            currentInput = 'Erro';
            updateDisplay(currentInput);
            updateHistoryDisplay(error.message);
            waitForNewNumber = true;
        }
    }

    // --- Funções do Modo Programador ---
    function updateProgrammerDisplay(num) {
        if (isNaN(num)) {
            programmerDecDisplay.textContent = 'NaN';
            programmerBinDisplay.textContent = 'NaN';
            programmerHexDisplay.textContent = 'NaN';
            return;
        }
        programmerDecDisplay.textContent = num.toString(10);
        programmerBinDisplay.textContent = num.toString(2);
        programmerHexDisplay.textContent = num.toString(16).toUpperCase();

        switch (programmerBase) {
            case 'dec': updateDisplay(num.toString(10)); break;
            case 'bin': updateDisplay(num.toString(2)); break;
            case 'hex': updateDisplay(num.toString(16).toUpperCase()); break;
        }
    }

    function handleProgrammerInput(base) {
        const numButtons = keyboard.querySelectorAll('.number-button');
        const hexButtons = keyboard.querySelectorAll('[data-hex]');

        numButtons.forEach(button => button.disabled = false);
        hexButtons.forEach(button => { button.disabled = true; button.classList.add('disabled'); });

        switch (base) {
            case 'bin':
                numButtons.forEach(button => {
                    if (parseInt(button.textContent) > 1) button.disabled = true;
                });
                break;
            case 'hex':
                hexButtons.forEach(button => { button.disabled = false; button.classList.remove('disabled'); });
                break;
        }
    }

    baseRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            programmerBase = e.target.value;
            handleProgrammerInput(programmerBase);
            let currentDecimalValue = 0;
            try {
                switch (programmerBase) {
                    case 'dec': currentDecimalValue = parseInt(currentInput, 10); break;
                    case 'bin': currentDecimalValue = parseInt(currentInput, 2); break;
                    case 'hex': currentDecimalValue = parseInt(currentInput, 16); break;
                }
                if (isNaN(currentDecimalValue)) currentDecimalValue = 0;
            } catch { currentDecimalValue = 0; }

            currentInput = currentDecimalValue.toString();
            updateProgrammerDisplay(currentDecimalValue);
            waitForNewNumber = true;
        });
    });

    function handleBitwiseOperation(operation) {
        if (currentInput === 'Erro' || !previousInput) return;
        let num1 = parseInt(previousInput, 10);
        let num2 = parseInt(currentInput, 10);
        let calculatedResult;

        try {
            switch (operation) {
                case 'and': calculatedResult = num1 & num2; break;
                case 'or': calculatedResult = num1 | num2; break;
                case 'xor': calculatedResult = num1 ^ num2; break;
                case 'not': calculatedResult = ~num1; break;
                case 'shl': calculatedResult = num1 << num2; break;
                case 'shr': calculatedResult = num1 >> num2; break;
                default: return;
            }
            currentInput = calculatedResult.toString(10);
            updateProgrammerDisplay(calculatedResult);
            waitForNewNumber = true;
        } catch {
            currentInput = 'Erro';
            updateDisplay(currentInput);
        }
    }

    // --- Funções do Conversor de Unidades ---
    const units = {
        length: { meters: 1, feet: 3.28084, miles: 0.000621371 },
        mass: { kilograms: 1, pounds: 2.20462, ounces: 35.274 },
        temperature: {
            celsius: (val, to) => to === 'fahrenheit' ? (val * 9/5) + 32 : to === 'kelvin' ? val + 273.15 : val,
            fahrenheit: (val, to) => to === 'celsius' ? (val - 32) * 5/9 : to === 'kelvin' ? ((val - 32) * 5/9) + 273.15 : val,
            kelvin: (val, to) => to === 'celsius' ? val - 273.15 : to === 'fahrenheit' ? ((val - 273.15) * 9/5) + 32 : val
        }
    };

    function populateUnitSelectors(category) {
        unitFromSelect.innerHTML = ''; unitToSelect.innerHTML = '';
        const items = category === 'temperature' ? ['celsius', 'fahrenheit', 'kelvin'] : Object.keys(units[category]);

        items.forEach(unit => {
            const formatted = unit.charAt(0).toUpperCase() + unit.slice(1);
            unitFromSelect.innerHTML += `<option value="${unit}">${formatted}</option>`;
            unitToSelect.innerHTML += `<option value="${unit}">${formatted}</option>`;
        });
        unitOutput.value = '';
    }

    function convertUnits() {
        const category = unitCategorySelect.value;
        const fromUnit = unitFromSelect.value;
        const toUnit = unitToSelect.value;
        const value = parseFloat(unitInput.value);

        if (isNaN(value)) { unitOutput.value = 'Inválido'; return; }

        let result = category === 'temperature' ? units.temperature[fromUnit](value, toUnit) : (value / units[category][fromUnit]) * units[category][toUnit];
        unitOutput.value = isNaN(result) ? 'Erro' : result.toFixed(6);
    }

    unitCategorySelect.addEventListener('change', (e) => { populateUnitSelectors(e.target.value); convertUnits(); });
    unitInput.addEventListener('input', convertUnits);
    unitFromSelect.addEventListener('change', convertUnits);
    unitToSelect.addEventListener('change', convertUnits);
    convertUnitButton.addEventListener('click', convertUnits);

    // --- Funções da Calculadora de Gorjetas ---
    function calculateTip() {
        const bill = parseFloat(billAmountInput.value);
        const tipPercent = parseFloat(tipPercentInput.value);
        const numPeople = parseInt(numPeopleInput.value);

        if (isNaN(bill) || isNaN(tipPercent) || isNaN(numPeople) || bill < 0 || tipPercent < 0 || numPeople <= 0) {
            tipTotalSpan.textContent = '0.00'; totalWithTipSpan.textContent = '0.00'; tipPerPersonSpan.textContent = '0.00';
            return;
        }
        const tipAmount = bill * (tipPercent / 100);
        const totalAmount = bill + tipAmount;
        tipTotalSpan.textContent = tipAmount.toFixed(2);
        totalWithTipSpan.textContent = totalAmount.toFixed(2);
        tipPerPersonSpan.textContent = (totalAmount / numPeople).toFixed(2);
    }

    calculateTipButton.addEventListener('click', calculateTip);
    billAmountInput.addEventListener('input', calculateTip);
    tipPercentInput.addEventListener('input', calculateTip);
    numPeopleInput.addEventListener('input', calculateTip);

    // --- Alternar Modos e Temas (UI/UX) ---
    themeToggle.addEventListener('click', () => {
        calculatorContainer.dataset.theme = calculatorContainer.dataset.theme === 'dark' ? 'light' : 'dark';
        themeToggle.textContent = calculatorContainer.dataset.theme === 'dark' ? '🌙' : '☀️';
    });

    modeButtons.forEach(button => {
        button.addEventListener('click', () => {
            modeButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentMode = button.dataset.mode;
            
            modeSpecificButtons.forEach(section => section.classList.add('hidden'));
            document.querySelector(`.${currentMode}-mode`).classList.remove('hidden');

            if (currentMode === 'unit-converter') populateUnitSelectors(unitCategorySelect.value);
            else if (currentMode === 'tip-calculator') calculateTip();
            else if (currentMode === 'programmer') handleProgrammerInput(programmerBase);
            resetCalculator();
        });
    });

    // --- Painel Histórico ---
    historyDisplay.addEventListener('click', () => fullHistoryPanel.classList.add('visible'));
    closeHistoryButton.addEventListener('click', () => fullHistoryPanel.classList.remove('visible'));
    clearHistoryButton.addEventListener('click', () => { history = []; renderHistoryList(); });

    // --- Suporte ao Teclado Físico ---
    document.addEventListener('keydown', (e) => {
        if (e.key >= '0' && e.key <= '9') {
            const btn = Array.from(keyboard.querySelectorAll('.number-button')).find(b => b.textContent.trim() === e.key);
            if (btn && !btn.disabled) btn.click();
        } else if (['+', '-', '*', '/'].includes(e.key)) {
            const opButton = keyboard.querySelector(`.operator-button[data-op="${e.key}"]`);
            if (opButton) opButton.click();
        } else if (e.key === 'Enter' || e.key === '=') {
            const eq = keyboard.querySelector('[data-action="calculate"]');
            if (eq) eq.click();
        } else if (e.key === 'Backspace') {
            const bs = keyboard.querySelector('[data-action="backspace"]');
            if (bs) bs.click();
        } else if (e.key.toLowerCase() === 'c') {
            const cl = keyboard.querySelector('[data-action="clear-all"]');
            if (cl) cl.click();
        }
    });

    // Inicialização do Sistema
    resetCalculator();
    populateUnitSelectors(unitCategorySelect.value);
    calculateTip();
});
