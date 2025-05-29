let gameState = {
    health: 100,
    credits: 150,
    wave: 0, 
    isPlaying: false,
    isPaused: false,
    isMuted: false,
    gameSpeed: 1,
    selectedTowerType: null, 
    selectedPlacedTower: null, 
    towers: [],
    enemies: [],
    projectiles: [],
    particles: [],
    stars: [], 
    planets: [], 
    starships: [], 
    waveActive: false,
    waveCountdown: 0, 
    isIntermission: false, 
    mouseX: 0,
    mouseY: 0,
    lastTime: 0, 
    enemiesSpawnedThisWave: 0,
    totalEnemiesThisWave: 0,
    isRelocatingTower: false, 
    relocatingTower: null, 
    explosionFlashTimer: 0, 
};

const FINAL_WAVE = 10;
const INTERMISSION_DURATION = 10; 
const TOWER_BASE_STATS = {
    laser: {
        name: "⚡ Laser Turret",
        cost: 50,
        projectileSpeed: 7,
        color: '#00ffff',
        projectileColor: '#00ffff',
        size: 12,
        levels: [
            { damage: 25, range: 110, fireRate: 50, upgradeCost: 30 }, 
            { damage: 35, range: 120, fireRate: 45, upgradeCost: 45 }, 
            { damage: 50, range: 130, fireRate: 40, upgradeCost: 60 }, 
            { damage: 70, range: 140, fireRate: 35, upgradeCost: 0 },  
        ],
        ability: {
            name: "Overcharge",
            cost: 75,
            cooldown: 900, 
            duration: 240, 
            damageMultiplier: 2.5 
        },
        relocateCost: 25 
    },
    missile: {
        name: "🚀 Missile Launcher",
        cost: 100,
        projectileSpeed: 4,
        color: '#ff4444',
        projectileColor: '#ff8888',
        size: 15,
        splash: 40, 
        levels: [
            { damage: 60, range: 100, fireRate: 120, upgradeCost: 70 },
            { damage: 85, range: 110, fireRate: 110, upgradeCost: 100 },
            { damage: 115, range: 120, fireRate: 100, upgradeCost: 140 },
            { damage: 150, range: 130, fireRate: 90, upgradeCost: 0 },
        ],
        relocateCost: 25 
    },
    freeze: {
        name: "❄️ Cryo Blaster",
        cost: 75,
        projectileSpeed: 5,
        color: '#44bbff',
        projectileColor: '#88ddff',
        size: 13,
        slow: true,
        slowDuration: 120, 
        slowFactor: 0.5, 
        levels: [
            { damage: 10, range: 90, fireRate: 90, upgradeCost: 50 },
            { damage: 15, range: 100, fireRate: 80, upgradeCost: 70 },
            { damage: 20, range: 110, fireRate: 70, upgradeCost: 90 },
            { damage: 25, range: 120, fireRate: 60, upgradeCost: 0 },
        ],
        relocateCost: 25 
    }
};

const ENEMY_TYPES = {
    basic: { health: 70, speed: 1, reward: 10, color: '#ff6666', size: 8 },
    fast: { health: 50, speed: 1.8, reward: 12, color: '#ff9966', size: 6 },
    heavy: { health: 150, speed: 0.6, reward: 20, color: '#ffff66', size: 12 },
    boss: { health: 500, speed: 0.4, reward: 75, color: '#ff66ff', size: 18 },
    healer: { health: 80, speed: 0.8, reward: 15, color: '#66ff66', size: 10,
              healingRange: 70, healingAmount: 5, healingCooldown: 90 }, 
    armored: { health: 180, speed: 0.5, reward: 25, color: '#aaaaaa', size: 14,
               damageReduction: 0.4 }, 
    kamikaze: { health: 60, speed: 1.2, reward: 18, color: '#ff0000', size: 10,
                        explosionRadius: 50, explosionDamage: 75, selfDestructDelay: 30 }, 
    stealth: { health: 40, speed: 1.5, reward: 20, color: '#00ccff', size: 7,
                       stealthDuration: 180, stealthCooldown: 300 }
};

const WAVE_CONFIG = [
    { basic: 8, fast: 0, heavy: 0, boss: 0, healer: 0, armored: 0, kamikaze: 0, stealth: 0, spawnInterval: 700, waveReward: 50 },
    { basic: 10, fast: 3, heavy: 0, boss: 0, healer: 0, armored: 0, kamikaze: 0, stealth: 0, spawnInterval: 650, waveReward: 60 },
    { basic: 12, fast: 5, heavy: 1, boss: 0, healer: 0, armored: 0, kamikaze: 0, stealth: 0, spawnInterval: 600, waveReward: 75 },
    { basic: 10, fast: 8, heavy: 2, boss: 0, healer: 1, armored: 0, kamikaze: 1, stealth: 0, spawnInterval: 550, waveReward: 90 },
    { basic: 15, fast: 5, heavy: 3, boss: 1, healer: 1, armored: 1, kamikaze: 2, stealth: 1, spawnInterval: 500, waveReward: 120 },
    { basic: 5, fast: 15, heavy: 4, boss: 0, healer: 2, armored: 2, kamikaze: 3, stealth: 2, spawnInterval: 450, waveReward: 150 },
    { basic: 10, fast: 10, heavy: 6, boss: 1, healer: 2, armored: 3, kamikaze: 4, stealth: 3, spawnInterval: 400, waveReward: 180 },
    { basic: 0, fast: 20, heavy: 8, boss: 1, healer: 3, armored: 4, kamikaze: 5, stealth: 4, spawnInterval: 350, waveReward: 220 },
    { basic: 10, fast: 10, heavy: 10, boss: 2, healer: 4, armored: 5, kamikaze: 6, stealth: 5, spawnInterval: 300, waveReward: 270 },
    { basic: 20, fast: 15, heavy: 12, boss: 3, healer: 5, armored: 6, kamikaze: 8, stealth: 6, spawnInterval: 250, waveReward: 500 },
];

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const healthEl = document.getElementById('health');
const creditsEl = document.getElementById('credits');
const waveEl = document.getElementById('wave');
const finalWaveDisplayEl = document.getElementById('finalWaveDisplay');
const waveTimerEl = document.getElementById('waveTimer');
const nextWaveBtn = document.getElementById('nextWaveBtn');
const statusMessageEl = document.getElementById('statusMessage');
const menuOverlay = document.getElementById('menuOverlay');
const gameUI = document.getElementById('gameUI');
const modalOverlay = document.getElementById('modalOverlay');
const modalTitleEl = document.getElementById('modalTitle');
const modalMessageEl = document.getElementById('modalMessage');
const pauseBtn = document.getElementById('pauseBtn');
const muteBtn = document.getElementById('muteBtn');
const speed1xBtn = document.getElementById('speed1xBtn');
const speed2xBtn = document.getElementById('speed2xBtn');

const selectedTowerPanel = document.getElementById('selectedTowerPanel');
const selectedTowerNameEl = document.getElementById('selectedTowerName');
const selectedTowerLevelEl = document.getElementById('selectedTowerLevel');
const selectedTowerDamageEl = document.getElementById('selectedTowerDamage');
const selectedTowerRangeEl = document.getElementById('selectedTowerRange');
const selectedTowerFireRateEl = document.getElementById('selectedTowerFireRate');
const upgradeTowerBtn = document.getElementById('upgradeTowerBtn');
const upgradeTowerCostEl = document.getElementById('upgradeTowerCost');
const sellTowerBtn = document.getElementById('sellTowerBtn');
const sellTowerRefundEl = document.getElementById('sellTowerRefund');
const relocateTowerBtn = document.getElementById('relocateTowerBtn');
const relocateTowerCostEl = document.getElementById('relocateTowerCost');

const abilitySection = document.getElementById('abilitySection');
const activateAbilityBtn = document.getElementById('activateAbilityBtn');
const abilityNameEl = document.getElementById('abilityName');
const abilityCostEl = document.getElementById('abilityCost');
const abilityCooldownEl = document.getElementById('abilityCooldown');
let path = [];

let animationFrameId = null; 

let sounds = {};