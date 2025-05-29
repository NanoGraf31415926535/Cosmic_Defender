function initGame() {
    gameState.health = 100;
    gameState.credits = 150;
    gameState.wave = 0;
    gameState.isPlaying = true;
    gameState.isPaused = false;
    gameState.isMuted = false;
    gameState.selectedTowerType = null;
    gameState.selectedPlacedTower = null;
    gameState.towers = [];
    gameState.enemies = [];
    gameState.projectiles = [];
    gameState.particles = [];
    gameState.waveActive = false;
    gameState.waveCountdown = 0; 
    gameState.isIntermission = false; 
    gameState.enemiesSpawnedThisWave = 0;
    gameState.totalEnemiesThisWave = 0;
    gameState.isRelocatingTower = false; 
    gameState.relocatingTower = null;
    gameState.explosionFlashTimer = 0; 

    gameState.stars = [];
    for (let i = 0; i < 200; i++) { 
        gameState.stars.push(new Star(
            Math.random() * canvas.width,
            Math.random() * canvas.height,
            Math.random() * 1.5 + 0.5, 
            Math.random() * 2 + 0.5 
        ));
    }

    gameState.planets = [];
    for (let i = 0; i < 3; i++) { 
        gameState.planets.push(new Planet(
            Math.random() * canvas.width,
            Math.random() * canvas.height,
            Math.random() * 20 + 20, 
            `hsl(${Math.random() * 360}, 50%, 40%)`,
            Math.random() * 0.2 + 0.05 
        ));
    }

    gameState.starships = [];
    for (let i = 0; i < 2; i++) { 
        gameState.starships.push(new Starship(
            Math.random() * canvas.width,
            Math.random() * canvas.height,
            Math.random() * 10 + 10, 
            '#aaaaaa', 
            Math.random() * 1 + 0.3 
        ));
    }

    finalWaveDisplayEl.textContent = FINAL_WAVE;
    updateUI();
    updateSelectedTowerPanel();
    deselectTowerTypeToBuild(); 

    prepareNextWave();
    showStatusMessage("Game started! Place your first towers.", 4000);
}

function gameLoop(currentTime) {
    if (!gameState.isPlaying) {
        if(animationFrameId) cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
        return;
    }

    animationFrameId = requestAnimationFrame(gameLoop); 
    const deltaTime = (currentTime - gameState.lastTime) / 1000; 
    gameState.lastTime = currentTime;

    if (!gameState.isPaused) {
        ctx.clearRect(0, 0, canvas.width, canvas.height); 

        gameState.stars.forEach(star => {
            star.update();
            star.draw();
        });
        gameState.planets.forEach(planet => {
            planet.update();
            planet.draw();
        });
        gameState.starships.forEach(starship => {
            starship.update();
            starship.draw();
        });

        ctx.strokeStyle = '#ffffff22';
        ctx.lineWidth = 25;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        if (path.length > 0) {
            ctx.moveTo(path[0].x, path[0].y);
            for (let i = 1; i < path.length; i++) {
                ctx.lineTo(path[i].x, path[i].y);
            }
        }
        ctx.stroke();

        gameState.towers = gameState.towers.filter(tower => {
            if (tower.health <= 0) {
                return false; 
            }
            tower.update();
            tower.draw();
            return true;
        });

        for (let i = gameState.enemies.length - 1; i >= 0; i--) {
            const enemy = gameState.enemies[i];
            if (!gameState.enemies.includes(enemy)) continue; 

            const isStillOnPath = enemy.update();

            if (!isStillOnPath) { 
                gameState.health -= 10; 
                spawnParticles(enemy.x, enemy.y, 10, '#ff0000', 'explosion');
                playSound('enemyReachedEnd', 'A2', '2n');

                const enemyIndex = gameState.enemies.findIndex(e => e.id === enemy.id);
                if(enemyIndex !== -1) gameState.enemies.splice(enemyIndex, 1);

                if (gameState.health <= 0) {
                    gameOver(); 
                    return; 
                }
            } else {
                enemy.draw();
            }
        }
        gameState.projectiles = gameState.projectiles.filter(p => {
            const alive = p.update();
            if (alive) p.draw();
            return alive;
        });

        gameState.particles = gameState.particles.filter(p => {
            const alive = p.update();
            if (alive) p.draw();
            return alive;
        });

        if (gameState.selectedTowerType) {
            const baseConfig = TOWER_BASE_STATS[gameState.selectedTowerType];
            const previewStats = baseConfig.levels[0];
            ctx.save();
            ctx.globalAlpha = 0.5;

            ctx.strokeStyle = baseConfig.color + '88';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(gameState.mouseX, gameState.mouseY, previewStats.range, 0, Math.PI * 2);
            ctx.stroke();

            const towerSize = baseConfig.size;
            const bodyGradient = ctx.createRadialGradient(gameState.mouseX, gameState.mouseY, towerSize * 0.5, gameState.mouseX, gameState.mouseY, towerSize);
            bodyGradient.addColorStop(0, '#ffffff'); 
            bodyGradient.addColorStop(0.5, baseConfig.color);
            bodyGradient.addColorStop(1, baseConfig.color.substring(0, 7) + '88');
            ctx.fillStyle = bodyGradient;
            ctx.beginPath();
            ctx.arc(gameState.mouseX, gameState.mouseY, towerSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        } else if (gameState.isRelocatingTower && gameState.relocatingTower) { 
            const relocatingTower = gameState.relocatingTower;
            const towerSize = relocatingTower.baseConfig.size + relocatingTower.level;
            const previewStats = relocatingTower.currentStats;

            let validPosition = true;
            for (let point of path) {
                const dist = Math.sqrt((point.x - gameState.mouseX) ** 2 + (point.y - gameState.mouseY) ** 2);
                if (dist < 30 + towerSize) {
                    validPosition = false; break;
                }
            }
            for (let tower of gameState.towers) {
                const dist = Math.sqrt((tower.x - gameState.mouseX) ** 2 + (tower.y - gameState.mouseY) ** 2);
                if (dist < (tower.baseConfig.size + tower.level) + towerSize + 5) {
                    validPosition = false; break;
                }
            }

            ctx.save();
            ctx.globalAlpha = 0.6; 
            ctx.strokeStyle = relocatingTower.baseConfig.color + '88';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(gameState.mouseX, gameState.mouseY, previewStats.range, 0, Math.PI * 2);
            ctx.stroke();
            const bodyGradient = ctx.createRadialGradient(gameState.mouseX, gameState.mouseY, towerSize * 0.5, gameState.mouseX, gameState.mouseY, towerSize);
            bodyGradient.addColorStop(0, '#ffffff'); 
            bodyGradient.addColorStop(0.5, validPosition ? relocatingTower.baseConfig.color : '#ff4444');
            bodyGradient.addColorStop(1, (validPosition ? relocatingTower.baseConfig.color : '#ff4444').substring(0, 7) + '88');
            ctx.fillStyle = bodyGradient;
            ctx.beginPath();
            ctx.arc(gameState.mouseX, gameState.mouseY, towerSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000';
            ctx.font = `${towerSize * 0.5}px monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(relocatingTower.level + 1, gameState.mouseX, gameState.mouseY + 1);

            ctx.restore();
        }
        drawExplosionFlash();
        if (gameState.waveActive && gameState.enemies.length === 0 && gameState.enemiesSpawnedThisWave === gameState.totalEnemiesThisWave) {
            gameState.waveActive = false;
            const waveReward = WAVE_CONFIG[Math.min(gameState.wave - 1, WAVE_CONFIG.length - 1)].waveReward || 50;
            gameState.credits += waveReward;

            if (gameState.wave >= FINAL_WAVE) {
                gameWon(); 
                return;
            } else {
                prepareNextWave(); 
            }
        }

        if (gameState.isIntermission && !gameState.waveActive) {
            gameState.waveCountdown -= deltaTime * gameState.gameSpeed;
            if (gameState.waveCountdown <= 0) {
                gameState.waveCountdown = 0; 
                startWave(); 
            }
            waveTimerEl.textContent = `Next wave in ${Math.ceil(gameState.waveCountdown)}s...`;
        } else if (!gameState.waveActive) {
            waveTimerEl.textContent = "Ready to start!";
        }
        updateUI();
    }
}