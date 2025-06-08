let statusMessageTimeoutId = null;

function showStatusMessage(message, duration = 2000) {
    if (statusMessageEl) {
        statusMessageEl.textContent = message;
        if (statusMessageTimeoutId) {
            clearTimeout(statusMessageTimeoutId);
        }
        if (duration > 0) {
            statusMessageTimeoutId = setTimeout(() => {
                if (statusMessageEl) statusMessageEl.textContent = "";
                statusMessageTimeoutId = null;
            }, duration);
        }
    } else {
        console.log("Status Message:", message);
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

    sounds.waveStart = new Tone.Player("https://tonejs.github.io/audio/berklee/gong_1.mp3").toDestination();
    sounds.gameOver = new Tone.Player("https://tonejs.github.io/audio/berklee/gong_2.mp3").toDestination();
    sounds.victory = new Tone.Player("https://tonejs.github.io/audio/berklee/gong_1.mp3").toDestination();
    sounds.uiClick = new Tone.Synth({
        oscillator: { type: "sine" },
        envelope: { attack: 0.005, decay: 0.05, sustain: 0, release: 0.1 },
        volume: -18
    }).toDestination();


    sounds.waveStart.volume.value = -10;
    sounds.gameOver.volume.value = -5;
    sounds.victory.volume.value = -5;

    const initialSfxVolume = localStorage.getItem('sfxVolume');
    if (initialSfxVolume !== null) {
        setSfxVolume(parseInt(initialSfxVolume));
    }
    const initialMusicVolume = localStorage.getItem('musicVolume');
    if (initialMusicVolume !== null) {
        setMusicVolume(parseInt(initialMusicVolume));
    }
}

function playSound(soundName, note = 'C4', duration = '8n') {
    if (gameState.isMuted || !sounds[soundName]) return;

    try {
        const sound = sounds[soundName];
        const timeToPlay = Tone.now() + 0.005;

        if (sound instanceof Tone.Player) {
            sound.volume.value = Tone.gainToDb(gameState.sfxVolume); 
            sound.stop(timeToPlay).start(timeToPlay);
        } else if (sound instanceof Tone.PolySynth) {
            sound.volume.value = Tone.gainToDb(gameState.sfxVolume); 
            sound.triggerAttackRelease(note, duration, timeToPlay);
        } else if (sound instanceof Tone.NoiseSynth) {
            sound.volume.value = Tone.gainToDb(gameState.sfxVolume); 
            sound.triggerAttackRelease(duration, timeToPlay);
        } else if (sound.triggerAttackRelease) {
            sound.volume.value = Tone.gainToDb(gameState.sfxVolume); 
            sound.triggerAttackRelease(note, duration, timeToPlay);
        }
    } catch (e) {
        console.error(`Error playing sound: ${soundName} (Note: ${note}, Duration: ${duration})`, e);
    }
}

function setSfxVolume(volume) {
    gameState.sfxVolume = volume / 100; 
    localStorage.setItem('sfxVolume', volume);
}

function setMusicVolume(volume) {
    gameState.musicVolume = volume / 100; 
    if (music) {
        music.volume.value = Tone.gainToDb(gameState.musicVolume);
    }
    localStorage.setItem('musicVolume', volume);
}


function generateTowerButtons() {
    const shopEl = document.querySelector('.tower-shop');
    if (!shopEl) return;
    shopEl.innerHTML = '';
    Object.keys(TOWER_BASE_STATS).forEach((type, index) => {
        const config = TOWER_BASE_STATS[type];
        const button = document.createElement('button');
        button.classList.add('tower-button');
        button.id = `${type}Tower`;
        button.onclick = () => selectTowerTypeToBuild(type);
        const keyHint = (index + 1).toString();
        button.innerHTML = `
            <div class="tower-name">${config.name} <span class='key-hint'>(${keyHint})</span></div>
            <div class="tower-cost">Cost: ${config.cost} credits</div>
            <div class="tower-desc">Lvl 1: ${config.levels[0].damage} Dmg, ${config.levels[0].range} Rng</div>
        `;
        shopEl.appendChild(button);
    });
}

function resizeCanvas() {
    if (!canvas) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    if (gameState.isPlaying && gameState.wave > 0) {
    } else {
        generatePath();
    }
    if (missionMapCanvas) {
        missionMapCanvas.width = missionMapCanvas.offsetWidth;
        missionMapCanvas.height = missionMapCanvas.offsetHeight;
        if (missionSelectOverlay.classList.contains('active')) {
        }
    }
}
window.addEventListener('resize', resizeCanvas);

function generatePath() {
    if (!canvas || !canvas.width || !canvas.height) return;
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

function showModal(title, message, button1Text = "Restart", button1Action = restartGame, button2Text = "Menu", button2Action = showMainMenu) {
    gameState.isPlaying = false;
    if(animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    if (modalTitleEl) modalTitleEl.textContent = title;
    if (modalMessageEl) modalMessageEl.textContent = message;

    const modalBtn1 = document.getElementById('modalButton1');
    if (modalBtn1) {
        modalBtn1.textContent = button1Text;
        modalBtn1.onclick = button1Action;
    }

    const modalBtn2 = document.getElementById('modalButton2');
    if (modalBtn2) {
        modalBtn2.textContent = button2Text;
        modalBtn2.onclick = button2Action;
    }
    if (modalOverlay) {
        modalOverlay.classList.remove('hidden');
        modalOverlay.classList.add('active');
    }
}

function selectTowerTypeToBuild(type) {
    if (gameState.isRelocatingTower) {
        showStatusMessage("Cancel relocation first (ESC)!", 2000);
        playSound('error');
        return;
    }

    if (TOWER_BASE_STATS[type] && gameState.credits >= TOWER_BASE_STATS[type].cost) {
        gameState.selectedTowerType = type;
        gameState.selectedPlacedTower = null;
        updateSelectedTowerPanel();
        showStatusMessage(`Placing: ${TOWER_BASE_STATS[type].name}. Cost: ${TOWER_BASE_STATS[type].cost}`);

        document.querySelectorAll('.tower-button').forEach(btn => btn.classList.remove('selected'));
        const buttonEl = document.getElementById(type + 'Tower');
        if (buttonEl) buttonEl.classList.add('selected');
        playSound('towerPlace', 'C4');
    } else if (TOWER_BASE_STATS[type]) {
        showStatusMessage("Not enough credits!");
        playSound('error');
    } else {
        console.warn("Attempted to select unknown tower type:", type);
    }
}

function deselectTowerTypeToBuild() {
    gameState.selectedTowerType = null;
    gameState.selectedPlacedTower = null;
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
    if (!selectedTowerPanel) return;
    if (gameState.selectedPlacedTower && !gameState.isRelocatingTower) {
        const tower = gameState.selectedPlacedTower;
        const stats = tower.currentStats;
        selectedTowerPanel.classList.remove('hidden');
        if(selectedTowerNameEl) selectedTowerNameEl.textContent = `${tower.baseConfig.name}`;
        if(selectedTowerLevelEl) selectedTowerLevelEl.textContent = tower.level + 1;
        if(selectedTowerDamageEl) selectedTowerDamageEl.textContent = stats.damage;
        if(selectedTowerRangeEl) selectedTowerRangeEl.textContent = stats.range;
        if(selectedTowerFireRateEl) selectedTowerFireRateEl.textContent = (60 / (stats.fireRate / 60)).toFixed(1) + "/sec";

        const creditsIconSpanHTML = `<span class="credits-icon" style="display: inline-block; vertical-align: middle; width:10px; height:10px;"></span>`;

        if (tower.level < tower.maxLevel) {
            if(upgradeTowerBtn) {
                upgradeTowerBtn.innerHTML = `Upgrade <span class='key-hint'>(U)</span> (<span id="upgradeTowerCost">${stats.upgradeCost}</span> ${creditsIconSpanHTML})`;
                upgradeTowerBtn.disabled = gameState.credits < stats.upgradeCost;
                upgradeTowerBtn.classList.remove('hidden');
            }
        } else {
            if(upgradeTowerBtn) {
                upgradeTowerBtn.innerHTML = `Upgrade <span class='key-hint'>(U)</span> (MAX)`;
                upgradeTowerBtn.disabled = true;
                upgradeTowerBtn.classList.add('hidden');
            }
        }
        if(sellTowerBtn) {
            const refundAmount = Math.floor(tower.getTotalCost() * 0.7);
            sellTowerBtn.innerHTML = `Sell <span class='key-hint'>(S)</span> (<span id="sellTowerRefund">${refundAmount}</span> ${creditsIconSpanHTML})`;
            sellTowerBtn.classList.remove('hidden');
        }
        if(relocateTowerBtn) {
            relocateTowerBtn.innerHTML = `Relocate <span class='key-hint'>(R)</span> (<span id="relocateTowerCost">${tower.baseConfig.relocateCost}</span> ${creditsIconSpanHTML})`;
            relocateTowerBtn.disabled = gameState.credits < tower.baseConfig.relocateCost;
            relocateTowerBtn.classList.remove('hidden');
        }

        if (tower.baseConfig.ability) {
            if(abilitySection) abilitySection.classList.remove('hidden');
            const ability = tower.baseConfig.ability;
            if(abilityNameEl) abilityNameEl.innerHTML = `${ability.name} <span class='key-hint'>(A)</span>`;
            if(abilityCostEl) abilityCostEl.textContent = `Cost: ${ability.cost} credits`;

            if (tower.abilityCooldown > 0) {
                if(abilityCooldownEl) abilityCooldownEl.textContent = `Cooldown: ${Math.ceil(tower.abilityCooldown / 60)}s`;
                if(activateAbilityBtn) activateAbilityBtn.disabled = true;
            } else {
                if(abilityCooldownEl) abilityCooldownEl.textContent = `Ready`;
                if(activateAbilityBtn) activateAbilityBtn.disabled = gameState.credits < ability.cost;
            }
        } else {
            if(abilitySection) abilitySection.classList.add('hidden');
        }
        showStatusMessage(`Selected: ${tower.baseConfig.name} (Lvl ${tower.level + 1})`, 0);
    } else {
        selectedTowerPanel.classList.add('hidden');
        if(abilitySection) abilitySection.classList.add('hidden');
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
    const currentMission = MISSION_CONFIG[gameState.currentMission];
    if (gameState.wave >= WAVES_PER_MISSION) {
        gameWon();
        return;
    }

    gameState.isIntermission = true;
    gameState.waveCountdown = INTERMISSION_DURATION;
    if(nextWaveBtn) {
        nextWaveBtn.disabled = false;
        nextWaveBtn.innerHTML = `🌊 Start Wave ${gameState.wave + 1} (Skip) <span class="key-hint">(N, Space)</span>`;
    }
    if(waveTimerEl) waveTimerEl.textContent = `Next wave in ${Math.ceil(gameState.waveCountdown)}s...`;
    showStatusMessage(`Wave ${gameState.wave} cleared! Prepare for Wave ${gameState.wave + 1}.`, 0);

    if (canvas && canvas.width > 0 && canvas.height > 0) {
        generatePath();
    }
}

function startWave() {
    if (gameState.waveActive) return;

    gameState.wave++;
    gameState.waveActive = true;
    gameState.isIntermission = false;
    gameState.enemiesSpawnedThisWave = 0;

    const currentMission = MISSION_CONFIG[gameState.currentMission];
    const currentWaveConfig = currentMission.waves[Math.min(gameState.wave - 1, currentMission.waves.length - 1)];
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
            if (path.length > 0) { 
                gameState.enemies.push(new Enemy(enemyType));
            } else {
                console.warn("Path not generated, cannot spawn enemy");
            }
            gameState.enemiesSpawnedThisWave++;
            if(gameState.isPlaying && gameState.waveActive) {
               setTimeout(spawnEnemyFromList, spawnInterval / gameState.gameSpeed);
            }
        }
    }
    spawnEnemyFromList();

    if(nextWaveBtn) {
        nextWaveBtn.disabled = true;
        nextWaveBtn.innerHTML = `Wave ${gameState.wave} Active`;
    }
    if(waveTimerEl) waveTimerEl.textContent = `Wave ${gameState.wave} in progress...`;
    playSound('waveStart');
    showStatusMessage(`Wave ${gameState.wave} incoming!`);
}

function skipWaveCountdown() {
    if (gameState.isIntermission && !gameState.waveActive) {
        startWave();
    }
}

if (canvas) {
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
                 if (tower.id === relocatingTower.id) continue;
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
            deselectTowerTypeToBuild();
        }
    });
}


function handleKeydown(e) {
    if (modalOverlay && modalOverlay.classList.contains('active') || mainMenuOverlay && mainMenuOverlay.classList.contains('active') || missionSelectOverlay && missionSelectOverlay.classList.contains('active') || settingsOverlay && settingsOverlay.classList.contains('active')) {
        return;
    }
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
    }

    switch (e.key.toUpperCase()) {
        case '1':
            selectTowerTypeToBuild('laser');
            break;
        case '2':
            selectTowerTypeToBuild('missile');
            break;
        case '3':
            selectTowerTypeToBuild('freeze');
            break;
        case 'U':
            if (gameState.selectedPlacedTower && upgradeTowerBtn && !upgradeTowerBtn.disabled) {
                upgradeSelectedTower();
            } else if (gameState.selectedPlacedTower) {
                 playSound('error');
                 showStatusMessage("Cannot upgrade: Not enough credits or max level.", 1500);
            }
            break;
        case 'S':
            if (gameState.selectedPlacedTower && sellTowerBtn && !sellTowerBtn.disabled) {
                sellSelectedTower();
            }
            break;
        case 'R':
            if (gameState.selectedPlacedTower && relocateTowerBtn && !relocateTowerBtn.disabled) {
                relocateSelectedTower();
            } else if (gameState.selectedPlacedTower) {
                playSound('error');
                showStatusMessage("Cannot relocate: Not enough credits.", 1500);
            }
            break;
        case 'A':
            if (gameState.selectedPlacedTower && gameState.selectedPlacedTower.baseConfig.ability && activateAbilityBtn && !activateAbilityBtn.disabled) {
                activateSelectedTowerAbility();
            } else if (gameState.selectedPlacedTower && gameState.selectedPlacedTower.baseConfig.ability) {
                playSound('error');
                showStatusMessage("Cannot activate: Not enough credits or on cooldown.", 1500);
            }
            break;
        case 'N':
        case ' ':
            if (nextWaveBtn && !nextWaveBtn.disabled) {
                skipWaveCountdown();
            }
            break;
        case 'P':
            togglePauseGame();
            break;
        case 'M':
            toggleMute();
            break;
        case 'ESCAPE':
            if (gameState.isRelocatingTower && gameState.relocatingTower) {
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
            } else if (gameState.selectedTowerType) {
                deselectTowerTypeToBuild();
                showStatusMessage("Tower placement cancelled.", 1500);
                playSound('sell', 'F3');
            } else if (gameState.selectedPlacedTower) {
                deselectTowerTypeToBuild();
            }
            break;
    }
}
window.addEventListener('keydown', handleKeydown);


function togglePauseGame() {
    gameState.isPaused = !gameState.isPaused;
    if(pauseBtn) pauseBtn.innerHTML = gameState.isPaused ? "▶️ Resume <span class='key-hint'>(P)</span>" : "⏸️ Pause <span class='key-hint'>(P)</span>";
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
    if(speed1xBtn) {
        speed1xBtn.style.fontWeight = speed === 1 ? 'bold' : 'normal';
        speed1xBtn.style.borderColor = speed === 1 ? '#ffff00' : '#00ffff';
    }
    if(speed2xBtn) {
        speed2xBtn.style.fontWeight = speed === 2 ? 'bold' : 'normal';
        speed2xBtn.style.borderColor = speed === 2 ? '#ffff00' : '#00ffff';
    }
    showStatusMessage(`Game speed set to ${speed}x.`);
    playSound('towerPlace', speed === 1 ? 'D3' : 'F3');
}

function toggleMute() {
    gameState.isMuted = !gameState.isMuted;
    if(muteBtn) muteBtn.innerHTML = gameState.isMuted ? "🔇 Unmute <span class='key-hint'>(M)</span>" : "🔊 Mute <span class='key-hint'>(M)</span>";
    showStatusMessage(gameState.isMuted ? "Sound Muted." : "Sound On.");
}

function updateUI() {
    if(healthEl) healthEl.textContent = Math.max(0, gameState.health);
    if(creditsEl) creditsEl.textContent = gameState.credits;
    if(waveEl) waveEl.textContent = gameState.wave;
    if(currentMissionNameEl) currentMissionNameEl.textContent = MISSION_CONFIG[gameState.currentMission].name;

    Object.keys(TOWER_BASE_STATS).forEach(type => {
        const button = document.getElementById(type + 'Tower');
        if (button) {
           button.disabled = gameState.credits < TOWER_BASE_STATS[type].cost || gameState.isRelocatingTower;
        }
    });
    if (gameState.selectedPlacedTower || gameState.isRelocatingTower) {
        updateSelectedTowerPanel();
    }
}

function gameOver() {
    gameState.isPlaying = false;
    playSound('gameOver');
    showModal("💀 GAME OVER 💀", `The alien horde overwhelmed your defenses! You survived ${gameState.wave} wave${gameState.wave === 1 ? '' : 's'} in ${MISSION_CONFIG[gameState.currentMission].name}.`);
}

function gameWon() {
    gameState.isPlaying = false;
    playSound('victory');

    const currentMissionIndex = gameState.currentMission;
    if (!gameState.completedMissions.includes(currentMissionIndex)) {
        gameState.completedMissions.push(currentMissionIndex);
        saveGameProgress(); // Save completed missions
    }

    if (gameState.currentMission < MISSION_CONFIG.length - 1) {
        showModal("🎉 MISSION COMPLETE! 🎉",
                  `You successfully defended the ${MISSION_CONFIG[gameState.currentMission].name}! Prepare for the next challenge.`,
                  "Next Mission", () => {
                      gameState.currentMission++;
                      restartGame(); // Re-initialize game for next mission
                  },
                  "Main Menu", showMainMenu);
    } else {
        showModal("🏆 ALL MISSIONS COMPLETE! 🏆",
                  `Congratulations, Commander! You have completed all missions and saved the galaxy!`,
                  "Play Again", restartGame,
                  "Main Menu", showMainMenu);
    }
}

function startGameFlow() {
    if (Tone.context.state !== 'running') {
        Tone.start();
    }
    if (!sounds.shootLaser) setupSounds();

    if(mainMenuOverlay) {
        mainMenuOverlay.classList.remove('active');
        setTimeout(() => {
            mainMenuOverlay.classList.add('hidden');
        }, 500);
    }
    if(missionSelectOverlay) { // Hide mission select if active
        missionSelectOverlay.classList.remove('active');
        missionSelectOverlay.classList.add('hidden');
        if (mapAnimationFrameId) {
            cancelAnimationFrame(mapAnimationFrameId);
            mapAnimationFrameId = null;
        }
    }
    if(settingsOverlay) { // Hide settings if active
        settingsOverlay.classList.remove('active');
        settingsOverlay.classList.add('hidden');
    }
    if(gameUI) gameUI.classList.remove('hidden');

    resizeCanvas();
    generatePath();

    initGame();

    gameState.lastTime = performance.now();
    if (animationFrameId === null) {
         gameLoop(gameState.lastTime);
    }
}

function handleStartGame() {
    playSound('uiClick', 'C5');
    gameState.currentMission = 0; // Always start new game from first mission
    startGameFlow();
}

// Mission Selection Functions
function saveGameProgress() {
    try {
        localStorage.setItem('cosmicDefenderProgress', JSON.stringify(gameState.completedMissions));
        console.log("Game progress saved.");
    } catch (e) {
        console.error("Failed to save game progress:", e);
    }
}

function loadGameProgress() {
    try {
        const savedProgress = localStorage.getItem('cosmicDefenderProgress');
        if (savedProgress) {
            gameState.completedMissions = JSON.parse(savedProgress);
            console.log("Game progress loaded:", gameState.completedMissions);
        }
    } catch (e) {
        console.error("Failed to load game progress:", e);
        gameState.completedMissions = []; // Reset on error
    }
}

function clearGameProgress() {
    // Replaced confirm() with a custom modal or direct action for Canvas environment compatibility
    // For this example, we'll directly clear for simplicity. In a real game, you'd want a custom confirmation modal.
    localStorage.removeItem('cosmicDefenderProgress');
    gameState.completedMissions = [];
    gameState.currentMission = 0; 
    showStatusMessage("Game progress cleared!", 3000);
    showMainMenu(); 
}


function selectMission() {
    playSound('uiClick', 'D5');
    if(mainMenuOverlay) mainMenuOverlay.classList.remove('active');
    if(missionSelectOverlay) {
        missionSelectOverlay.classList.remove('hidden');
        missionSelectOverlay.classList.add('active');
    }
    gameState.activeSelectedMissionIndex = -1; // Reset selected mission
    if(missionDetailsPanel) missionDetailsPanel.classList.add('hidden'); // Hide details panel
    resizeCanvas(); // Ensure map canvas is sized correctly

    // Initialize map background elements
    gameState.mapBackgroundStars = [];
    if (missionMapCanvas && missionMapCanvas.width && missionMapCanvas.height) {
        for (let i = 0; i < 100; i++) { // Fewer stars for map background
            gameState.mapBackgroundStars.push(new Star(
                Math.random() * missionMapCanvas.width,
                Math.random() * missionMapCanvas.height,
                Math.random() * 1 + 0.3,
                Math.random() * 1 + 0.2
            ));
        }

        gameState.mapBackgroundPlanets = [];
        for (let i = 0; i < 2; i++) { // Fewer planets for map background
            gameState.mapBackgroundPlanets.push(new Planet(
                Math.random() * missionMapCanvas.width,
                Math.random() * missionMapCanvas.height,
                Math.random() * 15 + 15,
                `hsl(${Math.random() * 360}, 50%, 40%)`,
                Math.random() * 0.1 + 0.02
            ));
        }

        gameState.mapBackgroundStarships = [];
        for (let i = 0; i < 1; i++) { // One starship for map background
            gameState.mapBackgroundStarships.push(new Starship(
                Math.random() * missionMapCanvas.width,
                Math.random() * missionMapCanvas.height,
                Math.random() * 8 + 8,
                '#cccccc',
                Math.random() * 0.5 + 0.1
            ));
        }
    }

    // Start the map animation loop
    if (mapAnimationFrameId) cancelAnimationFrame(mapAnimationFrameId);
    mapAnimationFrameId = requestAnimationFrame(mapAnimationLoop);

    // Add event listener for click to select mission
    if (missionMapCanvas) {
        missionMapCanvas.onclick = (e) => {
            const rect = missionMapCanvas.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;

            for (let i = 0; i < MISSION_CONFIG.length; i++) {
                const mission = MISSION_CONFIG[i];
                const nodeX = mission.mapX * missionMapCanvas.width;
                const nodeY = mission.mapY * missionMapCanvas.height;
                const radius = 20;

                const dist = Math.sqrt((nodeX - clickX) ** 2 + (nodeY - clickY) ** 2);
                if (dist < radius) {
                    const isLocked = !(i === 0 || gameState.completedMissions.includes(i - 1));
                    if (!isLocked) {
                        gameState.activeSelectedMissionIndex = i;
                        showMissionDetails(MISSION_CONFIG[i], false); // Show details for clicked mission
                        playSound('uiClick', 'G5');
                    } else {
                        showStatusMessage("This mission is locked. Complete the previous one first!", 2000);
                        playSound('error');
                        // Ensure details panel is hidden if a locked mission is clicked
                        if(missionDetailsPanel) missionDetailsPanel.classList.add('hidden');
                        gameState.activeSelectedMissionIndex = -1; // Deselect
                    }
                    break;
                }
            }
        };
        // Remove existing mousemove listener as it's no longer needed for details
        missionMapCanvas.onmousemove = null;
    }
    drawMissionMap(); // Initial draw
}

function mapAnimationLoop(currentTime) {
    if (!missionMapCanvas || !missionMapCtx) return;

    mapAnimationFrameId = requestAnimationFrame(mapAnimationLoop);
    const deltaTime = (currentTime - (mapAnimationLoop.lastTime || currentTime)) / 1000 || 0;
    mapAnimationLoop.lastTime = currentTime;

    // Update background elements
    gameState.mapBackgroundStars.forEach(star => {
        star.x -= star.speed * deltaTime * 10; // Adjust speed for map
        if (star.x < -star.size) {
            star.x = missionMapCanvas.width + star.size;
            star.y = Math.random() * missionMapCanvas.height;
            star.opacity = Math.random() * 0.8 + 0.2;
        }
    });
    gameState.mapBackgroundPlanets.forEach(planet => {
        planet.x -= planet.speed * deltaTime * 10; // Adjust speed for map
        if (planet.x < -planet.radius) {
            planet.x = missionMapCanvas.width + planet.radius + Math.random() * missionMapCanvas.width;
            planet.y = Math.random() * missionMapCanvas.height;
            planet.radius = Math.random() * 15 + 15;
            planet.color = `hsl(${Math.random() * 360}, 50%, 40%)`;
            planet.opacity = Math.random() * 0.2 + 0.05;
        }
    });
    gameState.mapBackgroundStarships.forEach(starship => {
        starship.x -= starship.speed * deltaTime * 10; // Adjust speed for map
        if (starship.x < -starship.size * 2) {
            starship.x = missionMapCanvas.width + starship.size * 2 + Math.random() * missionMapCanvas.width;
            starship.y = Math.random() * missionMapCanvas.height;
            starship.size = Math.random() * 8 + 8;
        }
    });

    drawMissionMap();
}


function drawMissionMap() {
    if (!missionMapCanvas || !missionMapCtx) return;

    const ctx = missionMapCtx;
    const canvasWidth = missionMapCanvas.width;
    const canvasHeight = missionMapCanvas.height;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.fillStyle = '#0a0a2e'; // Dark space background
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw background elements
    gameState.mapBackgroundStars.forEach(star => star.draw());
    gameState.mapBackgroundPlanets.forEach(planet => planet.draw());
    gameState.mapBackgroundStarships.forEach(starship => starship.draw());

    const missionNodes = [];

    // Draw paths between missions
    for (let i = 0; i < MISSION_CONFIG.length; i++) {
        const mission = MISSION_CONFIG[i];
        const currentX = mission.mapX * canvasWidth;
        const currentY = mission.mapY * canvasHeight;

        // Draw lines to prerequisites
        if (mission.prerequisites && mission.prerequisites.length > 0) {
            mission.prerequisites.forEach(prereqId => {
                const prereqIndex = MISSION_CONFIG.findIndex(m => m.id === prereqId);
                if (prereqIndex !== -1) {
                    const prereqMission = MISSION_CONFIG[prereqIndex];
                    const prereqX = prereqMission.mapX * canvasWidth;
                    const prereqY = prereqMission.mapY * canvasHeight;

                    ctx.beginPath();
                    ctx.moveTo(prereqX, prereqY);
                    ctx.lineTo(currentX, currentY);

                    // Determine line color based on completion
                    const isPrereqCompleted = gameState.completedMissions.includes(prereqIndex);
                    if (isPrereqCompleted) {
                        ctx.strokeStyle = '#00ff00'; // Completed path
                        ctx.lineWidth = 3;
                        ctx.setLineDash([]); // Solid line
                    } else {
                        ctx.strokeStyle = '#555555'; // Locked path
                        ctx.lineWidth = 1;
                        ctx.setLineDash([5, 5]); // Dashed line for locked paths
                    }
                    ctx.stroke();
                }
            });
        }
    }
    ctx.setLineDash([]); // Reset line dash for other drawings

    // Draw mission nodes
    MISSION_CONFIG.forEach((mission, index) => {
        const x = mission.mapX * canvasWidth;
        const y = mission.mapY * canvasHeight;
        const radius = 20;

        let fillColor = '#333333'; // Locked
        let strokeColor = '#555555';
        let textColor = '#aaaaaa';
        let isLocked = false;

        if (index === 0 || gameState.completedMissions.includes(index - 1)) {
            isLocked = false;
            fillColor = '#0066cc'; // Available
            strokeColor = '#00ffff';
            textColor = '#ffffff';
            if (gameState.completedMissions.includes(index)) {
                fillColor = '#008800'; // Completed
                strokeColor = '#00ff00';
                textColor = '#ffffff';
            }
        } else {
            isLocked = true;
        }

        // Store node data for click detection
        missionNodes.push({ x, y, radius, index, isLocked });

        // Highlight if actively selected
        if (index === gameState.activeSelectedMissionIndex) {
            ctx.beginPath();
            ctx.arc(x, y, radius + 5, 0, Math.PI * 2);
            ctx.strokeStyle = '#ffff00'; // Highlight color
            ctx.lineWidth = 3;
            ctx.stroke();
        }

        // Draw circle
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = fillColor;
        ctx.fill();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw mission number
        ctx.fillStyle = textColor;
        ctx.font = 'bold 14px Orbitron';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(index + 1, x, y);

        // Draw lock icon if locked
        if (isLocked) {
            ctx.fillStyle = '#ff0000';
            ctx.font = 'bold 18px sans-serif';
            ctx.fillText('🔒', x, y + radius + 15);
        }
    });

    // Draw spaceship at the active selected mission
    if (gameState.activeSelectedMissionIndex !== -1) {
        const mission = MISSION_CONFIG[gameState.activeSelectedMissionIndex];
        const x = mission.mapX * canvasWidth;
        const y = mission.mapY * canvasHeight;
        drawSpaceship(ctx, x, y, 15, '#ffffff'); // Draw a small spaceship
    }
}

// Function to draw a simple spaceship (can be enhanced)
function drawSpaceship(ctx, x, y, size, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-Math.PI / 2); // Point upwards

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, -size * 1.5); // Nose
    ctx.lineTo(size, size);     // Right wing
    ctx.lineTo(-size, size);    // Left wing
    ctx.closePath();
    ctx.fill();

    // Cockpit
    ctx.fillStyle = '#88ddff';
    ctx.beginPath();
    ctx.arc(0, -size * 0.5, size * 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Engine glow
    ctx.fillStyle = 'orange';
    ctx.beginPath();
    ctx.moveTo(0, size * 1.5);
    ctx.lineTo(size * 0.5, size * 1.2);
    ctx.lineTo(-size * 0.5, size * 1.2);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}


function showMissionDetails(mission, isLocked) {
    if (!missionDetailsPanel) return;

    if(missionDetailsNameEl) missionDetailsNameEl.textContent = mission.name;
    if(missionDetailsDescriptionEl) missionDetailsDescriptionEl.textContent = mission.description;
    if(missionDetailsStoryEl) missionDetailsStoryEl.textContent = mission.story;

    if(missionDetailsStartBtn) {
        missionDetailsStartBtn.onclick = startSelectedMission;
        missionDetailsStartBtn.disabled = isLocked;
        missionDetailsStartBtn.textContent = isLocked ? "Locked" : "Begin Mission";
    }

    missionDetailsPanel.classList.remove('hidden');
}

function startSelectedMission() {
    if (gameState.activeSelectedMissionIndex !== -1) {
        const missionIndex = gameState.activeSelectedMissionIndex;
        const mission = MISSION_CONFIG[missionIndex];
        const isLocked = !(missionIndex === 0 || gameState.completedMissions.includes(missionIndex - 1));

        if (!isLocked) {
            gameState.currentMission = missionIndex;
            startGameFlow();
            playSound('uiClick', 'C6');
        } else {
            showStatusMessage("This mission is locked. Complete the previous one first!", 2000);
            playSound('error');
        }
    } else {
        showStatusMessage("Please select a mission first!", 2000);
        playSound('error');
    }
}

// Settings Functions
function showSettings() {
    playSound('uiClick', 'E5');
    if(mainMenuOverlay) mainMenuOverlay.classList.remove('active');
    if(settingsOverlay) {
        settingsOverlay.classList.remove('hidden');
        settingsOverlay.classList.add('active');
    }

    const sfxVolumeSlider = document.getElementById('sfxVolumeSlider');
    if (sfxVolumeSlider) {
        sfxVolumeSlider.value = gameState.sfxVolume * 100; // Convert 0-1 to 0-100
        sfxVolumeSlider.oninput = (e) => setSfxVolume(parseInt(e.target.value));
    }
    const musicVolumeSlider = document.getElementById('musicVolumeSlider');
    if (musicVolumeSlider) {
        musicVolumeSlider.value = gameState.musicVolume * 100; // Convert 0-1 to 0-100
        musicVolumeSlider.oninput = (e) => setMusicVolume(parseInt(e.target.value));
    }
}

function closeSettings() {
    playSound('uiClick', 'A4');
    if(settingsOverlay) {
        settingsOverlay.classList.remove('active');
        setTimeout(() => settingsOverlay.classList.add('hidden'), 300);
    }
    showMainMenu();
}


function exitGame() {
    playSound('uiClick', 'F4');
    showStatusMessage("Thanks for playing Cosmic Defender!", 3000);
    console.log("Exit Game clicked - (Not Implemented - in a real scenario, this might close the window or return to a launcher)");
    if(mainMenuOverlay) {
        mainMenuOverlay.classList.remove('active');
        setTimeout(() => {
            if(mainMenuOverlay) mainMenuOverlay.classList.add('hidden');
            document.body.innerHTML = `<div style="display:flex; flex-direction:column; justify-content:center; align-items:center; height:100vh; font-family: 'Orbitron', sans-serif; font-size:2em; color: #00ccff; text-align:center; background:#050816;">Thanks for playing Cosmic Defender!<br><br><button style="font-family: 'Rajdhani', sans-serif; background: linear-gradient(145deg, #0d3b66, #0a2c4e); color: #e0f7fa; border: 2px solid #00ccff; padding: 12px 20px; font-size: 0.8em; border-radius: 8px; cursor: pointer;" onclick="location.reload()">Play Again?</button></div>`;
        }, 500);
    }
}


function restartGame() {
    if(modalOverlay) {
        modalOverlay.classList.remove('active');
        setTimeout(() => modalOverlay.classList.add('hidden'), 300);
    }
    // currentMission is already set if coming from gameWon
    startGameFlow();
}

function showMainMenu() {
    gameState.isPlaying = false;
    if(animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    if(mapAnimationFrameId) { // Cancel map animation if returning to main menu
        cancelAnimationFrame(mapAnimationFrameId);
        mapAnimationFrameId = null;
    }
    if(gameUI) gameUI.classList.add('hidden');
    if(modalOverlay) {
        modalOverlay.classList.remove('active');
        setTimeout(() => modalOverlay.classList.add('hidden'), 300);
    }
    if(missionSelectOverlay) { // Ensure mission select is hidden when going to main menu
        missionSelectOverlay.classList.remove('active');
        missionSelectOverlay.classList.add('hidden');
    }
    if(settingsOverlay) { // Ensure settings is hidden when going to main menu
        settingsOverlay.classList.remove('active');
        settingsOverlay.classList.add('hidden');
    }

    if(mainMenuOverlay) {
        mainMenuOverlay.classList.remove('hidden');
        mainMenuOverlay.classList.add('active');
    }
    playSound('uiClick', 'A4');
    loadGameProgress(); // Load progress when returning to main menu
}

window.onload = () => {
    generateTowerButtons();
    setGameSpeed(1);

    const pauseButton = document.getElementById('pauseBtn');
    if(pauseButton) pauseButton.innerHTML = `⏸️ Pause <span class='key-hint'>(P)</span>`;
    const muteButton = document.getElementById('muteBtn');
    if(muteButton) muteButton.innerHTML = `🔊 Mute <span class='key-hint'>(M)</span>`;

    const startBtn = document.getElementById('startButton');
    const selectMissionBtn = document.getElementById('selectMissionButton');
    const settingsBtn = document.getElementById('settingsButton');
    const exitBtn = document.getElementById('exitButton');

    if(startBtn) startBtn.onclick = handleStartGame;
    if(selectMissionBtn) selectMissionBtn.onclick = selectMission;
    if(settingsBtn) settingsBtn.onclick = showSettings;
    if(exitBtn) exitBtn.onclick = exitGame;

    resizeCanvas();
    generatePath();
    loadGameProgress(); // Load progress on initial load
    showMainMenu();
};

const mainMenuOverlay = document.getElementById('mainMenuOverlay');