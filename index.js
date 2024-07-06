const gridItems = document.querySelectorAll(".grid-item");
let isSelecting = false;
let cache = new Map();
let debounceTimer;
let isFirstSelection = true;
let currentWord = "";
let timeLeft = 60;
let timerId = null;
let score = 0;
let leaderboard = JSON.parse(localStorage.getItem("leaderboard")) || [];

document.addEventListener("DOMContentLoaded", () => {
    shuffleLetters();
    displayLeaderboard();
    setupEventListeners();
});

function setupEventListeners() {
    const gridContainer = document.querySelector('.grid-container');

    gridContainer.addEventListener("mousedown", handleMouseDown);
    gridContainer.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mouseup", handleMouseUp);
}

function handleMouseDown(e) {
    const item = e.target.closest('.grid-item');
    if (item) handleSelectionStart(item);
}

function handleMouseOver(e) {
    const item = e.target.closest('.grid-item');
    if (item && isSelecting) handleSelectionContinue(item);
}

function handleMouseUp() {
    if (isSelecting) handleSelectionEnd();
}

function handleSelectionStart(item) {
    if (isFirstSelection) {
        startNewRound();
        isFirstSelection = false;
    }
    isSelecting = true;
    selectItem(item);
}

function handleSelectionContinue(item) {
    if (!item.classList.contains("selected")) selectItem(item);
}

function handleSelectionEnd() {
    isSelecting = false;
    checkWordScore(currentWord);
    resetSelection();
}

function selectItem(item) {
    item.classList.add("selected");
    currentWord += item.textContent;
}

function startNewRound() {
    startTimer();
    resetSelection();
    shuffleLetters();
}

function endGame() {
    clearInterval(timerId);
    isSelecting = false;
    isFirstSelection = true;
    alert(`Time's up! Your final score is: ${score}`);
    updateLeaderboard(score);
    displayLeaderboard();
    score = 0;
}

function resetSelection() {
    gridItems.forEach(item => item.classList.remove("selected"));
    currentWord = "";
}

function updateLeaderboard(newScore) {
    leaderboard.push(newScore);
    leaderboard.sort((a, b) => b - a);
    leaderboard = leaderboard.slice(0, 5);
    localStorage.setItem("leaderboard", JSON.stringify(leaderboard));
}

function displayLeaderboard() {
    const leaderboardElement = document.getElementById("leaderboard");
    leaderboardElement.innerHTML = `<h2>Leaderboard</h2>${leaderboard.map((score, index) => `<p>${index + 1}. Score: ${score}</p>`).join("")}`;
}

function updateScoreDisplay() {
    document.getElementById("score").textContent = `Score: ${score}`;
}

function startTimer() {
    timeLeft = 60;
    updateTimerDisplay();

    timerId = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        if (timeLeft <= 0) endGame();
    }, 1000);
}

function updateTimerDisplay() {
    document.getElementById('timer').textContent = `Time Left: ${timeLeft}s`;
}

async function checkWordValidity(word) {
    const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`;
    try {
        const response = await fetch(url);
        if (response.status === 200) {
            const data = await response.json();
            return data[0]?.word.toLowerCase() === word.toLowerCase();
        }
        return false;
    } catch (error) {
        console.error("Failed to validate word:", error);
        return false;
    }
}

async function checkWordScore(word) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
        if (word.length < 3) {
            displayMessage(`${word} is too short.`, "red");
            return;
        }
        if (cache.has(word)) {
            displayValidity(word, cache.get(word));
            return;
        }

        let isValid = await checkWordValidity(word);
        cache.set(word, isValid);
        displayValidity(word, isValid);
    }, 300);
}

function displayValidity(word, isValid) {
    if (isValid) {
        displayMessage(`${word} is a valid word!`, "green");
        score += word.length * 100;
        updateScoreDisplay();
    } else {
        displayMessage(`${word} is not a valid word.`, "red");
    }
}

function displayMessage(message, color) {
    const messageElement = document.getElementById("message");
    messageElement.textContent = message;
    messageElement.style.color = color;
}

function shuffleLetters() {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let letters = Array.from(gridItems).map(c => alphabet[Math.floor(Math.random() * alphabet.length)]);
    
    for (let i = letters.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [letters[i], letters[j]] = [letters[j], letters[i]];
    }

    gridItems.forEach((cell, index) => {
        cell.textContent = letters[index];
    });
}
