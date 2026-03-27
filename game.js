// 游戏配置
const BOARD_SIZE = 8;
const CANDY_TYPES = ['🍎', '🍊', '🍇', '🍓', '🍒', '🍑'];
const MIN_MATCH = 3;

// 关卡配置
const LEVELS = [
    { targetScore: 1000, maxMoves: 20 },
    { targetScore: 2000, maxMoves: 25 },
    { targetScore: 3500, maxMoves: 30 },
    { targetScore: 5000, maxMoves: 35 },
    { targetScore: 7000, maxMoves: 40 },
    { targetScore: 10000, maxMoves: 45 },
    { targetScore: 13000, maxMoves: 50 },
    { targetScore: 17000, maxMoves: 55 },
    { targetScore: 21000, maxMoves: 60 },
    { targetScore: 26000, maxMoves: 65 }
];

// 游戏状态
let board = [];
let score = 0;
let moves = 0;
let selectedCell = null;
let isProcessing = false;
let currentLevel = 0;
let hintCells = [];

// 初始化游戏
function initGame() {
    score = 0;
    moves = 0;
    selectedCell = null;
    isProcessing = false;
    hintCells = [];
    document.getElementById('levelComplete').style.display = 'none';
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

// 下一关
function nextLevel() {
    currentLevel++;
    if (currentLevel >= LEVELS.length) {
        alert('🎉 恭喜！您已完成所有关卡！');
        currentLevel = 0;
    }
    initGame();
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
            
            // 添加提示样式
            if (hintCells.some(hint => hint.row === row && hint.col === col)) {
                cell.classList.add('hint');
            }
            
            cell.addEventListener('click', handleCellClick);
            gameBoard.appendChild(cell);
        }
    }
}

// 处理单元格点击
async function handleCellClick(e) {
    if (isProcessing) return;
    
    const row = parseInt(e.target.dataset.row);
    const col = parseInt(e.target.dataset.col);
    
    // 清除提示
    clearHint();
    
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
            await swapCandies(prevRow, prevCol, row, col);
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
        
        // 检查是否完成关卡
        checkLevelComplete();
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
    document.getElementById('level').textContent = currentLevel + 1;
    document.getElementById('targetScore').textContent = LEVELS[currentLevel].targetScore;
}

// 检查关卡完成
function checkLevelComplete() {
    const targetScore = LEVELS[currentLevel].targetScore;
    
    if (score >= targetScore) {
        document.getElementById('finalScore').textContent = score;
        document.getElementById('levelComplete').style.display = 'block';
        isProcessing = true;
    }
}

// 清除提示
function clearHint() {
    hintCells = [];
    renderBoard();
}

// 显示提示
function showHint() {
    if (isProcessing) return;
    
    // 查找所有可能的移动
    const possibleMoves = findPossibleMoves();
    
    if (possibleMoves.length === 0) {
        alert('没有可用的移动！');
        return;
    }
    
    // 随机选择一个提示
    const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
    hintCells = [
        { row: randomMove.row1, col: randomMove.col1 },
        { row: randomMove.row2, col: randomMove.col2 }
    ];
    
    renderBoard();
}

// 查找所有可能的移动
function findPossibleMoves() {
    const moves = [];
    
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            // 尝试向右交换
            if (col < BOARD_SIZE - 1) {
                // 临时交换
                const temp = board[row][col];
                board[row][col] = board[row][col + 1];
                board[row][col + 1] = temp;
                
                // 检查是否有匹配
                if (findMatches().length > 0) {
                    moves.push({ row1: row, col1: col, row2: row, col2: col + 1 });
                }
                
                // 恢复
                board[row][col + 1] = board[row][col];
                board[row][col] = temp;
            }
            
            // 尝试向下交换
            if (row < BOARD_SIZE - 1) {
                // 临时交换
                const temp = board[row][col];
                board[row][col] = board[row + 1][col];
                board[row + 1][col] = temp;
                
                // 检查是否有匹配
                if (findMatches().length > 0) {
                    moves.push({ row1: row, col1: col, row2: row + 1, col2: col });
                }
                
                // 恢复
                board[row + 1][col] = board[row][col];
                board[row][col] = temp;
            }
        }
    }
    
    return moves;
}

// 辅助函数：延迟
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 启动游戏
initGame();
