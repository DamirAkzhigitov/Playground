document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.tab-button');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.getAttribute('data-tab');

            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(content => content.classList.remove('active'));

            tab.classList.add('active');
            document.querySelector(`.tab-content[data-tab='${target}']`).classList.add('active');
        });
    });

    // Initialize first tab
    tabs[0].click();

    // Tic Tac Toe game logic
    const cells = document.querySelectorAll('.cell');
    let currentPlayer = 'X';
    const board = Array(9).fill(null);

    cells.forEach(cell => {
        cell.addEventListener('click', () => {
            const index = cell.getAttribute('data-index');
            if (board[index] === null) {
                board[index] = currentPlayer;
                cell.textContent = currentPlayer;
                currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
            }
        });
    });
});
