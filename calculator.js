const display = document.getElementById('display');
const buttons = document.querySelectorAll('#buttons button');

buttons.forEach(button => {
    button.addEventListener('click', () => {
        const value = button.getAttribute('data-value');
        if (value === 'C') {
            display.value = '';
        } else if (value === '=') {
            try {
                display.value = eval(display.value) || '';
            } catch {
                display.value = 'Error';
            }
        } else {
            display.value += value;
        }
    });
});

// Note: eval() is used for simplicity but should be avoided in production code
// due to security risks. This is for demonstration purposes only.