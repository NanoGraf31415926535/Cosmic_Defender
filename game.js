function initGame() {
    const currentMission = MISSION_CONFIG[gameState.currentMission];
    gameState.health = currentMission.startingHealth;
    gameState.credits = currentMission.startingCredits;
    gameState.wave = 0;
    gameState.isPlaying = true;
    gameState.isPaused = false;
    gameState.isMuted = gameState.isMuted;
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
    if (canvas && canvas.width && canvas.height) {
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
    }


    if(finalWaveDisplayEl) finalWaveDisplayEl.textContent = WAVES_PER_MISSION;
    if(currentMissionNameEl) currentMissionNameEl.textContent = currentMission.name;
    updateUI();
    updateSelectedTowerPanel();
    deselectTowerTypeToBuild();

    if (canvas && canvas.width > 0 && canvas.height > 0) {
         prepareNextWave();
    } else {
        console.warn("Canvas not ready for prepareNextWave in initGame");
    }
    showStatusMessage(`Mission: ${currentMission.name}. Place your first towers.`, 4000);
}

function gameLoop(currentTime) {
    if (!gameState.isPlaying) {
        if(animationFrameId) cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
        return;
    }

    animationFrameId = requestAnimationFrame(gameLoop);
    const deltaTime = (currentTime - gameState.lastTime) / 1000 || 0;
    gameState.lastTime = currentTime;

    if (!gameState.isPaused) {
        // Ensure ctx and canvas are available before drawing
        if (!canvas || !ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Pass canvas dimensions and ctx to update/draw methods
        gameState.stars.forEach(star => {
            star.update(canvas.width, canvas.height, gameState.gameSpeed);
            star.draw(ctx);
        });
        gameState.planets.forEach(planet => {
            planet.update(canvas.width, canvas.height, gameState.gameSpeed);
            planet.draw(ctx);
        });
        gameState.starships.forEach(starship => {
            starship.update(canvas.width, canvas.height, gameState.gameSpeed);
            starship.draw(ctx);
        });

        if (path.length > 0) {
            ctx.strokeStyle = '#ffffff22';
            ctx.lineWidth = 25;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(path[0].x, path[0].y);
            for (let i = 1; i < path.length; i++) {
                ctx.lineTo(path[i].x, path[i].y);
            }
            ctx.stroke();
        }


        gameState.towers = gameState.towers.filter(tower => {
            if (tower.health <= 0) {
                return false;
            }
            tower.update();
            tower.draw(ctx); // Pass ctx
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
                enemy.draw(ctx); // Pass ctx
            }
        }
        gameState.projectiles = gameState.projectiles.filter(p => {
            const alive = p.update(canvas.width, canvas.height); // Pass canvas dimensions
            if (alive) p.draw(ctx); // Pass ctx
            return alive;
        });

        gameState.particles = gameState.particles.filter(p => {
            const alive = p.update(gameState.gameSpeed); // Pass gameSpeedFactor
            if (alive) p.draw(ctx); // Pass ctx
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
                if (tower.id === relocatingTower.id) continue;
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
        drawExplosionFlash(ctx); // Pass ctx
        const currentMission = MISSION_CONFIG[gameState.currentMission];
        if (gameState.waveActive && gameState.enemies.length === 0 && gameState.enemiesSpawnedThisWave === gameState.totalEnemiesThisWave) {
            gameState.waveActive = false;
            const waveReward = currentMission.waves[Math.min(gameState.wave - 1, currentMission.waves.length - 1)].waveReward || 50;
            gameState.credits += waveReward;

            if (gameState.wave >= WAVES_PER_MISSION) {
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
           if(waveTimerEl) waveTimerEl.textContent = `Next wave in ${Math.ceil(gameState.waveCountdown)}s...`;
        } else if (!gameState.waveActive && gameState.wave > 0) {
            if(waveTimerEl) waveTimerEl.textContent = `Wave ${gameState.wave} in progress...`;
        } else if (!gameState.waveActive && gameState.wave === 0) {
           if(waveTimerEl) waveTimerEl.textContent = "Ready to start!";
        }
        updateUI();
    }
}