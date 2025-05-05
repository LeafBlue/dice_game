// 获取所有骰子元素并存储到数组中
const diceElements = $('.dice'); // jQuery 选择器获取所有带有 .dice 类的元素

var gamestatus = 0;

// 记录当前玩家
let currentPlayer = 1; // 初始为玩家 1


$(document).ready(function () {
    updateButtonState();
});

// 更新当前玩家显示
function updateCurrentPlayerDisplay() {
    $('#currentPlayerDisplay').text(`当前玩家: 玩家 ${currentPlayer}`);
}

// 切换到下一个玩家
function switchPlayer() {
    currentPlayer = currentPlayer === 1 ? 2 : 1; // 切换玩家
    updateCurrentPlayerDisplay(); // 更新显示
}

// 存储玩家最终选择的骰子（最终结果数组）
let finalSelectedDice = {
    ids: [], // 存储选中骰子的 id
    numbers: [] // 存储选中骰子的数字
};

function updateButtonState() {
    if (gamestatus === 0) {
        // 初始状态：只允许“掷出骰子”
        $('#rollDiceBtn').prop('disabled', false);
        $('#rerollDiceBtn').prop('disabled', true);
        $('#finishPlayerBtn').prop('disabled', true);
    } else if (gamestatus === 1) {
        // 已掷骰：禁用“掷出骰子”，启用计分和结束按钮
        $('#rollDiceBtn').prop('disabled', true);
        $('#rerollDiceBtn').prop('disabled', false);
        $('#finishPlayerBtn').prop('disabled', false);
    } else if (gamestatus === 2) {
        // 已计分：启用“掷出骰子”和结束按钮
        $('#rollDiceBtn').prop('disabled', false);
        $('#rerollDiceBtn').prop('disabled', false);
        $('#finishPlayerBtn').prop('disabled', false);
    }
}

// 延迟函数，返回 Promise
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 快速变化数字动画
function animateDice(targetDice, duration = 1000, interval = 100) {
    return new Promise(resolve => {
        const startTime = Date.now();
        const animationInterval = setInterval(() => {
            targetDice.each(function () {
                const randomNumber = Math.floor(Math.random() * 6) + 1;
                $(this).text(randomNumber);
            });
        }, interval);

        setTimeout(() => {
            clearInterval(animationInterval);
            // 设置最终随机数字
            const finalNumbers = [];
            targetDice.each(function () {
                const randomNumber = Math.floor(Math.random() * 6) + 1;
                $(this).text(randomNumber);
                finalNumbers.push(randomNumber);
            });
            console.log(`动画结束，骰子最终数字: ${finalNumbers.join(', ')}`);
            resolve();
        }, duration);
    });
}

// 定义一个函数，用于随机摇出骰子数字
async function rollDice() {
    if (gamestatus === 0 || gamestatus === 2) {
        // 禁用按钮，防止动画期间操作
        $('input[type="button"]').prop('disabled', true);
        // 1秒动画并设置最终数字
        await animateDice(diceElements);
        // 短暂延迟确保 DOM 更新
        await delay(50);
        gamestatus = 1; // 进入等待选择状态
        updateButtonState();

        // 检查是否有可得分的骰子
        if (!hasScorableDice()) {
            handleRoundCollapse();
        }
    }
}

// 重掷未禁用骰子
async function rerollRemainingDice() {
    const targetDice = $('.dice').not('.disabled'); // 未禁用骰子
    // 禁用按钮，防止动画期间操作
    $('input[type="button"]').prop('disabled', true);
    // 1秒动画并设置最终数字
    await animateDice(targetDice);
    // 短暂延迟确保 DOM 更新
    await delay(50);
    gamestatus = 1; // 保持等待选择状态
    updateButtonState();

    // 检查是否有可得分的骰子
    if (!hasScorableDice()) {
        handleRoundCollapse();
    }
}
/*
// 定义一个函数，用于随机摇出骰子数字
function rollDice() {
    if (gamestatus === 0 || gamestatus === 2) {
        diceElements.each(function () {
            const randomNumber = Math.floor(Math.random() * 6) + 1;
            $(this).text(randomNumber);
        });
        gamestatus = 1; // 进入等待选择状态
        updateButtonState();

        // 检查是否有可得分的骰子
        if (!hasScorableDice()) {
            handleRoundCollapse();
        }
    }
}

// 重掷未禁用骰子
function rerollRemainingDice() {
    $('.dice').not('.disabled').each(function () {
        const randomNumber = Math.floor(Math.random() * 6) + 1;
        console.log(`重掷骰子: ID=${$(this).attr('id')}, 新数字=${randomNumber}`);
        $(this).text(randomNumber);
    });
    gamestatus = 1; // 保持等待选择状态
    updateButtonState();

    // 检查是否有可得分的骰子
    if (!hasScorableDice()) {
        handleRoundCollapse();
    }
}
*/

$('.dice').on('click', function () {
    if ($(this).hasClass('disabled')) {
        return; // 如果骰子已被禁用，忽略点击事件
    }
    $(this).toggleClass('selected'); // 切换选中状态
});

// 检查场上剩余可选中骰子的数量
function checkRemainingDice() {
    return $('.dice').not('.disabled').length; // 返回未被禁用的骰子数量
}

// 奖励全新 6 个骰子
function resetAllDice() {
    $('.dice').each(function () {
        $(this).removeClass('selected'); // 移除选中状态
        $(this).removeClass('disabled'); // 移除“不能选”状态
        $(this).text(0); // 更新骰子数字
    });
}

// 将符合条件的骰子设置为“不能选”状态
function disableSelectedDice() {
    $('.dice.selected').each(function () {
        $(this).removeClass('selected'); // 移除选中状态
        $(this).addClass('disabled'); // 添加“不能选”状态
    });
}

// 启用所有骰子
function enableAllDice() {
    $('.dice').each(function () {
        $(this).removeClass('disabled'); // 移除“不能选”状态
        $(this).removeClass('selected'); // 确保没有残留的选中状态
    });
}

// 根据规则计算分数
function calculateScore(selectedNumbers) {
    let score = 0;

    // 统计每个数字的出现次数
    const counts = {};
    selectedNumbers.forEach(num => {
        counts[num] = (counts[num] || 0) + 1;
    });

    // 检查是否是顺子（无需去重）
    const isSmallStraight = [1, 2, 3, 4, 5].every(num => selectedNumbers.includes(num));
    const isLargeStraight = [2, 3, 4, 5, 6].every(num => selectedNumbers.includes(num));
    const isFullStraight = [1, 2, 3, 4, 5, 6].every(num => selectedNumbers.includes(num));

    if (isFullStraight) {
        return 1500; // 顺子 1, 2, 3, 4, 5, 6 分值为 1500
    }
    if (isSmallStraight) {
        return 500; // 小顺子 1, 2, 3, 4, 5 分值为 500
    }
    if (isLargeStraight) {
        return 750; // 小顺子 2, 3, 4, 5, 6 分值为 750
    }

    // 计算其他分数
    for (const num in counts) {
        const count = counts[num];

        if (num == 1) {
            if (count >= 3) {
                // 3个1为1000分，4个为2000分，5个为4000分，6个为8000分
                score += 1000 * Math.pow(2, count - 3);
            } else {
                // 单独的1每个100分
                score += 100 * count;
            }
        } else if (num == 5) {
            if (count >= 3) {
                // 3个5为500分，4个为1000分，5个为2000分，6个为4000分
                score += 500 * Math.pow(2, count - 3);
            } else {
                // 单独的5每个50分
                score += 50 * count;
            }
        } else {
            if (count >= 3) {
                // 3个一样的骰子分值为100乘以骰子数字
                score += (num * 100) * Math.pow(2, count - 3);
            }
        }
    }

    return score;
}

// 扫描所有骰子，将选中的骰子归纳到最终数组中
function collectSelectedDice() {
    finalSelectedDice.ids = []; // 清空之前的 id 数组
    finalSelectedDice.numbers = []; // 清空之前的数字数组

    // 遍历所有骰子，检查是否有 'selected' 类
    $('.dice').each(function () {
        if ($(this).hasClass('selected')) {
            finalSelectedDice.ids.push($(this).attr('id')); // 将选中的骰子 id 添加到数组中
            finalSelectedDice.numbers.push(parseInt($(this).text(), 10)); // 将选中的骰子数字添加到数组中
        }
    });

    //alert('选中的骰子 ID: ' + finalSelectedDice.ids.join(', '));
    //alert('选中的骰子数字: ' + finalSelectedDice.numbers.join(', '));
    console.log('最终选择的骰子:', finalSelectedDice); // 调试输出
}

// 验证玩家选择的骰子是否符合规则
function validateDiceSelection(diceNumbers) {
    if (diceNumbers.length === 0) {
        console.log('无效：没有选择任何骰子');
        return false; // 必须至少选择一个骰子
    }

    // 统计每个数字的出现次数
    const counts = {};
    diceNumbers.forEach(num => {
        counts[num] = (counts[num] || 0) + 1;
    });

    // 检查是否是顺子
    const isSmallStraight = [1, 2, 3, 4, 5].every(num => diceNumbers.includes(num));
    const isLargeStraight = [2, 3, 4, 5, 6].every(num => diceNumbers.includes(num));
    const isFullStraight = [1, 2, 3, 4, 5, 6].every(num => diceNumbers.includes(num));

    if (isSmallStraight || isLargeStraight || isFullStraight) {
        console.log('有效：检测到顺子');
        return true; // 如果是顺子，直接返回有效
    }

    // 检查是否满足其他规则
    let hasValidNumbers = false;

    for (const num in counts) {
        const count = counts[num];

        if (num == 1 || num == 5) {
            hasValidNumbers = true; // 1 和 5 总是有效的
        } else if (count >= 3) {
            hasValidNumbers = true; // 非 1 和 5 的数字必须至少出现 3 次
        } else {
            console.log(`无效：数字 ${num} 出现次数不足`);
            return false; // 不符合条件
        }
    }

    if (!hasValidNumbers) {
        console.log('无效：没有满足条件的数字');
        return false; // 如果没有任何有效数字，返回无效
    }

    console.log('有效：满足所有条件');
    return true; // 如果所有条件都满足，返回有效
}

// 更新当前玩家的本轮得分
function updateThisRoundScore(player, score) {
    if (player === 1) {
        const currentScore = parseInt($('#thisscore1').text(), 10);
        $('#thisscore1').text(currentScore + score);
    } else if (player === 2) {
        const currentScore = parseInt($('#thisscore2').text(), 10);
        $('#thisscore2').text(currentScore + score);
    }
}

// 更新当前玩家的总得分
function updateTotalScore(player, score) {
    const targetScore = parseInt($('#allscore').text(), 10); // 获取目标分数（4000）
	let totalScore;
	let roundScore; // 本轮累计得分

	if (player === 1) {
		roundScore = parseInt($('#thisscore1').text(), 10); // 读取本轮得分
		totalScore = parseInt($('#score1').text(), 10);
		totalScore += roundScore; // 使用本轮累计得分
		$('#score1').text(totalScore); // 更新玩家1总得分
	} else if (player === 2) {
		roundScore = parseInt($('#thisscore2').text(), 10); // 读取本轮得分
		totalScore = parseInt($('#score2').text(), 10);
		totalScore += roundScore; // 使用本轮累计得分
		$('#score2').text(totalScore); // 更新玩家2总得分
	}

	// 检查是否达到胜利条件
	if (totalScore >= targetScore) {
		alert(`玩家 ${player} 获胜！总得分：${totalScore}！游戏结束。`);
		// 禁用所有操作按钮，防止继续游戏
		$('input[type="button"]').prop('disabled', true);
		// 禁用骰子点击
		$('.dice').addClass('disabled');
		console.log(`玩家 ${player} 获胜，游戏结束`);
	}
}

// 清空当前玩家的本轮得分
function resetThisRoundScore(player) {
    if (player === 1) {
        $('#thisscore1').text(0); // 清空玩家1本轮得分
    } else if (player === 2) {
        $('#thisscore2').text(0); // 清空玩家2本轮得分
    }
}

// 玩家点击 "计分并掷出" 按钮时执行的函数
function rerollDice() {
	if (gamestatus !== 1) {
		alert('请先掷骰或完成当前操作！');
		return;
	}
	
    collectSelectedDice(); // 收集玩家选择
    const isValid = validateDiceSelection(finalSelectedDice.numbers); // 验证选择
    if (isValid) {
        console.log('重新掷骰子逻辑...');

        // 禁用选中的骰子
        disableSelectedDice();

        // 计算分数
        const score = calculateScore(finalSelectedDice.numbers);

        // 更新本轮得分
        updateThisRoundScore(currentPlayer, score);

        // 清空最终选择数组（因为骰子已被禁用）
        finalSelectedDice.ids = [];
        finalSelectedDice.numbers = [];

        // 检查场上剩余可选中骰子的数量
        const remainingDiceCount = checkRemainingDice();
        if (remainingDiceCount === 0) {
			alert('场上没有可供选择的骰子，奖励全新 6 个骰子！');
			resetAllDice(); // 奖励全新 6 个骰子
			finalSelectedDice.ids = [];
			finalSelectedDice.numbers = [];
			gamestatus = 0; // 恢复初始状态
			updateButtonState();
		} else {
			rerollRemainingDice(); // 重掷未禁用骰子
		}

        console.log(`本轮得分为: ${score}`);
    } else {
        alert('选择无效，重新选择');
        return;
    }
}

// 玩家点击 "计分并结束" 按钮时执行的函数
function finishthisplayer() {
    collectSelectedDice(); // 收集玩家选择
    const isValid = validateDiceSelection(finalSelectedDice.numbers); // 验证选择
    if (isValid) {
        console.log('结束当前玩家回合逻辑...');

        // 禁用选中的骰子
        disableSelectedDice();

        // 计算分数
        const score = calculateScore(finalSelectedDice.numbers);

        // 更新本轮得分
        updateThisRoundScore(currentPlayer, score);

        // 将本轮得分加到总得分
        updateTotalScore(currentPlayer, score);

        // 清空最终选择数组（因为骰子已被禁用）
        finalSelectedDice.ids = [];
        finalSelectedDice.numbers = [];

        // 清空本轮得分
        resetThisRoundScore(currentPlayer);

        // 切换玩家
        switchPlayer();

        // 重置所有骰子状态
        resetAllDice();
		finalSelectedDice.ids = [];
		finalSelectedDice.numbers = [];

        // 重置 gamestatus
        gamestatus = 0;
        updateButtonState();

        console.log(`本轮得分为: ${score}`);
    } else {
        alert('选择无效，重新选择');
        return;
    }
}

// 检查是否有可得分的骰子
function hasScorableDice() {
    const remainingDice = $('.dice').not('.disabled'); // 获取未被禁用的骰子
    const diceNumbers = [];

    // 收集未被禁用的骰子数字
    remainingDice.each(function () {
        const num = parseInt($(this).text(), 10);
        if (!isNaN(num)) {
            diceNumbers.push(num);
        }
    });

    console.log(`检查可得分骰子，当前数字: ${diceNumbers.join(', ')}`);

    // 如果没有有效数字，返回 false
    if (diceNumbers.length === 0) {
        console.log('无未禁用骰子，判定崩溃');
        return false;
    }

    // 统计每个数字的出现次数
    const counts = {};
    diceNumbers.forEach(num => {
        counts[num] = (counts[num] || 0) + 1;
    });

    // 检查是否有可得分的组合
    for (const num in counts) {
        const count = counts[num];
        if (num == 1 || num == 5) {
            console.log(`发现可得分数字: ${num} (1 或 5)`);
            return true; // 1 和 5 总是有效的
        } else if (count >= 3) {
            console.log(`发现可得分组合: ${num} 出现 ${count} 次`);
            return true; // 非 1 和 5 的数字至少出现 3 次有效
        }
    }

    // 检查是否是顺子
    const isSmallStraight = [1, 2, 3, 4, 5].every(num => diceNumbers.includes(num));
    const isLargeStraight = [2, 3, 4, 5, 6].every(num => diceNumbers.includes(num));
    const isFullStraight = [1, 2, 3, 4, 5, 6].every(num => diceNumbers.includes(num));

    if (isSmallStraight) {
        console.log('发现可得分组合: 小顺子 1-2-3-4-5');
        return true;
    }
    if (isLargeStraight) {
        console.log('发现可得分组合: 大顺子 2-3-4-5-6');
        return true;
    }
    if (isFullStraight) {
        console.log('发现可得分组合: 满顺子 1-2-3-4-5-6');
        return true;
    }

    console.log('无任何可得分组合，判定崩溃');
    return false;
}


// 处理“本轮崩溃”逻辑
function handleRoundCollapse() {
    alert('本轮崩溃！当前玩家无法得分，切换到下一玩家。');

    // 清空当前玩家的本轮得分
    resetThisRoundScore(currentPlayer);

    // 切换玩家
    switchPlayer();

    // 重置所有骰子状态
    resetAllDice();
	finalSelectedDice.ids = [];
	finalSelectedDice.numbers = [];

    // 重置游戏状态
    gamestatus = 0;
	updateButtonState();
}

// 重置游戏函数
function resetGame() {
    // 重置玩家得分
    $('#thisscore1').text(0); // 清空玩家1本轮得分
    $('#thisscore2').text(0); // 清空玩家2本轮得分
    $('#score1').text(0); // 清空玩家1总得分
    $('#score2').text(0); // 清空玩家2总得分

    // 重置游戏状态
    gamestatus = 0; // 恢复初始状态
	updateButtonState();
    currentPlayer = 1; // 恢复为玩家1
    updateCurrentPlayerDisplay(); // 更新当前玩家显示

    // 重置骰子状态
    resetAllDice(); // 重置所有骰子（移除选中和禁用状态，生成新随机数）

    // 清空最终选择数组
    finalSelectedDice.ids = [];
    finalSelectedDice.numbers = [];

    // 启用所有按钮（以防游戏结束时禁用了按钮）
    $('input[type="button"]').prop('disabled', false);

    console.log('游戏已重置');
}