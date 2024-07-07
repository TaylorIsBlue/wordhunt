
class WordGame {
	constructor() {
		this.gridItems = document.querySelectorAll(".grid-item");
		this.gridContainer = document.querySelector(".grid-container");
		this.messageElement = document.getElementById("message");
		this.isSelecting = false;
		this.isFirstSelection = true;
		this.cache = new Map();
		this.currentWord = "";
		this.timeLeft = 60;
		this.timerId = null;
		this.score = 0;
		this.leaderboard = JSON.parse(localStorage.getItem("leaderboard")) || [];
		this.shuffleLetters();
		this.setupEventListeners();
		this.displayLeaderboard();
	}

	setupEventListeners() {
		this.gridContainer.addEventListener("mousedown", (e) =>
			this.handleMouseDown(e)
		);
		this.gridContainer.addEventListener("mouseover", (e) =>
			this.handleMouseOver(e)
		);
		document.addEventListener("mouseup", () => this.handleMouseUp());
	}

	handleMouseDown(e) {
		if (this.isFirstSelection) {
			this.startNewRound();
			this.isFirstSelection = false;
		}
		this.isSelecting = true;
    
		const item = e.target.closest(".grid-item");
		if (item) {
			if (!item.classList.contains("selected")) {
				item.classList.add("selected");
				this.currentWord += item.textContent;
			}
		}
	}

	handleMouseOver(e) {
		const item = e.target.closest(".grid-item");
		if (item && this.isSelecting && !item.classList.contains("selected")) {
			item.classList.add("selected");
			this.currentWord += item.textContent;
		}
	}

	handleMouseUp() {
		if (this.isSelecting) {
			this.isSelecting = false;
			this.checkWordScore(this.currentWord);
			this.resetSelection();
		}
	}

	startNewRound() {
		this.startTimer();
		this.resetSelection();
	}

	endGame() {
		clearInterval(this.timerId);
		this.isSelecting = false;
		this.isFirstSelection = true;
		alert(`Time's up! Your final score is: ${this.score}`);
		this.updateLeaderboard(this.score);
		this.displayLeaderboard();
		this.score = 0;
	}

	resetSelection() {
		this.gridItems.forEach((item) => item.classList.remove("selected"));
		this.currentWord = "";
	}

	updateLeaderboard(newScore) {
		this.leaderboard.push(newScore);
		this.leaderboard.sort((a, b) => b - a);
		this.leaderboard = this.leaderboard.slice(0, 3);
		localStorage.setItem("leaderboard", JSON.stringify(this.leaderboard));
	}

	displayLeaderboard() {
		const leaderboardElement = document.getElementById("leaderboard");
    
    if (this.leaderboard.length === 0) { 
      leaderboardElement.style.display = "none"; 
    } else {
		leaderboardElement.innerHTML = `<h2>Leaderboard</h2>${this.leaderboard
			.map((score, index) => `<p>${index + 1}. Score: ${score}</p>`)
			.join("")}`;
    }
	}

	startTimer() {
		this.timeLeft = 60;
		this.updateTimerDisplay();
		this.timerId = setInterval(() => {
			this.timeLeft--;
			this.updateTimerDisplay();
			if (this.timeLeft <= 0) this.endGame();
		}, 1000);
	}

	updateTimerDisplay() {
		document.getElementById(
			"timer"
		).textContent = `Time Left: ${this.timeLeft}s`;
	}

	async checkWordValidity(word) {
		const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`;
		try {
			const response = await fetch(url);
			return (
				response.status === 200 &&
				(await response.json())[0]?.word.toLowerCase() === word.toLowerCase()
			);
		} catch (error) {
			console.error("Failed to validate word:", error);
			return false;
		}
	}

	async checkWordScore(word) {
		clearTimeout(this.debounceTimer);
		this.debounceTimer = setTimeout(async () => {
			if (word.length < 3) {
				this.displayMessage(`${word} is too short.`, "red");
				return;
			}
			if (this.cache.has(word)) {
				return this.displayValidity(word, !this.cache.has(word));
			}
			let isValid = await this.checkWordValidity(word);
			this.cache.set(word, isValid);
			this.displayValidity(word, isValid);
		}, 300);
	}

	displayValidity(word, isValid) {
		if (isValid) {
			this.displayMessage(`${word} is a valid word!`, "green");
			this.score += word.length * 100;
			document.getElementById("score").textContent = `Score: ${this.score}`;
		} else {
			this.displayMessage(`${word} is not a valid word.`, "red");
		}
	}

	displayMessage(message, color) {
		this.messageElement.textContent = message;
		this.messageElement.style.color = color;
	}

	shuffleLetters() {
		const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
		let letters = Array.from(this.gridItems).map(
			() => alphabet[Math.floor(Math.random() * alphabet.length)]
		);
		for (let i = letters.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[letters[i], letters[j]] = [letters[j], letters[i]];
		}
		this.gridItems.forEach((cell, index) => {
			cell.textContent = letters[index];
		});
	}
}

document.addEventListener("DOMContentLoaded", () => new WordGame());
