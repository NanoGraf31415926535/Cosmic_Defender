class Tower {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.baseConfig = TOWER_BASE_STATS[type];
        this.level = 0; 
        this.config = this.baseConfig.levels[this.level]; 
        this.cooldown = 0; 
        this.angle = 0; 
        this.id = Math.random().toString(36).substr(2, 9); 

        this.maxHealth = 100; 
        this.health = this.maxHealth;

        this.abilityCooldown = 0;
        this.abilityActiveTimer = 0;
        this.currentDamageMultiplier = 1; 

        this.originalX = x;
        this.originalY = y;
    }

    get currentStats() {
        return this.baseConfig.levels[this.level];
    }

    get maxLevel() {
        return this.baseConfig.levels.length -1;
    }

    getTotalCost() {
        let total = this.baseConfig.cost;
        for (let i = 0; i < this.level; i++) {
            total += this.baseConfig.levels[i].upgradeCost;
        }
        return total;
    }

    upgrade() {
        if (this.level < this.maxLevel) {
            const upgradeCost = this.currentStats.upgradeCost;
            if (gameState.credits >= upgradeCost) {
                gameState.credits -= upgradeCost;
                this.level++;
                this.config = this.currentStats; 
                this.health = Math.min(this.maxHealth, this.health + (this.maxHealth * 0.2));
                playSound('upgrade', 'E5');
                updateUI();
                updateSelectedTowerPanel(); 
                return true;
            } else {
                playSound('error');
                showStatusMessage("Not enough credits to upgrade!");
            }
        }
        return false;
    }

    activateAbility() {
        if (!this.baseConfig.ability) {
            showStatusMessage("This tower has no ability!");
            playSound('error');
            return false;
        }
        if (this.abilityCooldown > 0) {
            showStatusMessage("Ability is on cooldown!");
            playSound('error');
            return false;
        }
        if (gameState.credits < this.baseConfig.ability.cost) {
            showStatusMessage("Not enough credits for ability!");
            playSound('error');
            return false;
        }

        gameState.credits -= this.baseConfig.ability.cost;
        this.abilityActiveTimer = this.baseConfig.ability.duration;
        this.abilityCooldown = this.baseConfig.ability.cooldown;
        this.currentDamageMultiplier = this.baseConfig.ability.damageMultiplier; 
        playSound('abilityActivate', 'C6');
        showStatusMessage(`${this.baseConfig.name} activated ${this.baseConfig.ability.name}!`, 2000);
        updateUI();
        updateSelectedTowerPanel(); 
        return true;
    }

    takeDamage(damage) {
        this.health -= damage;
        playSound('hit', 'C2'); 
        spawnParticles(this.x, this.y, 5, '#ff0000', 'hit'); 

        if (this.health <= 0) {
            playSound('explosion');
            spawnParticles(this.x, this.y, 20, this.baseConfig.color, 'explosion');
            return true; 
        }
        return false; 
    }

    update() {
        if (this.cooldown > 0) this.cooldown -= gameState.gameSpeed;

        if (this.abilityCooldown > 0) {
            this.abilityCooldown -= gameState.gameSpeed;
        }
        if (this.abilityActiveTimer > 0) {
            this.abilityActiveTimer -= gameState.gameSpeed;
            if (this.abilityActiveTimer <= 0) {
                this.currentDamageMultiplier = 1; 
                showStatusMessage(`${this.baseConfig.name}'s Overcharge ended.`, 2000);
            }
        }


        let target = null;
        let nearestDist = this.config.range;

        for (let enemy of gameState.enemies) {
            if (enemy.isStealthed && enemy.type === 'stealth') {
                continue; 
            }

            const dist = Math.sqrt((enemy.x - this.x) ** 2 + (enemy.y - this.y) ** 2);
            if (dist < nearestDist) {
                nearestDist = dist;
                target = enemy;
            }
        }

        if (target) {
            this.angle = Math.atan2(target.y - this.y, target.x - this.x);
            if (this.cooldown <= 0) {
                this.shoot(target);
                this.cooldown = this.config.fireRate;
            }
        }
    }

    shoot(target) {
        gameState.projectiles.push(new Projectile(this.x, this.y, target, this, this.currentDamageMultiplier));
        if (this.type === 'laser') playSound('shootLaser', 'C5', '16n');
        else if (this.type === 'missile') playSound('shootMissile');
        else if (this.type === 'freeze') playSound('shootFreeze', 'A3', '8n');
    }

    draw() {
        const towerSize = this.baseConfig.size + this.level;
        const baseColor = this.baseConfig.color;
        const highlightColor = '#ffffff'; 

        if ((gameState.selectedTowerType === this.type && !this.id) ||
            (gameState.selectedPlacedTower && gameState.selectedPlacedTower.id === this.id) ||
            (gameState.isRelocatingTower && gameState.relocatingTower.id === this.id)) { 
            ctx.strokeStyle = baseColor + '44'; 
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.config.range, 0, Math.PI * 2);
            ctx.stroke();
        }

        const baseRadius = towerSize * 1.2;
        const baseGradient = ctx.createRadialGradient(this.x, this.y, baseRadius * 0.5, this.x, this.y, baseRadius);
        baseGradient.addColorStop(0, '#333');
        baseGradient.addColorStop(1, '#000');
        ctx.fillStyle = baseGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, baseRadius, 0, Math.PI * 2);
        ctx.fill();

        const bodyGradient = ctx.createRadialGradient(this.x, this.y, towerSize * 0.5, this.x, this.y, towerSize);
        bodyGradient.addColorStop(0, highlightColor);
        bodyGradient.addColorStop(0.5, baseColor);
        bodyGradient.addColorStop(1, baseColor.substring(0, 7) + '88');
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, towerSize, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        ctx.fillStyle = baseColor;
        ctx.fillRect(0, -3 - this.level * 0.5, towerSize * 1.5, 6 + this.level);

        ctx.fillStyle = highlightColor;
        ctx.fillRect(towerSize * 1.5, -2, 4, 4);
        ctx.restore();

        ctx.fillStyle = this.level > 0 ? (this.level >= this.maxLevel ? '#ffff00' : '#ffffff') : '#dddddd';
        ctx.beginPath();
        ctx.arc(this.x, this.y, towerSize * 0.4, 0, Math.PI * 2);
        ctx.fill();

        if (this.level > 0) {
            ctx.fillStyle = '#000';
            ctx.font = `${towerSize * 0.5}px monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.level + 1, this.x, this.y + 1);
        }

        if (this.abilityActiveTimer > 0) {
            ctx.save();
            ctx.strokeStyle = '#ff00ff'; 
            ctx.lineWidth = 2;
            ctx.globalAlpha = Math.sin(performance.now() * 0.01) * 0.4 + 0.6; 
            ctx.beginPath();
            ctx.arc(this.x, this.y, towerSize + 5, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
            ctx.restore();
        }

        const barWidth = towerSize * 2;
        const barHeight = 4;
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x - barWidth/2, this.y - towerSize - 8, barWidth, barHeight);
        ctx.fillStyle = this.health / this.maxHealth > 0.3 ? '#00ff00' : '#ff4444'; 
        ctx.fillRect(this.x - barWidth/2, this.y - towerSize - 8, barWidth * (this.health / this.maxHealth), barHeight);
    }
}

class Enemy {
    constructor(type) {
        this.type = type;
        this.config = ENEMY_TYPES[type];
        this.health = this.config.health * (1 + gameState.wave * 0.1);
        this.maxHealth = this.health;
        this.speed = this.config.speed;
        this.pathIndex = 0; 
        this.x = path[0].x;
        this.y = path[0].y;
        this.slowFactor = 1;
        this.slowTimer = 0; 
        this.id = Math.random().toString(36).substr(2, 9);
        this.hitEffectTimer = 0; 

        this.healingCooldown = this.config.healingCooldown || 0;

        this.isStealthed = false;
        this.stealthTimer = 0; 
        this.unstealthTimer = 0; 

        if (this.type === 'stealth') {
            this.isStealthed = true;
            this.stealthTimer = this.config.stealthDuration;
        }
    }

    update() {
        if (this.slowTimer > 0) {
            this.slowTimer -= gameState.gameSpeed;
        } else {
            this.slowFactor = 1; 
        }

        if (this.hitEffectTimer > 0) {
            this.hitEffectTimer -= gameState.gameSpeed;
        }

        if (this.type === 'stealth') {
            if (this.isStealthed) {
                this.stealthTimer -= gameState.gameSpeed;
                if (this.stealthTimer <= 0) {
                    this.isStealthed = false;
                    this.unstealthTimer = this.config.stealthCooldown;
                }
            } else {
                this.unstealthTimer -= gameState.gameSpeed;
                if (this.unstealthTimer <= 0) {
                    this.isStealthed = true;
                    this.stealthTimer = this.config.stealthDuration;
                }
            }
        }

        if (this.pathIndex < path.length - 1) {
            const targetPoint = path[this.pathIndex + 1];
            const dx = targetPoint.x - this.x;
            const dy = targetPoint.y - this.y;
            const distToTarget = Math.sqrt(dx * dx + dy * dy);

            const currentSpeed = this.speed * this.slowFactor * gameState.gameSpeed;

            if (distToTarget < currentSpeed) {
                this.x = targetPoint.x;
                this.y = targetPoint.y;
                this.pathIndex++;
            } else {
                this.x += (dx / distToTarget) * currentSpeed;
                this.y += (dy / distToTarget) * currentSpeed;
            }
        }

        if (this.type === 'healer') {
            if (this.healingCooldown > 0) {
                this.healingCooldown -= gameState.gameSpeed;
            } else {
                gameState.enemies.forEach(otherEnemy => {
                    if (otherEnemy.id !== this.id) { 
                        const dist = Math.sqrt((otherEnemy.x - this.x) ** 2 + (otherEnemy.y - this.y) ** 2);
                        if (dist < this.config.healingRange) {
                            otherEnemy.health = Math.min(otherEnemy.maxHealth, otherEnemy.health + this.config.healingAmount);
                            spawnParticles(otherEnemy.x, otherEnemy.y, 2, '#00ff00', 'heal');
                        }
                    }
                });
                this.healingCooldown = this.config.healingCooldown; 
            }
        }

        if (this.type === 'kamikaze') {
            for (let i = gameState.towers.length - 1; i >= 0; i--) {
                const tower = gameState.towers[i];
                const dist = Math.sqrt((tower.x - this.x) ** 2 + (tower.y - this.y) ** 2);
                if (dist < this.config.size + tower.baseConfig.size + 5) { 
                    this.selfDestruct(tower); 
                    return false; 
                }
            }
        }

        return this.pathIndex < path.length - 1; 
    }

    takeDamage(damage, sourceTower) {
        let actualDamage = damage;
        if (this.type === 'armored' && this.config.damageReduction) {
            actualDamage *= (1 - this.config.damageReduction);
        }

        this.health -= actualDamage;
        this.hitEffectTimer = 10; 
        spawnParticles(this.x, this.y, 3, sourceTower.baseConfig.projectileColor, 'hit');
        playSound('hit', 'C3', '16n');

        if (sourceTower.baseConfig.slow && this.slowFactor === 1) {
            this.slowFactor = sourceTower.baseConfig.slowFactor;
            this.slowTimer = sourceTower.baseConfig.slowDuration;
        }

        if (this.health <= 0) {
            gameState.credits += this.config.reward; 
            playSound('explosion');
            spawnParticles(this.x, this.y, 10 + this.config.size, this.config.color, 'explosion');
            return true; 
        }
        return false; 
    }

    selfDestruct(targetTower) {
        const isTargetDestroyed = targetTower.takeDamage(this.config.explosionDamage);
        if (isTargetDestroyed) {
            gameState.towers = gameState.towers.filter(t => t.id !== targetTower.id);
            if (gameState.selectedPlacedTower && gameState.selectedPlacedTower.id === targetTower.id) {
                deselectTowerTypeToBuild();
            }
        }

        gameState.towers.forEach(otherTower => {
            if (otherTower.id !== targetTower.id) { 
                const dist = Math.sqrt((otherTower.x - this.x) ** 2 + (otherTower.y - this.y) ** 2);
                if (dist < this.config.explosionRadius) {
                    const isOtherDestroyed = otherTower.takeDamage(this.config.explosionDamage * 0.5, this.tower); 
                    if (isOtherDestroyed) {
                        gameState.towers = gameState.towers.filter(t => t.id !== otherTower.id);
                        if (gameState.selectedPlacedTower && gameState.selectedPlacedTower.id === otherTower.id) {
                            deselectTowerTypeToBuild();
                        }
                    }
                }
            }
        });

        playSound('explosion', 'D2', '4n'); 
        spawnParticles(this.x, this.y, 25, this.config.color, 'explosion'); 
        gameState.explosionFlashTimer = 10; 

        this.health = 0;
        gameState.credits += this.config.reward;
        updateUI();
    }

    draw() {
        ctx.save();
        if (this.type === 'stealth' && this.isStealthed) {
            ctx.globalAlpha = 0.3; 
        }

        if (this.hitEffectTimer > 0) {
            ctx.globalAlpha *= (this.hitEffectTimer / 10) * 0.8 + 0.2; 
            ctx.strokeStyle = '#ffffff'; 
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.config.size + 3, 0, Math.PI * 2);
            ctx.stroke();
        }

        const enemyGradient = ctx.createRadialGradient(this.x, this.y, this.config.size * 0.3, this.x, this.y, this.config.size);
        enemyGradient.addColorStop(0, '#ffffff'); 
        enemyGradient.addColorStop(0.8, this.config.color);
        enemyGradient.addColorStop(1, this.config.color.substring(0, 7) + '88'); 
        ctx.fillStyle = enemyGradient;

        ctx.beginPath();
        switch (this.type) {
            case 'basic':
                ctx.arc(this.x, this.y, this.config.size, 0, Math.PI * 2); 
                break;
            case 'fast':
                ctx.moveTo(this.x, this.y - this.config.size);
                ctx.lineTo(this.x + this.config.size, this.y + this.config.size * 0.8);
                ctx.lineTo(this.x - this.config.size, this.y + this.config.size * 0.8);
                ctx.closePath();
                break;
            case 'heavy':
                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI / 3) * i;
                    ctx.lineTo(this.x + this.config.size * Math.cos(angle), this.y + this.config.size * Math.sin(angle));
                }
                ctx.closePath();
                break;
            case 'boss':
                const outerRadius = this.config.size;
                const innerRadius = this.config.size * 0.5;
                const points = 5;
                for (let i = 0; i < points * 2; i++) {
                    const radius = i % 2 === 0 ? outerRadius : innerRadius;
                    const angle = (Math.PI / points) * i - Math.PI / 2; 
                    ctx.lineTo(this.x + radius * Math.cos(angle), this.y + radius * Math.sin(angle));
                }
                ctx.closePath();
                break;
            case 'healer':
                ctx.arc(this.x, this.y, this.config.size, 0, Math.PI * 2); 
                ctx.fill();
                ctx.strokeStyle = '#00ff00'; 
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(this.x - this.config.size * 0.6, this.y);
                ctx.lineTo(this.x + this.config.size * 0.6, this.y);
                ctx.moveTo(this.x, this.y - this.config.size * 0.6);
                ctx.lineTo(this.x, this.y + this.config.size * 0.6);
                ctx.stroke();
                break;
            case 'armored':
                ctx.arc(this.x, this.y, this.config.size, 0, Math.PI * 2); 
                ctx.fill();
                ctx.strokeStyle = '#ffffff'; 
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.config.size * 1.2, 0, Math.PI * 2);
                ctx.stroke();
                break;
            case 'kamikaze':
                const spikeCount = 8;
                const spikeLength = this.config.size * 0.4;
                ctx.arc(this.x, this.y, this.config.size, 0, Math.PI * 2); 
                ctx.fill();
                ctx.strokeStyle = '#ff0000';
                ctx.lineWidth = 1;
                for (let i = 0; i < spikeCount; i++) {
                    const angle = (Math.PI * 2 / spikeCount) * i;
                    ctx.beginPath();
                    ctx.moveTo(this.x + this.config.size * Math.cos(angle), this.y + this.config.size * Math.sin(angle));
                    ctx.lineTo(this.x + (this.config.size + spikeLength) * Math.cos(angle), this.y + (this.config.size + spikeLength) * Math.sin(angle));
                    ctx.stroke();
                }
                break;
            case 'stealth':
                ctx.arc(this.x, this.y, this.config.size, 0, Math.PI * 2); 
                break;
        }
        ctx.fill();


        const barWidth = this.config.size * 2;
        const barHeight = 4;
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x - barWidth/2, this.y - this.config.size - 8, barWidth, barHeight);
        ctx.fillStyle = this.health / this.maxHealth > 0.3 ? '#00ff00' : '#ff4444'; 
        ctx.fillRect(this.x - barWidth/2, this.y - this.config.size - 8, barWidth * (this.health / this.maxHealth), barHeight);

        if (this.slowTimer > 0) {
            ctx.strokeStyle = '#44bbff88';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.config.size + 2, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Visual for Healer enemy healing aura
        if (this.type === 'healer' && this.healingCooldown < this.config.healingCooldown * 0.5) {
            ctx.strokeStyle = '#00ff0088';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.config.size + 5 + (1 - this.healingCooldown / (this.config.healingCooldown * 0.5)) * (this.config.healingRange - this.config.size - 5), 0, Math.PI * 2);
            ctx.stroke();
        }

        if (this.type === 'armored') {
            ctx.strokeStyle = '#ffffffaa';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.config.size + 2, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.restore(); 
    }
}

class Projectile {
    constructor(x, y, target, tower, damageMultiplier = 1) { 
        this.x = x;
        this.y = y;
        this.target = target; 
        this.tower = tower; 
        this.config = tower.baseConfig; 
        this.stats = tower.currentStats; 
        this.damageMultiplier = damageMultiplier; 
        // Calculates initial velocity towards target
        const dx = this.target.x - x;
        const dy = this.target.y - y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1; 

        this.vx = (dx / dist) * this.config.projectileSpeed * gameState.gameSpeed;
        this.vy = (dy / dist) * this.config.projectileSpeed * gameState.gameSpeed;
        this.life = 150 / gameState.gameSpeed; 
    }

    // Updates projectile position and checks for hits
    update() {
        if (this.config.splash && this.target && this.target.health > 0) {
             const dx = this.target.x - this.x;
             const dy = this.target.y - this.y;
             const dist = Math.sqrt(dx*dx + dy*dy) || 1;
             this.vx = (dx / dist) * this.config.projectileSpeed * gameState.gameSpeed;
             this.vy = (dy / dist) * this.config.projectileSpeed * gameState.gameSpeed;
        }

        this.x += this.vx;
        this.y += this.vy;
        this.life--;

        // Check for collision with enemies
        for (let i = gameState.enemies.length - 1; i >= 0; i--) {
            const enemy = gameState.enemies[i];
            // Only hit if enemy is not stealthed, or if it's not a stealth enemy type
            if (enemy.isStealthed && enemy.type === 'stealth') {
                continue; // Cannot hit stealthed enemies
            }
            const dist = Math.sqrt((enemy.x - this.x) ** 2 + (enemy.y - this.y) ** 2);

            if (dist < enemy.config.size + 3) { 
                this.hit(enemy, i);
                return false; 
            }
        }
        return this.life > 0 && this.x > -20 && this.x < canvas.width + 20 && this.y > -20 && this.y < canvas.height + 20;
    }

    hit(enemy, enemyIndexInArray) {
        const damageToDeal = this.stats.damage * this.damageMultiplier;
        const isDestroyed = enemy.takeDamage(damageToDeal, this.tower);

        if (isDestroyed) {
            const currentEnemyIndex = gameState.enemies.findIndex(e => e.id === enemy.id);
            if (currentEnemyIndex !== -1) {
                gameState.enemies.splice(currentEnemyIndex, 1);
            }
        }

        if (this.config.splash) {
            playSound('explosion');
            spawnParticles(this.x, this.y, 15, this.config.projectileColor, 'explosion');
            gameState.explosionFlashTimer = 10; 
            for (let i = gameState.enemies.length - 1; i >= 0; i--) {
                const otherEnemy = gameState.enemies[i];
                if (otherEnemy.id !== enemy.id) {
                    const dist = Math.sqrt((otherEnemy.x - this.x) ** 2 + (otherEnemy.y - this.y) ** 2);
                    if (dist < this.config.splash) {
                        const splashDestroyed = otherEnemy.takeDamage(damageToDeal * 0.5, this.tower);
                        if (splashDestroyed) {
                            const stillExistsIndex = gameState.enemies.findIndex(e => e.id === otherEnemy.id);
                            if (stillExistsIndex !== -1) {
                                gameState.enemies.splice(stillExistsIndex, 1);
                            }
                        }
                    }
                }
            }
        }
    }

    draw() {
        ctx.fillStyle = this.config.projectileColor;
        ctx.strokeStyle = this.config.projectileColor;
        ctx.lineWidth = 2;

        switch (this.config.name) {
            case "⚡ Laser Turret":
                ctx.beginPath();
                ctx.moveTo(this.x - this.vx * 5, this.y - this.vy * 5); 
                ctx.lineTo(this.x, this.y);
                ctx.stroke();
                ctx.shadowBlur = 10;
                ctx.shadowColor = this.config.projectileColor;
                ctx.beginPath();
                ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0; 
                break;
            case "🚀 Missile Launcher":
                ctx.beginPath();
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(Math.atan2(this.vy, this.vx));
                ctx.fillRect(-5, -2, 10, 4); 
                ctx.fillStyle = 'orange';
                ctx.beginPath();
                ctx.arc(-5, 0, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
                break;
            case "❄️ Cryo Blaster":
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(performance.now() * 0.01);
                ctx.strokeStyle = this.config.projectileColor;
                ctx.lineWidth = 1.5;
                const size = 6;
                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI / 3) * i;
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(size * Math.cos(angle), size * Math.sin(angle));
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(size * Math.cos(angle), size * Math.sin(angle));
                    ctx.lineTo((size * 0.7) * Math.cos(angle + 0.3), (size * 0.7) * Math.sin(angle + 0.3));
                    ctx.moveTo(size * Math.cos(angle), size * Math.sin(angle));
                    ctx.lineTo((size * 0.7) * Math.cos(angle - 0.3), (size * 0.7) * Math.sin(angle - 0.3));
                    ctx.stroke();
                }
                ctx.restore();
                break;
            default:
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.config.splash ? 5 : 3, 0, Math.PI * 2); 
                ctx.fill();
                break;
        }
    }
}

class Particle {
    constructor(x, y, size, color, type = 'hit') {
        this.x = x;
        this.y = y;
        this.size = Math.random() * size + 1;
        this.color = color;
        this.type = type;
        const angle = Math.random() * Math.PI * 2; 
        const speed = Math.random() * (type === 'explosion' ? 6 : 2) + 0.5; 
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.life = type === 'explosion' ? (Math.random() * 60 + 30) : (Math.random() * 20 + 10); 
        this.opacity = 1;
    }

    update() {
        this.x += this.vx * gameState.gameSpeed;
        this.y += this.vy * gameState.gameSpeed;
        this.life -= gameState.gameSpeed;
        this.opacity = Math.max(0, this.life / (this.type === 'explosion' ? 60 : 20)); 
        if (this.type === 'explosion') this.vy += 0.05 * gameState.gameSpeed; 
        return this.life > 0;
    }

    draw() {
        ctx.globalAlpha = this.opacity;
        if (this.type === 'explosion') {
            const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
            gradient.addColorStop(0, '#ffffff'); 
            gradient.addColorStop(0.5, this.color);
            gradient.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = gradient;
        } else {
            ctx.fillStyle = this.color;
        }
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

class Star {
    constructor(x, y, size, speed) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.opacity = Math.random() * 0.8 + 0.2; 
        this.speed = speed;
    }

    update() {
        this.x -= this.speed * gameState.gameSpeed * 0.1;
        if (this.x < -this.size) { 
            this.x = canvas.width + this.size;
            this.y = Math.random() * canvas.height;
            this.opacity = Math.random() * 0.8 + 0.2;
        }
    }

    draw() {
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

class Planet {
    constructor(x, y, radius, color, speed) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.speed = speed; 
        this.opacity = Math.random() * 0.2 + 0.05; 
    }

    update() {
        this.x -= this.speed * gameState.gameSpeed * 0.01; 
        if (this.x < -this.radius) { 
            this.x = canvas.width + this.radius + Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.radius = Math.random() * 20 + 20;
            this.color = `hsl(${Math.random() * 360}, 50%, 40%)`;
            this.opacity = Math.random() * 0.2 + 0.05; 
        }
    }

    draw() {
        ctx.globalAlpha = this.opacity; 
        const gradient = ctx.createRadialGradient(this.x - this.radius * 0.3, this.y - this.radius * 0.3, 0, this.x, this.y, this.radius);
        gradient.addColorStop(0, 'white'); 
        gradient.addColorStop(0.7, this.color);
        gradient.addColorStop(1, 'black');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255,255,255,0.05)'; 
        ctx.lineWidth = this.radius * 0.05; 
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 1.2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1; 
    }
}

class Starship {
    constructor(x, y, size, color, speed) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.color = color;
        this.speed = speed; 
    }

    update() {
        this.x -= this.speed * gameState.gameSpeed * 0.08; 
        if (this.x < -this.size * 2) { 
            this.x = canvas.width + this.size * 2 + Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 10 + 10; 
        }
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - this.size); 
        ctx.lineTo(this.x + this.size * 0.8, this.y + this.size * 0.6); 
        ctx.lineTo(this.x + this.size * 0.4, this.y + this.size * 1.2); 
        ctx.lineTo(this.x - this.size * 0.4, this.y + this.size * 1.2); 
        ctx.lineTo(this.x - this.size * 0.8, this.y + this.size * 0.6); 
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 165, 0, 0.7)'; 
        ctx.beginPath();
        ctx.arc(this.x, this.y + this.size * 1.2 + 5, this.size * 0.4, 0, Math.PI * 2);
        ctx.fill();
    }
}