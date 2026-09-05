window.musicalloLevels = (() => {
    const thresholds = {
        base: 150,
        increases: [
            { min: 11, max: 20, add: 5 }, { min: 21, max: 30, add: 10 }, { min: 31, max: 40, add: 15 },
            { min: 41, max: 50, add: 20 }, { min: 51, max: 60, add: 25 }, { min: 61, max: 70, add: 30 },
            { min: 71, max: 80, add: 35 }, { min: 81, max: 90, add: 40 }, { min: 91, max: 100, add: 45 },
            { min: 101, max: 110, add: 50 }, { min: 111, max: 120, add: 55 }, { min: 121, max: 130, add: 60 },
            { min: 131, max: 140, add: 65 }, { min: 141, max: 150, add: 70 }
        ],
        colors: [
            { min: 1, max: 10, color: '#a0c4ff' }, { min: 11, max: 20, color: '#4a90e2' },
            { min: 21, max: 30, color: '#9b59b6' }, { min: 31, max: 40, color: '#e91e8c' },
            { min: 41, max: 50, color: '#e74c3c' }, { min: 51, max: 60, color: '#f1c40f' },
            { min: 61, max: 70, color: '#2ecc71' }, { min: 71, max: 80, color: '#00e5ff' },
            { min: 81, max: 150, color: '#ff6600' }
        ]
    };

    function getThresholdForLevel(level) {
        if (level <= 10) return thresholds.base;
        for (const increase of thresholds.increases) {
            if (level >= increase.min && level <= increase.max) return thresholds.base + increase.add;
        }
        return thresholds.base + thresholds.increases[thresholds.increases.length - 1].add;
    }

    function getColorForLevel(level) {
        return thresholds.colors.find(range => level >= range.min && level <= range.max)?.color || '#ffffff';
    }

    function getLevelInfo(score) {
        let level = 1;
        let currentLevelScore = 0;
        let nextLevelScore = 150;
        while (score >= nextLevelScore && level < 150) {
            level++;
            currentLevelScore = nextLevelScore;
            nextLevelScore += getThresholdForLevel(level);
        }
        const currentLevelThreshold = getThresholdForLevel(level);
        const progressInLevel = score - currentLevelScore;
        return {
            level,
            progressPercent: Math.min(100, (progressInLevel / currentLevelThreshold) * 100),
            scoreToNext: currentLevelThreshold - progressInLevel,
            color: getColorForLevel(level)
        };
    }

    function isSpecialLevel(level) {
        return level >= 71 && level <= 80;
    }

    return { getLevelInfo, getColorForLevel, isSpecialLevel };
})();
