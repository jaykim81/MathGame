// DOM Elements
const screenTitle = document.getElementById('screen-title');
const screenGame = document.getElementById('screen-game');
const screenResult = document.getElementById('screen-result');
const gameContainer = document.getElementById('game-container');

const btnStart = document.getElementById('btn-start');
const btnRestart = document.getElementById('btn-restart');
const btnSaveRank = document.getElementById('btn-save-rank');
const levelSelect = document.getElementById('level-select');
const fileUpload = document.getElementById('enemy-face-upload');
const facePreview = document.getElementById('enemy-face-preview');
const enemyFaceOverlay = document.getElementById('enemy-face-overlay');

const playerHpBar = document.getElementById('player-hp-bar');
const enemyHpBar = document.getElementById('enemy-hp-bar');
const timerText = document.getElementById('timer-text');
const timerBar = document.getElementById('timer-bar');
const scoreText = document.getElementById('score-val');
const stageText = document.getElementById('stage-text');
const enemyNameText = document.getElementById('enemy-name');

const playerEl = document.getElementById('player');
const enemyEl = document.getElementById('enemy');
const playerDmg = document.getElementById('player-damage');
const enemyDmg = document.getElementById('enemy-damage');

const questionText = document.getElementById('question-text');
const answerBtns = document.querySelectorAll('.answer-btn');

const leaderboardTable = document.querySelector('#leaderboard-table tbody');
const playerNameInput = document.getElementById('player-name-input');
const finalScoreText = document.getElementById('final-score');

// Game Constants & Data
const MAX_HP = 100;
const STAGES = [
    { name: "심심한 원숭이", emoji: "🐵", hp: 100 },
    { name: "용감한 강아지", emoji: "🐶", hp: 100 },
    { name: "영리한 여우", emoji: "🦊", hp: 120 },
    { name: "배고픈 늑대", emoji: "🐺", hp: 120 },
    { name: "백수의 왕 사자", emoji: "🦁", hp: 140 },
    { name: "줄무늬 호랑이", emoji: "🐯", hp: 140 },
    { name: "괴력 고릴라", emoji: "🦍", hp: 160 },
    { name: "고대 공룡", emoji: "🦖", hp: 180 },
    { name: "전설의 용", emoji: "🐉", hp: 200 },
    { name: "최종 보스 도깨비", emoji: "👹", hp: 300 }
];

// Game States
let currentLevel = 1; // 초등 학년
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
    btnSaveRank.addEventListener('click', saveRanking);
    
    fileUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                uploadedFaceData = e.target.result;
                facePreview.style.backgroundImage = `url(${uploadedFaceData})`;
            };
            reader.readAsDataURL(file);
        }
    });

    answerBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (isAnimating) return;
            handleAnswer(parseInt(btn.getAttribute('data-index'), 10));
        });
    });

    window.addEventListener('keydown', (e) => {
        if(screenGame.classList.contains('active') && !isAnimating) {
            if(e.key === '1') handleAnswer(0);
            if(e.key === '2') handleAnswer(1);
            if(e.key === '3') handleAnswer(2);
            if(e.key === '4') handleAnswer(3);
        }
    });

    showTitle();
}

function showTitle() {
    screenTitle.classList.add('active');
    screenGame.classList.remove('active');
    screenResult.classList.remove('active');
    Sound.stopBGM();
}

function startGame() {
    currentLevel = parseFloat(levelSelect.value);
    currentStage = 1;
    totalScore = 0;
    playerHp = MAX_HP;
    
    updateScoreUI();
    loadStage(currentStage);
    
    screenTitle.classList.remove('active');
    screenResult.classList.remove('active');
    screenGame.classList.add('active');
    
    Sound.startBGM();
    nextTurn();
}

function loadStage(stageNum) {
    const stageData = STAGES[stageNum - 1];
    enemyMaxHp = stageData.hp;
    enemyHp = enemyMaxHp;
    timeLimit = 20 - (stageNum - 1);
    
    enemyNameText.innerText = stageData.name;
    stageText.innerText = `Stage ${stageNum}/10`;
    
    // 캐릭터 이미지 설정
    if (uploadedFaceData) {
        enemyFaceOverlay.style.backgroundImage = `url(${uploadedFaceData})`;
        enemyFaceOverlay.style.display = 'block';
    } else {
        enemyFaceOverlay.style.display = 'none';
        // 얼굴이 없을 때만 적 이모지/이미지 변경 (여기서는 예시로 원숭이 캐릭터 이미지가 고정되어 있으므로, 텍스트나 필터로 보스 느낌 부여 가능)
        // 실제로는 enemy.png 대신 stage별 이미지를 로드하거나 이모지를 오버레이할 수 있음.
        // 여기서는 이모지를 바디 뒤에 살짝 띄워주는 방식으로 처리
        enemyEl.querySelector('.character-body').innerText = stageData.emoji; 
        // 기존 CSS에서 font-size: 0 이므로 다시 살림 (이미지 대신 이모지 쓸 경우)
        if (!uploadedFaceData) {
            enemyEl.querySelector('.character-body').style.fontSize = "8rem";
            enemyEl.querySelector('.character-body').style.backgroundImage = "none";
        }
    }
    
    if (stageNum === 10) {
        enemyEl.style.filter = "hue-rotate(180deg) brightness(0.8)"; // 보스 포스
    } else {
        enemyEl.style.filter = "none";
    }

    updateHpUI();
    announceStage(stageNum);
}

function announceStage(num) {
    const banner = document.createElement('div');
    banner.className = 'stage-banner anim-stage';
    banner.innerText = `STAGE ${num}`;
    gameContainer.appendChild(banner);
    setTimeout(() => banner.remove(), 2000);
}

function generateQuestion() {
    let num1, num2, op, answer;
    if (currentLevel === 1) {
        op = Math.random() < 0.5 ? '+' : '-';
        num1 = Math.floor(Math.random() * 9) + 1;
        num2 = Math.floor(Math.random() * 9) + 1;
        if (op === '-' && num1 < num2) [num1, num2] = [num2, num1];
    } else if (currentLevel === 1.5) { 
        // 1.5학년: 구구단 (2~9단)
        op = '×';
        num1 = Math.floor(Math.random() * 8) + 2; // 2~9
        num2 = Math.floor(Math.random() * 9) + 1; // 1~9
    } else if (currentLevel === 2) { 
        // 2학년: 두자리수 ± 한자리/두자리수 (100 이하)
        op = Math.random() < 0.5 ? '+' : '-';
        if (op === '+') {
            num1 = Math.floor(Math.random() * 70) + 10;
            num2 = Math.floor(Math.random() * 20) + 5;
        } else {
            num1 = Math.floor(Math.random() * 50) + 40;
            num2 = Math.floor(Math.random() * 30) + 10;
        }
    } else { 
        // 3학년: 세자리수 혹은 어려운 두자리수 연산
        op = Math.random() < 0.5 ? '+' : '-';
        if (op === '+') {
            num1 = Math.floor(Math.random() * 500) + 100;
            num2 = Math.floor(Math.random() * 400) + 100;
        } else {
            num1 = Math.floor(Math.random() * 500) + 400;
            num2 = Math.floor(Math.random() * 300) + 100;
        }
        if (op === '-' && num1 < num2) [num1, num2] = [num2, num1];
    }

    if (op === '×') {
        answer = num1 * num2;
    } else {
        answer = op === '+' ? num1 + num2 : num1 - num2;
    }
    questionText.innerText = `${num1} ${op} ${num2} = ?`;

    let answers = [answer];
    while(answers.length < 4) {
        let offset = Math.floor(Math.random() * 5) + 1;
        let sign = Math.random() < 0.5 ? 1 : -1;
        let wrong = answer + (offset * sign);
        if (!answers.includes(wrong) && wrong >= 0) answers.push(wrong);
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
        // 점수 계산: (레벨 * 100) + (남은 시간 * 10)
        const gain = (currentLevel * 100) + (remainingTime * 10);
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
    stopBGM() { clearInterval(this.bgmInterval); this.bgmInterval = null; },
    hit() { this.play(150, 'sawtooth', 0.1, 0.2, 50); setTimeout(() => this.play(400, 'sine', 0.2, 0.3, 100), 100); },
    miss() { this.play(100, 'square', 0.3, 0.2, 40); },
    win() { [261, 329, 392, 523].forEach((f, i) => setTimeout(() => this.play(f, 'triangle', 0.4, 0.2), i * 150)); },
    loss() { [196, 174, 146, 130].forEach((f, i) => setTimeout(() => this.play(f, 'sine', 0.5, 0.2), i * 200)); }
};

function processAttack(attacker) {
    const damage = 20;
    Sound.init();
    if (attacker === 'player') {
        playerEl.classList.add('anim-atk-player');
        setTimeout(() => {
            enemyEl.classList.add('anim-hit-enemy');
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
        setTimeout(() => {
            playerEl.classList.add('anim-hit');
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
            nextTurn();
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
