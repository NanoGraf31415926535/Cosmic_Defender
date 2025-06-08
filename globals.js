let gameState = {
    health: 100,
    credits: 150,
    wave: 0,
    currentMission: 0, // Index of the current mission in MISSION_CONFIG
    completedMissions: [], // Array of completed mission indices
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
    stars: [], // Stars for main game background
    planets: [], // Planets for main game background
    starships: [], // Starships for main game background
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
    musicVolume: 0.5, // New state for music volume
    sfxVolume: 0.7, // New state for SFX volume

    // New state for mission map background
    mapBackgroundStars: [],
    mapBackgroundPlanets: [],
    mapBackgroundStarships: [],
    activeSelectedMissionIndex: -1, // Index of the mission currently selected on the map by click
};

const WAVES_PER_MISSION = 10;
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

const MISSION_CONFIG = [
    {
        id: "M1",
        name: "Training Grounds",
        description: "A basic introduction to tower defense. Easy enemies, simple path.",
        story: "Welcome, Commander! Your first assignment is to defend the training grounds. This will familiarize you with basic defense protocols against a standard alien threat. Don't underestimate even the smallest enemy!",
        startingCredits: 200, // Easier start
        startingHealth: 120, // More health
        mapX: 0.15, // Relative X coordinate on map (0-1)
        mapY: 0.5,  // Relative Y coordinate on map (0-1)
        prerequisites: [], // No prerequisites for the first mission
        waves: [
            { basic: 8, fast: 0, heavy: 0, spawnInterval: 800, waveReward: 50 },
            { basic: 10, fast: 2, heavy: 0, spawnInterval: 750, waveReward: 60 },
            { basic: 12, fast: 4, heavy: 1, spawnInterval: 700, waveReward: 70 },
            { basic: 15, fast: 5, heavy: 2, spawnInterval: 650, waveReward: 80 },
            { basic: 18, fast: 6, heavy: 3, spawnInterval: 600, waveReward: 90 },
            { basic: 20, fast: 8, heavy: 4, spawnInterval: 550, waveReward: 100 },
            { basic: 22, fast: 10, heavy: 5, spawnInterval: 500, waveReward: 110 },
            { basic: 25, fast: 12, heavy: 6, spawnInterval: 450, waveReward: 120 },
            { basic: 28, fast: 14, heavy: 7, spawnInterval: 400, waveReward: 130 },
            { basic: 30, fast: 15, heavy: 8, spawnInterval: 350, waveReward: 150 },
        ]
    },
    {
        id: "M2",
        name: "Asteroid Field Alpha",
        description: "Navigating through dense asteroid fields, expect more fast enemies and your first armored units.",
        story: "The recent surge in enemy activity is linked to a hidden base within the Alpha Asteroid Field. Your mission is to secure this sector. Beware: the asteroids provide excellent cover for fast-moving and heavily armored units!",
        startingCredits: 180,
        startingHealth: 110,
        mapX: 0.35,
        mapY: 0.3,
        prerequisites: ["M1"],
        waves: [
            { basic: 5, fast: 10, heavy: 2, armored: 1, spawnInterval: 700, waveReward: 70 },
            { basic: 8, fast: 12, heavy: 3, armored: 2, spawnInterval: 650, waveReward: 85 },
            { basic: 10, fast: 15, heavy: 4, armored: 3, spawnInterval: 600, waveReward: 100 },
            { basic: 12, fast: 18, heavy: 5, armored: 4, spawnInterval: 550, waveReward: 115 },
            { basic: 15, fast: 20, heavy: 6, armored: 5, spawnInterval: 500, waveReward: 130 },
            { basic: 18, fast: 22, heavy: 7, armored: 6, spawnInterval: 480, waveReward: 145 },
            { basic: 20, fast: 25, heavy: 8, armored: 7, spawnInterval: 460, waveReward: 160 },
            { basic: 22, fast: 28, heavy: 9, armored: 8, spawnInterval: 440, waveReward: 175 },
            { basic: 25, fast: 30, heavy: 10, armored: 9, spawnInterval: 420, waveReward: 190 },
            { basic: 28, fast: 32, heavy: 11, armored: 10, spawnInterval: 400, waveReward: 220 },
        ]
    },
    {
        id: "M3",
        name: "Deep Space Outpost",
        description: "Defend a remote outpost against advanced enemy units, including healers and kamikazes.",
        story: "Our deep space listening post, 'Echo-7', is under heavy assault. This outpost is crucial for tracking enemy fleet movements. Expect coordinated attacks, including self-destructing units and enemy healers. Protect Echo-7 at all costs!",
        startingCredits: 160,
        startingHealth: 100,
        mapX: 0.6,
        mapY: 0.6,
        prerequisites: ["M2"],
        waves: [
            { basic: 5, fast: 5, heavy: 5, healer: 1, kamikaze: 1, spawnInterval: 650, waveReward: 80 },
            { basic: 8, fast: 8, heavy: 6, healer: 2, kamikaze: 2, spawnInterval: 600, waveReward: 100 },
            { basic: 10, fast: 10, heavy: 7, healer: 2, kamikaze: 3, armored: 1, spawnInterval: 550, waveReward: 120 },
            { basic: 12, fast: 12, heavy: 8, healer: 3, kamikaze: 4, armored: 2, spawnInterval: 500, waveReward: 140 },
            { basic: 15, fast: 15, heavy: 9, healer: 3, kamikaze: 5, armored: 3, spawnInterval: 480, waveReward: 160 },
            { basic: 18, fast: 18, heavy: 10, healer: 4, kamikaze: 6, armored: 4, spawnInterval: 460, waveReward: 180 },
            { basic: 20, fast: 20, heavy: 11, healer: 4, kamikaze: 7, armored: 5, spawnInterval: 440, waveReward: 200 },
            { basic: 22, fast: 22, heavy: 12, healer: 5, kamikaze: 8, armored: 6, spawnInterval: 420, waveReward: 220 },
            { basic: 25, fast: 25, heavy: 13, healer: 5, kamikaze: 9, armored: 7, spawnInterval: 400, waveReward: 240 },
            { basic: 28, fast: 28, heavy: 14, healer: 6, kamikaze: 10, armored: 8, spawnInterval: 380, waveReward: 280 },
        ]
    },
    {
        id: "M4",
        name: "Nebula Nexus",
        description: "A treacherous mission within a volatile nebula. Expect cloaked enemies and environmental hazards.",
        story: "Intel suggests the enemy is using the dense Nebula Nexus as a staging ground for their stealth units. Visuals are limited, making detection difficult. Adapt your defenses to counter unseen threats and environmental interference!",
        startingCredits: 140,
        startingHealth: 90,
        mapX: 0.8,
        mapY: 0.2,
        prerequisites: ["M3"],
        waves: [
            { basic: 5, fast: 10, heavy: 3, stealth: 3, spawnInterval: 600, waveReward: 90 },
            { basic: 8, fast: 12, heavy: 4, stealth: 5, armored: 2, spawnInterval: 550, waveReward: 110 },
            { basic: 10, fast: 15, heavy: 5, stealth: 7, armored: 3, healer: 1, spawnInterval: 500, waveReward: 130 },
            { basic: 12, fast: 18, heavy: 6, stealth: 9, armored: 4, healer: 2, kamikaze: 2, spawnInterval: 480, waveReward: 150 },
            { basic: 15, fast: 20, heavy: 7, stealth: 11, armored: 5, healer: 3, kamikaze: 3, spawnInterval: 460, waveReward: 170 },
            { basic: 18, fast: 22, heavy: 8, stealth: 13, armored: 6, healer: 4, kamikaze: 4, spawnInterval: 440, waveReward: 190 },
            { basic: 20, fast: 25, heavy: 9, stealth: 15, armored: 7, healer: 5, kamikaze: 5, spawnInterval: 420, waveReward: 210 },
            { basic: 22, fast: 28, heavy: 10, stealth: 17, armored: 8, healer: 6, kamikaze: 6, spawnInterval: 400, waveReward: 230 },
            { basic: 25, fast: 30, heavy: 11, stealth: 19, armored: 9, healer: 7, kamikaze: 7, spawnInterval: 380, waveReward: 250 },
            { basic: 28, fast: 32, heavy: 12, stealth: 20, armored: 10, healer: 8, kamikaze: 8, spawnInterval: 360, waveReward: 300 },
        ]
    },
    {
        id: "M5",
        name: "The Void Gate",
        description: "Defend a critical warp gate from a scout leader and their elite guard. First boss encounter!",
        story: "A major enemy scout fleet, led by Commander V'Krell, is attempting to breach the Void Gate – our primary hyperspace lane. If they succeed, our inner systems will be vulnerable. V'Krell is known for his cunning tactics and heavily armored personal escort. Prepare for a fierce engagement!",
        startingCredits: 120,
        startingHealth: 80,
        mapX: 0.7,
        mapY: 0.8,
        prerequisites: ["M4"],
        waves: [
            { basic: 10, fast: 10, heavy: 5, armored: 3, stealth: 2, spawnInterval: 500, waveReward: 120 },
            { basic: 12, fast: 15, heavy: 6, armored: 4, stealth: 3, healer: 1, spawnInterval: 480, waveReward: 140 },
            { basic: 15, fast: 18, heavy: 7, armored: 5, stealth: 4, healer: 2, kamikaze: 2, spawnInterval: 460, waveReward: 160 },
            { basic: 18, fast: 20, heavy: 8, armored: 6, stealth: 5, healer: 3, kamikaze: 3, spawnInterval: 440, waveReward: 180 },
            { basic: 20, fast: 22, heavy: 9, armored: 7, stealth: 6, healer: 4, kamikaze: 4, spawnInterval: 420, waveReward: 200 },
            { basic: 22, fast: 25, heavy: 10, armored: 8, stealth: 7, healer: 5, kamikaze: 5, spawnInterval: 400, waveReward: 220 },
            { basic: 25, fast: 28, heavy: 11, armored: 9, stealth: 8, healer: 6, kamikaze: 6, spawnInterval: 380, waveReward: 240 },
            { basic: 28, fast: 30, heavy: 12, armored: 10, stealth: 9, healer: 7, kamikaze: 7, spawnInterval: 360, waveReward: 260 },
            { basic: 30, fast: 32, heavy: 13, armored: 11, stealth: 10, healer: 8, kamikaze: 8, spawnInterval: 340, waveReward: 300 },
            { basic: 0, fast: 0, heavy: 0, armored: 5, boss: 1, healer: 2, kamikaze: 3, stealth: 5, spawnInterval: 200, waveReward: 500 }, // Boss wave
        ]
    },
    {
        id: "M6",
        name: "Crimson Sector",
        description: "A heavily contested zone. Expect relentless waves and highly aggressive enemy compositions.",
        story: "Following the defeat of V'Krell, the enemy has redoubled their efforts in the Crimson Sector, a strategic mining hub. They are throwing everything they have at us, including new, highly aggressive formations. Hold the line, Commander!",
        startingCredits: 100,
        startingHealth: 70,
        mapX: 0.45,
        mapY: 0.1,
        prerequisites: ["M5"],
        waves: [
            { basic: 15, fast: 20, heavy: 8, armored: 5, kamikaze: 5, spawnInterval: 400, waveReward: 150 },
            { basic: 18, fast: 22, heavy: 9, armored: 6, kamikaze: 6, healer: 2, spawnInterval: 380, waveReward: 170 },
            { basic: 20, fast: 25, heavy: 10, armored: 7, kamikaze: 7, healer: 3, stealth: 3, spawnInterval: 360, waveReward: 190 },
            { basic: 22, fast: 28, heavy: 11, armored: 8, kamikaze: 8, healer: 4, stealth: 4, spawnInterval: 340, waveReward: 210 },
            { basic: 25, fast: 30, heavy: 12, armored: 9, kamikaze: 9, healer: 5, stealth: 5, spawnInterval: 320, waveReward: 230 },
            { basic: 28, 	fast: 32, heavy: 13, armored: 10, kamikaze: 10, healer: 6, stealth: 6, spawnInterval: 300, waveReward: 250 },
            { basic: 30, fast: 35, heavy: 14, armored: 11, kamikaze: 11, healer: 7, stealth: 7, spawnInterval: 280, waveReward: 270 },
            { basic: 32, fast: 38, heavy: 15, armored: 12, kamikaze: 12, healer: 8, stealth: 8, spawnInterval: 260, waveReward: 290 },
            { basic: 35, fast: 40, heavy: 16, armored: 13, kamikaze: 13, healer: 9, stealth: 9, spawnInterval: 240, waveReward: 320 },
            { basic: 40, fast: 45, heavy: 18, armored: 15, kamikaze: 15, healer: 10, stealth: 10, spawnInterval: 220, waveReward: 400 },
        ]
    },
    {
        id: "M7",
        name: "Ice Giant's Shadow",
        description: "Extreme cold and icy terrain favor heavily armored units. Prepare for slow but resilient assaults.",
        story: "The enemy has established a foothold on the desolate ice giant, Kael'Thas. The extreme cold makes their armored units even more formidable. Your cryo-blasters will be essential here, Commander. Break their icy grip!",
        startingCredits: 90,
        startingHealth: 60,
        mapX: 0.2,
        mapY: 0.15,
        prerequisites: ["M6"],
        waves: [
            { basic: 10, heavy: 10, armored: 8, freeze: 0, spawnInterval: 450, waveReward: 180 },
            { basic: 12, heavy: 12, armored: 10, fast: 5, spawnInterval: 420, waveReward: 200 },
            { basic: 15, heavy: 14, armored: 12, fast: 8, healer: 3, spawnInterval: 400, waveReward: 220 },
            { basic: 18, heavy: 16, armored: 14, fast: 10, healer: 4, kamikaze: 5, spawnInterval: 380, waveReward: 240 },
            { basic: 20, heavy: 18, armored: 16, fast: 12, healer: 5, kamikaze: 6, stealth: 5, spawnInterval: 360, waveReward: 260 },
            { basic: 22, heavy: 20, armored: 18, fast: 15, healer: 6, kamikaze: 7, stealth: 6, spawnInterval: 340, waveReward: 280 },
            { basic: 25, heavy: 22, armored: 20, fast: 18, healer: 7, kamikaze: 8, stealth: 7, spawnInterval: 320, waveReward: 300 },
            { basic: 28, heavy: 24, armored: 22, fast: 20, healer: 8, kamikaze: 9, stealth: 8, spawnInterval: 300, waveReward: 320 },
            { basic: 30, heavy: 26, armored: 24, fast: 22, healer: 9, kamikaze: 10, stealth: 9, spawnInterval: 280, waveReward: 350 },
            { basic: 35, heavy: 30, armored: 28, fast: 25, healer: 10, kamikaze: 12, stealth: 10, spawnInterval: 260, waveReward: 450 },
        ]
    },
    {
        id: "M8",
        name: "The Hive Core",
        description: "Infiltrate a massive alien hive. Expect swarms of enemies and a powerful new enemy type: The Queen's Guard.",
        story: "Intelligence has pinpointed the source of the recent, highly organized attacks: a colossal alien hive hidden deep within the sector. We believe a new, highly resilient form of enemy, the 'Queen's Guard', is emerging. Your mission is to penetrate the hive and eliminate the threat at its core. This will be a brutal fight, Commander. Expect the unexpected.",
        startingCredits: 80,
        startingHealth: 50,
        mapX: 0.1,
        mapY: 0.8,
        prerequisites: ["M7"],
        waves: [
            { basic: 20, fast: 15, heavy: 10, armored: 5, healer: 3, spawnInterval: 350, waveReward: 200 },
            { basic: 25, fast: 20, heavy: 12, armored: 6, healer: 4, kamikaze: 5, spawnInterval: 330, waveReward: 220 },
            { basic: 30, fast: 25, heavy: 14, armored: 7, healer: 5, kamikaze: 6, stealth: 5, spawnInterval: 310, waveReward: 240 },
            { basic: 35, fast: 30, heavy: 16, armored: 8, healer: 6, kamikaze: 7, stealth: 6, spawnInterval: 290, waveReward: 260 },
            { basic: 40, fast: 35, heavy: 18, armored: 9, healer: 7, kamikaze: 8, stealth: 7, spawnInterval: 270, waveReward: 280 },
            { basic: 45, fast: 40, heavy: 20, armored: 10, healer: 8, kamikaze: 9, stealth: 8, spawnInterval: 250, waveReward: 300 },
            { basic: 50, fast: 45, heavy: 22, armored: 11, healer: 9, kamikaze: 10, stealth: 9, spawnInterval: 230, waveReward: 320 },
            { basic: 55, fast: 50, heavy: 24, armored: 12, healer: 10, kamikaze: 11, stealth: 10, spawnInterval: 210, waveReward: 350 },
            { basic: 60, fast: 55, heavy: 26, armored: 13, healer: 11, kamikaze: 12, stealth: 11, spawnInterval: 190, waveReward: 380 },
            { basic: 0, fast: 0, heavy: 0, boss: 1, armored: 15, healer: 10, kamikaze: 10, stealth: 10, spawnInterval: 150, waveReward: 800 }, // Queen's Guard Boss
        ]
    },
    {
        id: "M9",
        name: "Galactic Crossroads",
        description: "A vital strategic choke point. All enemy types will converge here in massive numbers.",
        story: "The enemy is making a desperate push towards the core worlds, and the Galactic Crossroads is their only viable path. Every known alien unit type will be thrown at your defenses. This is a critical junction, Commander. Do not let them pass!",
        startingCredits: 70,
        startingHealth: 40,
        mapX: 0.3,
        mapY: 0.9,
        prerequisites: ["M8"],
        waves: [
            { basic: 30, fast: 30, heavy: 15, armored: 10, healer: 5, kamikaze: 5, stealth: 5, spawnInterval: 300, waveReward: 250 },
            { basic: 35, fast: 35, heavy: 18, armored: 12, healer: 6, kamikaze: 6, stealth: 6, spawnInterval: 280, waveReward: 280 },
            { basic: 40, fast: 40, heavy: 20, armored: 14, healer: 7, kamikaze: 7, stealth: 7, spawnInterval: 260, waveReward: 310 },
            { basic: 45, fast: 45, heavy: 22, armored: 16, healer: 8, kamikaze: 8, stealth: 8, spawnInterval: 240, waveReward: 340 },
            { basic: 50, fast: 50, heavy: 24, armored: 18, healer: 9, kamikaze: 9, stealth: 9, spawnInterval: 220, waveReward: 370 },
            { basic: 55, fast: 55, heavy: 26, armored: 20, healer: 10, kamikaze: 10, stealth: 10, spawnInterval: 200, waveReward: 400 },
            { basic: 60, fast: 60, heavy: 28, armored: 22, healer: 11, kamikaze: 11, stealth: 11, spawnInterval: 180, waveReward: 430 },
            { basic: 65, fast: 65, heavy: 30, armored: 24, healer: 12, kamikaze: 12, stealth: 12, spawnInterval: 160, waveReward: 460 },
            { basic: 70, fast: 70, heavy: 32, armored: 26, healer: 13, kamikaze: 13, stealth: 13, spawnInterval: 140, waveReward: 500 },
            { basic: 80, fast: 80, heavy: 35, armored: 30, healer: 15, kamikaze: 15, stealth: 15, spawnInterval: 120, waveReward: 700 }, // Intense final wave
        ]
    },
    {
        id: "M10",
        name: "Homeworld Defense",
        description: "The final stand. Defend humanity's homeworld against the Alien Overlord and their ultimate invasion force.",
        story: "They've reached us, Commander. The Alien Overlord, architect of this invasion, leads the final assault on our homeworld. This is it. The fate of humanity rests on your shoulders. Deploy every resource, every tactic. Defend our home, or all is lost!",
        startingCredits: 50,
        startingHealth: 30,
        mapX: 0.5,
        mapY: 0.95,
        prerequisites: ["M9"],
        waves: [
            { basic: 40, fast: 40, heavy: 20, armored: 15, healer: 10, kamikaze: 10, stealth: 10, spawnInterval: 200, waveReward: 300 },
            { basic: 45, fast: 45, heavy: 22, armored: 16, healer: 11, kamikaze: 11, stealth: 11, spawnInterval: 190, waveReward: 330 },
            { basic: 50, fast: 50, heavy: 24, armored: 18, healer: 12, kamikaze: 12, stealth: 12, spawnInterval: 180, waveReward: 360 },
            { basic: 55, fast: 55, heavy: 26, armored: 20, healer: 13, kamikaze: 13, stealth: 13, spawnInterval: 170, waveReward: 390 },
            { basic: 60, fast: 60, heavy: 28, armored: 22, healer: 14, kamikaze: 14, stealth: 14, spawnInterval: 160, waveReward: 420 },
            { basic: 65, fast: 65, heavy: 30, armored: 24, healer: 15, kamikaze: 15, stealth: 15, spawnInterval: 150, waveReward: 450 },
            { basic: 70, fast: 70, heavy: 32, armored: 26, healer: 16, kamikaze: 16, stealth: 16, spawnInterval: 140, waveReward: 480 },
            { basic: 75, fast: 75, heavy: 34, armored: 28, healer: 17, kamikaze: 17, stealth: 17, spawnInterval: 130, waveReward: 510 },
            { basic: 80, fast: 80, heavy: 36, armored: 30, healer: 18, kamikaze: 18, stealth: 18, spawnInterval: 120, waveReward: 550 },
            { basic: 0, fast: 0, heavy: 0, boss: 3, armored: 30, healer: 20, kamikaze: 20, stealth: 20, spawnInterval: 100, waveReward: 1500 }, // Final Bosses
        ]
    },
];

const canvas = document.getElementById('gameCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;

const healthEl = document.getElementById('health');
const creditsEl = document.getElementById('credits');
const waveEl = document.getElementById('wave');
const finalWaveDisplayEl = document.getElementById('finalWaveDisplay');
const waveTimerEl = document.getElementById('waveTimer');
const nextWaveBtn = document.getElementById('nextWaveBtn');
const statusMessageEl = document.getElementById('statusMessage');
const currentMissionNameEl = document.getElementById('currentMissionName');

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

let animationFrameId = null; // For game loop
let mapAnimationFrameId = null; // For mission map animation loop

let sounds = {};
let music = null; // Variable to hold the background music

const missionSelectOverlay = document.getElementById('missionSelectOverlay');
const missionMapCanvas = document.getElementById('missionMapCanvas');
const missionMapCtx = missionMapCanvas ? missionMapCanvas.getContext('2d') : null;
const missionDetailsPanel = document.getElementById('missionDetailsPanel');
const missionDetailsNameEl = document.getElementById('missionDetailsName');
const missionDetailsDescriptionEl = document.getElementById('missionDetailsDescription');
const missionDetailsStoryEl = document.getElementById('missionDetailsStory');
const missionDetailsStartBtn = document.getElementById('missionDetailsStartBtn');
const settingsOverlay = document.getElementById('settingsOverlay');
const settingsContentEl = document.getElementById('settingsContent');