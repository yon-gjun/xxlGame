// 游戏配置
const BOARD_SIZE = 8;
const CANDY_TYPES = ['🍎', '🍊', '🍇', '🍓', '🍒', '🍑'];
const MIN_MATCH = 3;

// 游戏状态
let board = [];
let score = 0;
let moves = 0;
let selectedCell = null;
let isProcessing = false;

// 初始化游戏
function initGame() {
    score = 0;
    moves = 0;
    selectedCell = null;
    isProcessing = false;
    updateScoreBoard();
    createBoard();
    renderBoard();
    
    // 消除初始匹配
    while (findMatches().length > 0) {
        removeMatches(findMatches());
        dropCandies();
        fillEmptySpaces();
    }
    renderBoard();
}

// 创建游戏板
function createBoard() {
    board = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
        board[row] = [];
        for (let col = 0; col < BOARD_SIZE; col++) {
            board[row][col] = getRandomCandy();
        }
    }
}

// 获取随机糖果
function getRandomCandy() {
    return CANDY_TYPES[Math.floor(Math.random() * CANDY_TYPES.length)];
}

// 渲染游戏板
function renderBoard() {
    const gameBoard = document.getElementById('gameBoard');
    gameBoard.innerHTML = '';
    
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.textContent = board[row][col];
            cell.dataset.row = row;
            cell.dataset.col = col;
            
            if (selectedCell && selectedCell.row === row && selectedCell.col === col) {
                cell.classList.add('selected');
            }
            
            cell.addEventListener('click', handleCellClick);
            gameBoard.appendChild(cell);
        }
    }
}

// 处理单元格点击
function handleCellClick(e) {
    if (isProcessing) return;
    
    const row = parseInt(e.target.dataset.row);
    const col = parseInt(e.target.dataset.col);
    
    if (!selectedCell) {
        // 选择第一个单元格
        selectedCell = { row, col };
        renderBoard();
    } else {
        // 选择第二个单元格
        const prevRow = selectedCell.row;
        const prevCol = selectedCell.col;
        selectedCell = null;
        
        // 检查是否相邻
        if (isAdjacent(prevRow, prevCol, row, col)) {
            swapCandies(prevRow, prevCol, row, col);
        } else {
            // 如果不是相邻，选择新的单元格
            if (prevRow !== row || prevCol !== col) {
                selectedCell = { row, col };
                renderBoard();
            }
        }
    }
}

// 检查是否相邻
function isAdjacent(row1, col1, row2, col2) {
    const rowDiff = Math.abs(row1 - row2);
    const colDiff = Math.abs(col1 - col2);
    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}

// 交换糖果
async function swapCandies(row1, col1, row2, col2) {
    isProcessing = true;
    
    // 交换
    const temp = board[row1][col1];
    board[row1][col1] = board[row2][col2];
    board[row2][col2] = temp;
    
    renderBoard();
    
    // 等待动画
    await sleep(300);
    
    // 检查匹配
    const matches = findMatches();
    
    if (matches.length > 0) {
        moves++;
        updateScoreBoard();
        await processMatches(matches);
    } else {
        // 没有匹配，换回来
        const temp = board[row1][col1];
        board[row1][col1] = board[row2][col2];
        board[row2][col2] = temp;
        renderBoard();
        isProcessing = false;
    }
}

// 处理匹配
async function processMatches(matches) {
    let totalMatches = matches.length;
    
    while (matches.length > 0) {
        // 移除匹配的糖果
        await removeMatches(matches);
        score += matches.length * 10;
        updateScoreBoard();
        
        // 等待动画
        await sleep(300);
        
        // 下落
        dropCandies();
        renderBoard();
        
        // 等待动画
        await sleep(300);
        
        // 填充空格
        fillEmptySpaces();
        renderBoard();
        
        // 等待动画
        await sleep(300);
        
        // 检查新的匹配
        matches = findMatches();
        if (matches.length > 0) {
            totalMatches += matches.length;
        }
    }
    
    isProcessing = false;
}

// 查找所有匹配
function findMatches() {
    const matches = [];
    
    // 水平匹配
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE - 2; col++) {
            const candy = board[row][col];
            if (candy === null) continue;
            
            let matchCount = 1;
            while (col + matchCount < BOARD_SIZE && board[row][col + matchCount] === candy) {
                matchCount++;
            }
            
            if (matchCount >= MIN_MATCH) {
                for (let i = 0; i < matchCount; i++) {
                    const match = { row, col: col + i };
                    if (!matches.some(m => m.row === match.row && m.col === match.col)) {
                        matches.push(match);
                    }
                }
            }
            col += matchCount - 1;
        }
    }
    
    // 垂直匹配
    for (let col = 0; col < BOARD_SIZE; col++) {
        for (let row = 0; row < BOARD_SIZE - 2; row++) {
            const candy = board[row][col];
            if (candy === null) continue;
            
            let matchCount = 1;
            while (row + matchCount < BOARD_SIZE && board[row + matchCount][col] === candy) {
                matchCount++;
            }
            
            if (matchCount >= MIN_MATCH) {
                for (let i = 0; i < matchCount; i++) {
                    const match = { row: row + i, col };
                    if (!matches.some(m => m.row === match.row && m.col === match.col)) {
                        matches.push(match);
                    }
                }
            }
            row += matchCount - 1;
        }
    }
    
    return matches;
}

// 移除匹配的糖果
async function removeMatches(matches) {
    const cells = document.querySelectorAll('.cell');
    
    matches.forEach(match => {
        const index = match.row * BOARD_SIZE + match.col;
        if (cells[index]) {
            cells[index].classList.add('matched');
        }
        board[match.row][match.col] = null;
    });
    
    renderBoard();
}

// 下落糖果
function dropCandies() {
    for (let col = 0; col < BOARD_SIZE; col++) {
        let emptyRow = BOARD_SIZE - 1;
        
        for (let row = BOARD_SIZE - 1; row >= 0; row--) {
            if (board[row][col] !== null) {
                board[emptyRow][col] = board[row][col];
                if (emptyRow !== row) {
                    board[row][col] = null;
                }
                emptyRow--;
            }
        }
    }
}

// 填充空格
function fillEmptySpaces() {
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (board[row][col] === null) {
                board[row][col] = getRandomCandy();
            }
        }
    }
}

// 更新记分板
function updateScoreBoard() {
    document.getElementById('score').textContent = score;
    document.getElementById('moves').textContent = moves;
}

// 辅助函数：延迟
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 启动游戏
initGame();
