let board = ['', '', '', '', '', '', '', '', ''];
let currentPlayer = 'X';

const cells = document.querySelectorAll('.cell');
const restartButton = document.getElementById('restart');

cells.forEach((cell, index) => {
    cell.addEventListener('click', () => {
        if (cell.textContent === '' && !checkWin()) {
            cell.textContent = currentPlayer;
            board[index] = currentPlayer;
            if (checkWin()) {
                setTimeout(() => alert(`${currentPlayer} wins!`), 10);
            }
            currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        }
    });
});

restartButton.addEventListener('click', () => {
    board.fill('');
    cells.forEach(cell => (cell.textContent = ''));
    currentPlayer = 'X';
});

function checkWin() {
    const winPatterns = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6],
    ];
    return winPatterns.some(pattern => {
        const [a, b, c] = pattern;
        return board[a] && board[a] === board[b] && board[a] === board[c];
    });
}