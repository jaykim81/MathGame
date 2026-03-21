// DOM Elements
const screenTitle = document.getElementById('screen-title');
const screenGame = document.getElementById('screen-game');
const screenResult = document.getElementById('screen-result');
const gameContainer = document.getElementById('game-container');

const btnStart = document.getElementById('btn-start');
const btnRestart = document.getElementById('btn-restart');
const btnGiveup = document.getElementById('btn-giveup');
const btnSaveRank = document.getElementById('btn-save-rank');
const levelSelect = document.getElementById('level-select');
const fileUpload = document.getElementById('enemy-face-upload');
const facePreview = document.getElementById('enemy-face-preview');
const faceEditPanel = document.getElementById('face-edit-panel');
const faceZoom = document.getElementById('face-zoom');
const faceOffsetX = document.getElementById('face-offset-x');
const faceOffsetY = document.getElementById('face-offset-y');
const faceTarget = document.getElementById('face-target');
const enemyFaceOverlay = document.getElementById('enemy-face-overlay');
const playerFaceOverlay = document.getElementById('player-face-overlay');

const playerHpBar = document.getElementById('player-hp-bar');
const enemyHpBar = document.getElementById('enemy-hp-bar');
const timerText = document.getElementById('timer-text');
const timerBar = document.getElementById('timer-bar');
const scoreText = document.getElementById('score-val');
const stageNumText = document.getElementById('stage-num-val');
const enemyNameText = document.getElementById('enemy-name');

const playerEl = document.getElementById('player');
const enemyEl = document.getElementById('enemy');
const playerDmg = document.getElementById('player-damage');
const enemyDmg = document.getElementById('enemy-damage');
const playerBubble = document.getElementById('player-bubble');
const enemyBubble = document.getElementById('enemy-bubble');

const questionText = document.getElementById('question-text');
const answerBtns = document.querySelectorAll('.answer-btn');

const leaderboardTable = document.querySelector('#leaderboard-table tbody');
const playerNameInput = document.getElementById('player-name-input');
const finalScoreText = document.getElementById('final-score');
const topInfoBar = document.getElementById('top-info-bar');

// Sound Functions
const Sound = {
    ctx: null,
    bgmInterval: null,
    init() { if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)(); },
    play(freq, type, duration, vol, ramp) {
        this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        if (ramp) osc.frequency.exponentialRampToValueAtTime(ramp, this.ctx.currentTime + duration);
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(); osc.stop(this.ctx.currentTime + duration);
    },
    startBGM() {
        if (this.bgmInterval) return;
        this.init();
        let i = 0;
        this.bgmInterval = setInterval(() => {
            this.play([130, 146, 164, 174][i % 4], 'sine', 0.8, 0.03);
            i++;
        }, 1000);
    },
    stopBGM() {
        if (this.bgmInterval) {
            clearInterval(this.bgmInterval);
            this.bgmInterval = null;
        }
    },
    win() {
        this.play(261.63, 'square', 0.1, 0.1);
        setTimeout(() => this.play(329.63, 'square', 0.1, 0.1), 100);
        setTimeout(() => this.play(392.00, 'square', 0.3, 0.1), 200);
    },
    loss() {
        this.play(220.00, 'sawtooth', 0.2, 0.1, 110);
        setTimeout(() => this.play(110.00, 'sawtooth', 0.5, 0.1, 55), 200);
    },
    click() {
        this.play(440, 'sine', 0.05, 0.1);
    }
};

// Game Constants & Data
const MAX_HP = 100;
const STAGES = [
    { name: "심심한 원숭이", emoji: "🐵", hp: 100, entryMsg: "안녕! 나랑 놀자!" },
    { name: "용감한 강아지", emoji: "🐶", hp: 100, entryMsg: "멍멍! 준비됐어?" },
    { name: "영리한 여우", emoji: "🦊", hp: 120, entryMsg: "후후, 좀 어려울걸?" },
    { name: "배고픈 늑대", emoji: "🐺", hp: 120, entryMsg: "크르르... 배고파!" },
    { name: "백수의 왕 사자", emoji: "🦁", hp: 140, entryMsg: "내가 바로 왕이다!" },
    { name: "줄무늬 호랑이", emoji: "🐯", hp: 140, entryMsg: "어흥! 도망갈 수 없다!" },
    { name: "괴력 고릴라", emoji: "🦍", hp: 160, entryMsg: "우호! 우호호!" },
    { name: "고대 공룡", emoji: "Rex", emoji: "🦖", hp: 180, entryMsg: "쿠오오오!!" },
    { name: "전설의 용", emoji: "🐉", hp: 200, entryMsg: "나를 깨운 것이 너냐?" },
    { name: "최종 보스 도깨비", emoji: "👹", hp: 300, entryMsg: "끝판왕을 상대해봐라!" }
];

// Content for Speech Bubbles
const SPEECH = {
    playerHit: ["받아라!", "공격!", "하하하 어떠냐?", "정답이다!", "내 주먹을 봐!"],
    playerDamaged: ["아얏!", "아프다!", "으앙!", "조금 아픈데?", "실수했다!"],
    enemyHit: ["그것도 못 맞춰?", "바보바보!", "메롱!", "내가 더 빠르지?", "깔깔깔!"],
    enemyDamaged: ["윽!", "이럴수가!", "기억해두겠다!", "정답이라니!", "별로 안 아파!"]
};

// Game States
let currentLevel = 'add_sub_1'; 
let currentStage = 1; // 1~10
let playerHp = MAX_HP;
let enemyHp = 100;
let enemyMaxHp = 100;
let totalScore = 0;
let timeLimit = 20;
let currentTimer = null;
let remainingTime = timeLimit;
let correctAnswerIndex = -1;
let isAnimating = false;
let uploadedFaceData = null;

// Initialize
function init() {
    btnStart.addEventListener('click', startGame);
    btnRestart.addEventListener('click', showTitle);
    btnGiveup.addEventListener('click', () => {
        if(confirm("정말 처음으로 돌아가시겠습니까?")) {
            clearInterval(currentTimer);
            showTitle();
        }
    });
    btnSaveRank.addEventListener('click', saveRanking);
    
    fileUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                uploadedFaceData = e.target.result;
                facePreview.style.backgroundImage = `url(${uploadedFaceData})`;
                faceEditPanel.style.display = 'block';
                updateFacePreview();
            };
            reader.readAsDataURL(file);
        }
    });

    [faceZoom, faceOffsetX, faceOffsetY].forEach(input => {
        input.addEventListener('input', updateFacePreview);
    });

    answerBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (isAnimating) return;
            handleAnswer(parseInt(btn.getAttribute('data-index'), 10));
        });
    });

    // Correcting key mapping for 1-4
    window.onkeydown = (e) => {
         if(screenGame.classList.contains('active') && !isAnimating) {
            const idx = ['1','2','3','4'].indexOf(e.key);
            if(idx !== -1) handleAnswer(idx);
        }
    };

    showTitle();
}

function updateFacePreview() {
    if (!uploadedFaceData) return;
    const zoom = faceZoom.value;
    const offX = faceOffsetX.value;
    const offY = faceOffsetY.value;
    facePreview.style.backgroundSize = `${zoom}%`;
    facePreview.style.backgroundPosition = `${offX}% ${offY}%`;
}

function applyFaceStyle(element) {
    if (!uploadedFaceData) return;
    const zoom = faceZoom.value;
    const offX = faceOffsetX.value;
    const offY = faceOffsetY.value;
    element.style.backgroundImage = `url(${uploadedFaceData})`;
    element.style.backgroundSize = `${zoom}%`;
    element.style.backgroundPosition = `${offX}% ${offY}%`;
}

function showTitle() {
    screenTitle.classList.add('active');
    screenGame.classList.remove('active');
    screenResult.classList.remove('active');
    if (topInfoBar) topInfoBar.style.display = 'none';
    Sound.stopBGM();
}

function startGame() {
    currentLevel = levelSelect.value;
    currentStage = 1;
    totalScore = 0;
    playerHp = MAX_HP;
    
    updateScoreUI();
    if (topInfoBar) topInfoBar.style.display = 'flex';
    
    screenTitle.classList.remove('active');
    screenResult.classList.remove('active');
    screenGame.classList.add('active');
    
    Sound.startBGM();

    // Reset overlays
    playerFaceOverlay.style.display = 'none';
    enemyFaceOverlay.style.display = 'none';

    // Apply face if selected
    if (uploadedFaceData) {
        const target = faceTarget.value;
        if (target === 'player') {
            playerFaceOverlay.style.display = 'block';
            applyFaceStyle(playerFaceOverlay);
        }
    }

    // Player intro animation
    playerEl.classList.remove('anim-slide-left');
    void playerEl.offsetWidth;
    playerEl.classList.add('anim-slide-left');
    
    loadStage(currentStage);
}

function loadStage(stageNum) {
    const stageData = STAGES[stageNum - 1];
    enemyMaxHp = stageData.hp;
    enemyHp = enemyMaxHp;
    timeLimit = 20 - (stageNum - 1);
    
    enemyNameText.innerText = stageData.name;
    stageNumText.innerText = stageNum;
    
    // 캐릭터 이미지 설정
    const target = uploadedFaceData ? faceTarget.value : null;
    
    if (uploadedFaceData && target === 'enemy') {
        enemyFaceOverlay.style.display = 'block';
        applyFaceStyle(enemyFaceOverlay);
    } else {
        enemyFaceOverlay.style.display = 'none';
        enemyEl.querySelector('.character-body').innerText = stageData.emoji; 
        enemyEl.querySelector('.character-body').style.fontSize = "8rem";
        enemyEl.querySelector('.character-body').style.backgroundImage = "none";
    }
    
    if (stageNum === 10) {
        enemyEl.style.filter = "hue-rotate(180deg) brightness(0.8)";
    } else {
        enemyEl.style.filter = "none";
    }

    updateHpUI();
    announceStage(stageNum);

    // Enemy slide-in animation
    enemyEl.classList.remove('anim-slide-right');
    void enemyEl.offsetWidth;
    enemyEl.classList.add('anim-slide-right');

    setTimeout(() => {
        showSpeech(enemyBubble, stageData.entryMsg);
        nextTurn();
    }, 1000);
}

function announceStage(num) {
    const banner = document.createElement('div');
    banner.className = 'stage-banner anim-stage';
    banner.innerText = `STAGE ${num}`;
    gameContainer.appendChild(banner);
    setTimeout(() => banner.remove(), 2000);
}

function showSpeech(element, text) {
    element.innerText = text;
    element.classList.add('active');
    setTimeout(() => {
        element.classList.remove('active');
    }, 2000);
}

function generateQuestion() {
    let num1, num2, op, answer;
    
    if (currentLevel === 'add_sub_1') {
        op = Math.random() < 0.5 ? '+' : '-';
        num1 = Math.floor(Math.random() * 9) + 1;
        num2 = Math.floor(Math.random() * 9) + 1;
        if (op === '-' && num1 < num2) [num1, num2] = [num2, num1];
    } else if (currentLevel === 'add_sub_2') {
        op = Math.random() < 0.5 ? '+' : '-';
        num1 = Math.floor(Math.random() * 80) + 10;
        num2 = Math.floor(Math.random() * 80) + 10;
        if (op === '-' && num1 < num2) [num1, num2] = [num2, num1];
        if (op === '+' && num1 + num2 > 100) { num1 = 50; num2 = 30; } // Keep reasonable
    } else if (currentLevel === 'add_sub_3') {
        op = Math.random() < 0.5 ? '+' : '-';
        num1 = Math.floor(Math.random() * 800) + 100;
        num2 = Math.floor(Math.random() * 800) + 100;
        if (op === '-' && num1 < num2) [num1, num2] = [num2, num1];
    } else if (currentLevel.startsWith('mult_')) {
        op = '×';
        let level = currentLevel.split('_')[1];
        if (level === '1') { // 2, 3단
            num1 = Math.random() < 0.5 ? 2 : 3;
            num2 = Math.floor(Math.random() * 9) + 1;
        } else if (level === '2') { // 4, 5, 6단
            num1 = [4, 5, 6][Math.floor(Math.random() * 3)];
            num2 = Math.floor(Math.random() * 9) + 1;
        } else if (level === '3') { // 7, 8, 9단
            num1 = [7, 8, 9][Math.floor(Math.random() * 3)];
            num2 = Math.floor(Math.random() * 9) + 1;
        } else { // 2-9단
            num1 = Math.floor(Math.random() * 8) + 2;
            num2 = Math.floor(Math.random() * 9) + 1;
        }
    }

    if (op === '×') {
        answer = num1 * num2;
    } else {
        answer = op === '+' ? num1 + num2 : num1 - num2;
    }
    questionText.innerText = `${num1} ${op} ${num2} = ?`;

    let answers = [answer];
    
    // Distractor matching logic for add_sub_2 and add_sub_3
    let matchLastDigitCount = 0;
    const isHardAddSub = (currentLevel === 'add_sub_2' || currentLevel === 'add_sub_3');
    const lastDigit = answer % 10;

    while(answers.length < 4) {
        let wrong;
        if (isHardAddSub && answer >= 10 && matchLastDigitCount < 2) {
            // Try to match last digit
            let base = Math.floor(Math.random() * 9) + 1; // 1-9
            if (currentLevel === 'add_sub_3') base = Math.floor(Math.random() * 90) + 10;
            wrong = base * 10 + lastDigit;
            if (wrong !== answer && !answers.includes(wrong)) {
                answers.push(wrong);
                matchLastDigitCount++;
            }
        } else {
            let offset = Math.floor(Math.random() * 10) + 1;
            let sign = Math.random() < 0.5 ? 1 : -1;
            wrong = answer + (offset * sign);
            if (!answers.includes(wrong) && wrong >= 0) answers.push(wrong);
        }
    }
    answers.sort(() => Math.random() - 0.5);
    correctAnswerIndex = answers.indexOf(answer);

    answerBtns.forEach((btn, idx) => {
        btn.querySelector('.val').innerText = answers[idx];
        btn.classList.remove('correct-anim', 'wrong-anim');
    });
}

function nextTurn() {
    isAnimating = false;
    generateQuestion();
    startTimer();
}

function startTimer() {
    clearInterval(currentTimer);
    remainingTime = timeLimit;
    timerText.innerText = remainingTime;
    timerBar.style.transition = 'none';
    timerBar.style.width = '100%';
    void timerBar.offsetWidth;
    timerBar.style.transition = `width ${timeLimit}s linear`;
    timerBar.style.width = '0%';

    currentTimer = setInterval(() => {
        remainingTime--;
        timerText.innerText = remainingTime;
        if (remainingTime <= 0) {
            clearInterval(currentTimer);
            handleTimeout();
        }
    }, 1000);
}

function handleTimeout() {
    if (isAnimating) return;
    isAnimating = true;
    answerBtns[correctAnswerIndex].classList.add('correct-anim');
    processAttack('enemy');
}

function handleAnswer(idx) {
    if (isAnimating) return;
    isAnimating = true;
    clearInterval(currentTimer);
    timerBar.style.transition = 'none';

    if (idx === correctAnswerIndex) {
        let levelBonus = 1;
        if (currentLevel.includes('2')) levelBonus = 1.5;
        if (currentLevel.includes('3')) levelBonus = 2;
        if (currentLevel.includes('4')) levelBonus = 2.5;

        const gain = Math.floor((levelBonus * 100) + (remainingTime * 10));
        totalScore += gain;
        updateScoreUI();
        answerBtns[idx].classList.add('correct-anim');
        processAttack('player');
    } else {
        answerBtns[idx].classList.add('wrong-anim');
        answerBtns[correctAnswerIndex].classList.add('correct-anim');
        processAttack('enemy');
    }
}



function getRandomSpeech(type) {
    const list = SPEECH[type];
    return list[Math.floor(Math.random() * list.length)];
}

function processAttack(attacker) {
    const damage = 20;
    Sound.init();
    if (attacker === 'player') {
        playerEl.classList.add('anim-atk-player');
        showSpeech(playerBubble, getRandomSpeech('playerHit'));
        setTimeout(() => {
            enemyEl.classList.remove('anim-hit-enemy');
            void enemyEl.offsetWidth;
            enemyEl.classList.add('anim-hit-enemy');
            showSpeech(enemyBubble, getRandomSpeech('enemyDamaged'));
            showDamage(enemyDmg, damage);
            Sound.hit();
            enemyHp = Math.max(0, enemyHp - damage);
            updateHpUI();
        }, 300);
        setTimeout(() => {
            playerEl.classList.remove('anim-atk-player');
            enemyEl.classList.remove('anim-hit-enemy');
            checkRoundOver();
        }, 1000);
    } else {
        enemyEl.classList.add('anim-atk-enemy');
        showSpeech(enemyBubble, getRandomSpeech('enemyHit'));
        setTimeout(() => {
            playerEl.classList.remove('anim-hit');
            void playerEl.offsetWidth;
            playerEl.classList.add('anim-hit');
            showSpeech(playerBubble, getRandomSpeech('playerDamaged'));
            showDamage(playerDmg, damage);
            Sound.miss();
            playerHp = Math.max(0, playerHp - damage);
            updateHpUI();
        }, 300);
        setTimeout(() => {
            enemyEl.classList.remove('anim-atk-enemy');
            playerEl.classList.remove('anim-hit');
            checkRoundOver();
        }, 1000);
    }
}

function showDamage(element, amt) {
    element.innerText = `-${amt}`;
    element.classList.remove('anim-dmg');
    void element.offsetWidth;
    element.classList.add('anim-dmg');
}

function updateHpUI() {
    playerHpBar.style.width = `${(playerHp / MAX_HP) * 100}%`;
    enemyHpBar.style.width = `${(enemyHp / enemyMaxHp) * 100}%`;
}

function updateScoreUI() {
    scoreText.innerText = totalScore;
}

function checkRoundOver() {
    if (playerHp <= 0) {
        endGame(false);
    } else if (enemyHp <= 0) {
        if (currentStage < 10) {
            currentStage++;
            loadStage(currentStage);
        } else {
            endGame(true);
        }
    } else {
        nextTurn();
    }
}

function endGame(isWin) {
    Sound.stopBGM();
    clearInterval(currentTimer);
    
    screenGame.classList.remove('active');
    screenResult.classList.add('active');
    
    const msg = document.getElementById('result-message');
    const submsg = document.getElementById('result-submessage');
    finalScoreText.innerText = `최종 점수: ${totalScore}`;
    
    if (isWin) {
        msg.innerText = "대승리! 🎉";
        msg.style.color = "#2ecc71";
        submsg.innerText = "모든 스테이지를 클리어하고 수학 마스터가 되었습니다!";
        Sound.win();
    } else {
        msg.innerText = "패배... 😢";
        msg.style.color = "#e74c3c";
        submsg.innerText = `${currentStage}단계에서 쓰러지고 말았습니다.`;
        Sound.loss();
    }
    
    displayLeaderboard();
}

function saveRanking() {
    const name = playerNameInput.value.trim() || "무명 용사";
    let leaderboard = JSON.parse(localStorage.getItem('math_fighter_rank') || "[]");
    leaderboard.push({ name, score: totalScore, date: new Date().toLocaleDateString() });
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 10);
    localStorage.setItem('math_fighter_rank', JSON.stringify(leaderboard));
    
    playerNameInput.value = "";
    displayLeaderboard();
    btnSaveRank.disabled = true;
    btnSaveRank.innerText = "등록 완료";
}

function displayLeaderboard() {
    const leaderboard = JSON.parse(localStorage.getItem('math_fighter_rank') || "[]");
    leaderboardTable.innerHTML = leaderboard.map((item, idx) => `
        <tr>
            <td>${idx + 1}</td>
            <td>${item.name}</td>
            <td>${item.score}</td>
        </tr>
    `).join('');
    btnSaveRank.disabled = false;
    btnSaveRank.innerText = "랭킹 등록";
}

// 부팅
init();
