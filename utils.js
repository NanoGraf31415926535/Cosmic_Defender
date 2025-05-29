let statusMessageTimeoutId = null;
function showStatusMessage(message, duration = 2000) {
    statusMessageEl.textContent = message;
    if (statusMessageTimeoutId) {
        clearTimeout(statusMessageTimeoutId);
    }
    if (duration > 0) {
        statusMessageTimeoutId = setTimeout(() => {
            statusMessageEl.textContent = "";
            statusMessageTimeoutId = null;
        }, duration);
    }
}

function setupSounds() {
    sounds.shootLaser = new Tone.PolySynth(Tone.Synth, {
        volume: -18,
        oscillator: { type: "sawtooth" },
        envelope: { attack: 0.01, decay: 0.05, sustain: 0, release: 0.1 }
    }).toDestination();

    sounds.shootMissile = new Tone.NoiseSynth({
        noise: { type: "white" },
        envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.1 },
        volume: -15
    }).toDestination();

    sounds.shootFreeze = new Tone.PolySynth(Tone.Synth, {
        volume: -15,
        oscillator: { type: "sine" },
        envelope: { attack: 0.02, decay: 0.1, sustain: 0.05, release: 0.2 }
    }).toDestination();

    sounds.hit = new Tone.PolySynth(Tone.MembraneSynth, {
        volume: -20,
        pitchDecay: 0.01,
        octaves: 2,
        envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.1 }
    }).toDestination();

    sounds.explosion = new Tone.NoiseSynth({
        noise: { type: "pink" },
        envelope: { attack: 0.01, decay: 0.3, sustain: 0, release: 0.2 },
        volume: -10
    }).toDestination();

    sounds.enemyReachedEnd = new Tone.Synth({
        oscillator: { type: "square" },
        envelope: { attack: 0.01, decay: 0.2, sustain: 0.1, release: 0.3 },
        volume: -10
    }).toDestination();

    sounds.towerPlace = new Tone.Synth({
        oscillator: { type: "triangle" },
        envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.1 },
        volume: -15
    }).toDestination();

    sounds.upgrade = new Tone.Synth({
        oscillator: { type: "sine" },
        envelope: { attack: 0.01, decay: 0.2, sustain: 0.1, release: 0.2 },
        volume: -12
    }).toDestination();

    sounds.sell = new Tone.Synth({
        oscillator: { type: "square" },
        envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.1 },
        volume: -15
    }).toDestination();

    sounds.abilityActivate = new Tone.Synth({
        oscillator: { type: "sawtooth" },
        envelope: { attack: 0.02, decay: 0.2, sustain: 0.1, release: 0.3 },
        volume: -8
    }).toDestination();

    sounds.error = new Tone.Synth({
        oscillator: { type: "square" },
        envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.1 },
        volume: -20
    }).toDestination();

    // Player for pre-recorded wave start sound
    sounds.waveStart = new Tone.Player("https://tonejs.github.io/audio/berklee/gong_1.mp3").toDestination();
    // Player for game over sound
    sounds.gameOver = new Tone.Player("https://tonejs.github.io/audio/berklee/gong_2.mp3").toDestination();
    // Player for victory sound
    sounds.victory = new Tone.Player("https://tonejs.github.io/audio/berklee/gong_1.mp3").toDestination();

    sounds.waveStart.volume.value = -10;
    sounds.gameOver.volume.value = -5;
    sounds.victory.volume.value = -5;
}

function playSound(soundName, note = 'C4', duration = '8n') {
    if (gameState.isMuted || !sounds[soundName]) return;

    try {
        const sound = sounds[soundName];
        const timeToPlay = Tone.now() + 0.005; 

        if (sound instanceof Tone.Player) {
            sound.stop(timeToPlay).start(timeToPlay);
        } else if (sound instanceof Tone.PolySynth) {
            sound.triggerAttackRelease(note, duration, timeToPlay);
        } else if (sound instanceof Tone.NoiseSynth) {
            sound.triggerAttackRelease(duration, timeToPlay);
        } else if (sound.triggerAttackRelease) { 
            sound.triggerAttackRelease(note, duration, timeToPlay);
        }
    } catch (e) {
        console.error(`Error playing sound: ${soundName} (Note: ${note}, Duration: ${duration})`, e);
    }
}

function generateTowerButtons() {
    const shopEl = document.querySelector('.tower-shop');
    shopEl.innerHTML = ''; 
    Object.keys(TOWER_BASE_STATS).forEach(type => {
        const config = TOWER_BASE_STATS[type];
        const button = document.createElement('button');
        button.classList.add('tower-button');
        button.id = `${type}Tower`; // Assign ID for easy selection/disabling
        button.onclick = () => selectTowerTypeToBuild(type);
        button.innerHTML = `
            <div class="tower-name">${config.name}</div>
            <div class="tower-cost">Cost: ${config.cost} credits</div>
            <div class="tower-desc">Lvl 1: ${config.levels[0].damage} Dmg, ${config.levels[0].range} Rng</div>
        `;
        shopEl.appendChild(button);
    });
}

// Resizes canvas to fit its parent and regenerates the enemy path
function resizeCanvas() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    if (!gameState.isPlaying || gameState.wave === 0) {
        generatePath();
    }
}
window.addEventListener('resize', resizeCanvas); 
function generatePath() {
    path = [];
    const width = canvas.width;
    const height = canvas.height;
    const segments = 12; 
    const padding = 50; 
    const startY = height / 2 + (Math.random() - 0.5) * (height / 6);
    path.push({ x: padding, y: startY });
    for (let i = 1; i <= segments; i++) {
        const t = i / segments;
        let x = padding + t * (width - 2 * padding);
        let y = startY + Math.sin(t * Math.PI * (2.5 + Math.random() * 1)) * (height / (3.5 + Math.random() * 2)) * Math.cos(t * Math.PI * (0.5 + Math.random() * 0.5));

        // Add a general vertical offset for the whole path
        y += (Math.random() - 0.5) * (height / 8);
        y = Math.max(padding, Math.min(height - padding, y));
        path.push({ x, y });
    }
    const endY = height / 2 + (Math.random() - 0.5) * (height / 6);
    path.push({ x: width - padding, y: endY });
}

function spawnParticles(x, y, count, color, type) {
    for (let i = 0; i < count; i++) {
        gameState.particles.push(new Particle(x, y, type === 'explosion' ? 8 : 2, color, type)); 
    }
}

function drawExplosionFlash() {
    if (gameState.explosionFlashTimer > 0) {
        ctx.save();
        ctx.globalAlpha = gameState.explosionFlashTimer / 10; 
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
        gameState.explosionFlashTimer -= gameState.gameSpeed;
    }
}

// Displays a modal with a custom title, message, and buttons
function showModal(title, message, button1Text = "Restart", button1Action = restartGame, button2Text = "Menu", button2Action = showMenu) {
    gameState.isPlaying = false; 
    if(animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    modalTitleEl.textContent = title;
    modalMessageEl.textContent = message;

    const modalBtn1 = document.getElementById('modalButton1');
    modalBtn1.textContent = button1Text;
    modalBtn1.onclick = button1Action;

    const modalBtn2 = document.getElementById('modalButton2');
    modalBtn2.textContent = button2Text;
    modalBtn2.onclick = button2Action;

    modalOverlay.classList.remove('hidden');
    modalOverlay.classList.add('active'); 
}

function selectTowerTypeToBuild(type) {
    if (gameState.isRelocatingTower) {
        showStatusMessage("Cancel relocation first (ESC)!", 2000);
        playSound('error');
        return;
    }

    if (gameState.credits >= TOWER_BASE_STATS[type].cost) {
        gameState.selectedTowerType = type;
        gameState.selectedPlacedTower = null; 
        updateSelectedTowerPanel();
        showStatusMessage(`Placing: ${TOWER_BASE_STATS[type].name}. Cost: ${TOWER_BASE_STATS[type].cost}`);

        document.querySelectorAll('.tower-button').forEach(btn => btn.classList.remove('selected'));
        document.getElementById(type + 'Tower').classList.add('selected');
        playSound('towerPlace', 'C4');
    } else {
        showStatusMessage("Not enough credits!");
        playSound('error');
    }
}

// Deselects any tower type or placed tower
function deselectTowerTypeToBuild() {
    gameState.selectedTowerType = null;
    gameState.selectedPlacedTower = null;
    // Only clear status if not in relocation mode
    if (!gameState.isRelocatingTower) {
        showStatusMessage("Select a tower to build or click a placed tower.");
    }
    document.querySelectorAll('.tower-button').forEach(btn => btn.classList.remove('selected'));
    updateSelectedTowerPanel(); 
}

function selectPlacedTower(tower) {
    if (gameState.isRelocatingTower) {
        showStatusMessage("Cancel relocation first (ESC)!", 2000);
        playSound('error');
        return;
    }
    gameState.selectedPlacedTower = tower;
    gameState.selectedTowerType = null; 
    document.querySelectorAll('.tower-button').forEach(btn => btn.classList.remove('selected'));
    updateSelectedTowerPanel();
    playSound('towerPlace', 'E4');
}

function updateSelectedTowerPanel() {
    if (gameState.selectedPlacedTower && !gameState.isRelocatingTower) { 
        const tower = gameState.selectedPlacedTower;
        const stats = tower.currentStats;
        selectedTowerPanel.classList.remove('hidden');
        selectedTowerNameEl.textContent = `${tower.baseConfig.name}`;
        selectedTowerLevelEl.textContent = tower.level + 1;
        selectedTowerDamageEl.textContent = stats.damage;
        selectedTowerRangeEl.textContent = stats.range;
        selectedTowerFireRateEl.textContent = (60 / (stats.fireRate / 60)).toFixed(1) + "/sec";

        if (tower.level < tower.maxLevel) {
            upgradeTowerBtn.disabled = gameState.credits < stats.upgradeCost;
            upgradeTowerCostEl.textContent = stats.upgradeCost;
            upgradeTowerBtn.classList.remove('hidden');
        } else {
            upgradeTowerBtn.classList.add('hidden'); 
            upgradeTowerCostEl.textContent = "MAX";
        }

        const refundAmount = Math.floor(tower.getTotalCost() * 0.7); 
        sellTowerRefundEl.textContent = refundAmount;
        sellTowerBtn.classList.remove('hidden'); 

        relocateTowerCostEl.textContent = tower.baseConfig.relocateCost;
        relocateTowerBtn.disabled = gameState.credits < tower.baseConfig.relocateCost;
        relocateTowerBtn.classList.remove('hidden');

        if (tower.baseConfig.ability) {
            abilitySection.classList.remove('hidden');
            const ability = tower.baseConfig.ability;
            abilityNameEl.textContent = ability.name;
            abilityCostEl.textContent = `Cost: ${ability.cost} credits`;

            if (tower.abilityCooldown > 0) {
                abilityCooldownEl.textContent = `Cooldown: ${Math.ceil(tower.abilityCooldown / 60)}s`;
                activateAbilityBtn.disabled = true;
            } else {
                abilityCooldownEl.textContent = `Ready`;
                activateAbilityBtn.disabled = gameState.credits < ability.cost;
            }
        } else {
            abilitySection.classList.add('hidden'); 
        }

        showStatusMessage(`Selected: ${tower.baseConfig.name} (Lvl ${tower.level + 1})`, 0);
    } else {
        selectedTowerPanel.classList.add('hidden');
        abilitySection.classList.add('hidden'); 
        Object.keys(TOWER_BASE_STATS).forEach(type => {
            const button = document.getElementById(type + 'Tower');
            if (button) {
               button.disabled = gameState.credits < TOWER_BASE_STATS[type].cost || gameState.isRelocatingTower; 
            }
        });
        if (!gameState.selectedTowerType && !gameState.isRelocatingTower) {
            showStatusMessage("Select a tower to build or click a placed tower.", 0);
        }
    }
}

function upgradeSelectedTower() {
    if (gameState.selectedPlacedTower) {
        gameState.selectedPlacedTower.upgrade();
    }
}

function activateSelectedTowerAbility() {
    if (gameState.selectedPlacedTower) {
        gameState.selectedPlacedTower.activateAbility();
    }
}

function relocateSelectedTower() {
    if (gameState.selectedPlacedTower) {
        const towerToRelocate = gameState.selectedPlacedTower;
        const relocateCost = towerToRelocate.baseConfig.relocateCost;

        if (gameState.credits < relocateCost) {
            showStatusMessage("Not enough credits to relocate!");
            playSound('error');
            return;
        }

        gameState.credits -= relocateCost; 
        towerToRelocate.originalX = towerToRelocate.x; 
        towerToRelocate.originalY = towerToRelocate.y;

        gameState.isRelocatingTower = true;
        gameState.relocatingTower = towerToRelocate;

        gameState.towers = gameState.towers.filter(t => t.id !== towerToRelocate.id);

        deselectTowerTypeToBuild(); 
        showStatusMessage(`Relocating ${towerToRelocate.baseConfig.name}. Click to place, ESC to cancel.`, 0);
        playSound('towerPlace', 'G5'); 
        updateUI(); 
    }
}

function sellSelectedTower() {
    if (gameState.selectedPlacedTower) {
        const towerToSell = gameState.selectedPlacedTower;
        const refundAmount = Math.floor(towerToSell.getTotalCost() * 0.7); 

        gameState.credits += refundAmount;

        gameState.towers = gameState.towers.filter(tower => tower.id !== towerToSell.id);

        playSound('sell', 'F4');
        showStatusMessage(`Sold ${towerToSell.baseConfig.name} for ${refundAmount} credits.`, 2000);
        deselectTowerTypeToBuild(); 
        updateUI();
    }
}

function prepareNextWave() {
    if (gameState.wave >= FINAL_WAVE) {
        gameWon();
        return;
    }

    gameState.isIntermission = true;
    gameState.waveCountdown = INTERMISSION_DURATION;
    nextWaveBtn.disabled = false;
    nextWaveBtn.textContent = `🌊 Start Wave ${gameState.wave + 1} (Skip)`;
    waveTimerEl.textContent = `Next wave in ${Math.ceil(gameState.waveCountdown)}s...`;
    showStatusMessage(`Wave ${gameState.wave} cleared! Prepare for Wave ${gameState.wave + 1}.`, 0);
    generatePath();
}

function startWave() {
    if (gameState.waveActive) return; 

    gameState.wave++;
    gameState.waveActive = true;
    gameState.isIntermission = false; 
    gameState.enemiesSpawnedThisWave = 0;

    const currentWaveConfig = WAVE_CONFIG[Math.min(gameState.wave - 1, WAVE_CONFIG.length - 1)];
    let enemiesToSpawnList = [];
    for (const type in currentWaveConfig) {
        if (ENEMY_TYPES[type]) { 
            for (let i = 0; i < currentWaveConfig[type]; i++) {
                enemiesToSpawnList.push(type);
            }
        }
    }
    for (let i = enemiesToSpawnList.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [enemiesToSpawnList[i], enemiesToSpawnList[j]] = [enemiesToSpawnList[j], enemiesToSpawnList[i]];
    }
    gameState.totalEnemiesThisWave = enemiesToSpawnList.length;

    const spawnInterval = currentWaveConfig.spawnInterval || 800;

    function spawnEnemyFromList() {
        if (gameState.enemiesSpawnedThisWave < gameState.totalEnemiesThisWave && gameState.waveActive && !gameState.isPaused && gameState.isPlaying) {
            const enemyType = enemiesToSpawnList[gameState.enemiesSpawnedThisWave];
            gameState.enemies.push(new Enemy(enemyType));
            gameState.enemiesSpawnedThisWave++;
            if(gameState.isPlaying && gameState.waveActive) {
               setTimeout(spawnEnemyFromList, spawnInterval / gameState.gameSpeed);
            }
        }
    }
    spawnEnemyFromList(); 

    nextWaveBtn.disabled = true;
    nextWaveBtn.textContent = `Wave ${gameState.wave} Active`;
    waveTimerEl.textContent = `Wave ${gameState.wave} in progress...`;
    playSound('waveStart');
    showStatusMessage(`Wave ${gameState.wave} incoming!`);
}

function skipWaveCountdown() {
    if (gameState.isIntermission && !gameState.waveActive) {
        startWave();
    }
}

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    gameState.mouseX = e.clientX - rect.left;
    gameState.mouseY = e.clientY - rect.top;
});

canvas.addEventListener('click', (e) => {
    if (gameState.isPaused || !gameState.isPlaying) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    if (gameState.isRelocatingTower) {
        const relocatingTower = gameState.relocatingTower;
        let validPosition = true;
        const towerSize = relocatingTower.baseConfig.size + relocatingTower.level;

        for (let point of path) {
            const dist = Math.sqrt((point.x - clickX) ** 2 + (point.y - clickY) ** 2);
            if (dist < 30 + towerSize) { 
                validPosition = false; break;
            }
        }
        for (let tower of gameState.towers) {
            const dist = Math.sqrt((tower.x - clickX) ** 2 + (tower.y - clickY) ** 2);
            if (dist < (tower.baseConfig.size + tower.level) + towerSize + 5) {
                validPosition = false; break;
            }
        }

        if (validPosition) {
            relocatingTower.x = clickX;
            relocatingTower.y = clickY;
            gameState.towers.push(relocatingTower);
            gameState.isRelocatingTower = false;
            gameState.relocatingTower = null;
            selectPlacedTower(relocatingTower);
            showStatusMessage(`${relocatingTower.baseConfig.name} relocated!`, 2000);
            playSound('towerPlace', 'C4'); 
        } else {
            showStatusMessage("Cannot place tower here! Overlaps with path or another tower.", 2000);
            playSound('error');
        }
        return;
    }

    for (let tower of gameState.towers) {
        const dist = Math.sqrt((tower.x - clickX) ** 2 + (tower.y - clickY) ** 2);
        if (dist < tower.baseConfig.size + tower.level + 5) { 
            selectPlacedTower(tower);
            return; 
        }
    }

    if (gameState.selectedTowerType) {
        const towerCost = TOWER_BASE_STATS[gameState.selectedTowerType].cost;
        if (gameState.credits < towerCost) {
            showStatusMessage("Not enough credits!");
            playSound('error');
            return;
        }

        let validPosition = true;
        for (let point of path) {
            const dist = Math.sqrt((point.x - clickX) ** 2 + (point.y - clickY) ** 2);
            if (dist < 30) {
                validPosition = false; break;
            }
        }
        for (let tower of gameState.towers) {
            const dist = Math.sqrt((tower.x - clickX) ** 2 + (tower.y - clickY) ** 2);
            if (dist < 35) {
                validPosition = false; break;
            }
        }

        if (validPosition) {
            gameState.towers.push(new Tower(clickX, clickY, gameState.selectedTowerType));
            gameState.credits -= towerCost;
            playSound('towerPlace', 'G4');
            deselectTowerTypeToBuild(); 
            updateUI();
        } else {
            showStatusMessage("Cannot place tower here!");
            playSound('error');
        }
    } else if (gameState.selectedPlacedTower) { 
        gameState.selectedPlacedTower = null;
        updateSelectedTowerPanel(); 
    }
});

window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && gameState.isRelocatingTower) {
        const cancelledTower = gameState.relocatingTower;
        gameState.credits += cancelledTower.baseConfig.relocateCost;
        cancelledTower.x = cancelledTower.originalX;
        cancelledTower.y = cancelledTower.originalY;
        gameState.towers.push(cancelledTower); 

        gameState.isRelocatingTower = false;
        gameState.relocatingTower = null;
        deselectTowerTypeToBuild(); 
        showStatusMessage("Relocation cancelled. Credits refunded.", 2000);
        playSound('sell', 'F4'); 
        updateUI();
    }
});

function togglePauseGame() {
    gameState.isPaused = !gameState.isPaused;
    pauseBtn.textContent = gameState.isPaused ? "▶️ Resume" : "⏸️ Pause";
    showStatusMessage(gameState.isPaused ? "Game Paused." : "Game Resumed.");
    if (!gameState.isPaused && gameState.isPlaying) {
         gameState.lastTime = performance.now();
         if (animationFrameId === null) { 
            gameLoop(gameState.lastTime);
         }
    }
    playSound('towerPlace', gameState.isPaused ? 'C3' : 'E3');
}

function setGameSpeed(speed) {
    gameState.gameSpeed = speed;
    speed1xBtn.style.fontWeight = speed === 1 ? 'bold' : 'normal';
    speed1xBtn.style.borderColor = speed === 1 ? '#ffff00' : '#00ffff';
    speed2xBtn.style.fontWeight = speed === 2 ? 'bold' : 'normal';
    speed2xBtn.style.borderColor = speed === 2 ? '#ffff00' : '#00ffff';
    showStatusMessage(`Game speed set to ${speed}x.`);
    playSound('towerPlace', speed === 1 ? 'D3' : 'F3');
}

function toggleMute() {
    gameState.isMuted = !gameState.isMuted;
    muteBtn.textContent = gameState.isMuted ? "🔇 Unmute" : "🔊 Mute";
    showStatusMessage(gameState.isMuted ? "Sound Muted." : "Sound On.");
}

function updateUI() {
    healthEl.textContent = Math.max(0, gameState.health);
    creditsEl.textContent = gameState.credits;
    waveEl.textContent = gameState.wave;

    Object.keys(TOWER_BASE_STATS).forEach(type => {
        const button = document.getElementById(type + 'Tower');
        if (button) {
           button.disabled = gameState.credits < TOWER_BASE_STATS[type].cost || gameState.isRelocatingTower; 
        }
    });
    if (gameState.selectedPlacedTower) {
        updateSelectedTowerPanel();
    } else if (gameState.isRelocatingTower) { 
        updateSelectedTowerPanel();
    }
}

function gameOver() {
    gameState.isPlaying = false;
    playSound('gameOver');
    showModal("💀 GAME OVER 💀", `The alien horde overwhelmed your defenses! You survived ${gameState.wave} wave${gameState.wave === 1 ? '' : 's'}.`);
}

function gameWon() {
    gameState.isPlaying = false;
    playSound('victory');
    showModal("🎉 VICTORY! \n", `Congratulations, Commander! You defended the cosmos and survived all ${FINAL_WAVE} waves! Earth is safe... for now.`);
}

function startGame() {
    if (Tone.context.state !== 'running') {
        Tone.start(); 
    }
    if (!sounds.shootLaser) setupSounds(); 

    menuOverlay.classList.remove('active');
    setTimeout(() => menuOverlay.classList.add('hidden'), 300); 

    gameUI.classList.remove('hidden'); 

    initGame(); 


    gameState.lastTime = performance.now();
    if (animationFrameId === null) { 
         gameLoop(gameState.lastTime);
    }
}

function restartGame() {
    modalOverlay.classList.remove('active');
    setTimeout(() => modalOverlay.classList.add('hidden'), 300);
    startGame();
}

function showMenu() {
    gameState.isPlaying = false;
    if(animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    gameUI.classList.add('hidden');
    modalOverlay.classList.remove('active');
    setTimeout(() => modalOverlay.classList.add('hidden'), 300);

    menuOverlay.classList.remove('hidden');
    menuOverlay.classList.add('active'); 
}

window.onload = () => {
    generateTowerButtons();
    setGameSpeed(1); 
    resizeCanvas(); 
};