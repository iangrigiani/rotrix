/**
 * Simple highscore manager using localStorage
 */
export class HighscoreManager {
    static STORAGE_KEY = 'rotrix_highscores';
    static MAX_HIGHSCORES = 5;
    static MAX_NAME_LENGTH = 20;

    /**
     * Get all highscores
     * @returns {Array} Array of {name: string, score: number, level: number, date: number}
     */
    static getHighscores() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (e) {
            console.error('Error reading highscores:', e);
        }
        return [];
    }

    /**
     * Save highscores to localStorage
     * @param {Array} highscores Array of highscore objects
     */
    static saveHighscores(highscores) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(highscores));
        } catch (e) {
            console.error('Error saving highscores:', e);
        }
    }

    /**
     * Check if a score qualifies for the top 5
     * @param {number} score The score to check
     * @returns {boolean} True if score qualifies
     */
    static qualifiesForHighscore(score) {
        // Ensure score is a number
        score = Number(score);
        if (isNaN(score)) {
            console.error('Invalid score provided to qualifiesForHighscore:', score);
            return false;
        }
        
        const highscores = this.getHighscores();
        if (highscores.length < this.MAX_HIGHSCORES) {
            return true;
        }
        
        // Ensure scores are sorted (they should be, but just in case)
        const sortedHighscores = [...highscores].sort((a, b) => {
            const scoreA = Number(a.score) || 0;
            const scoreB = Number(b.score) || 0;
            return scoreB - scoreA;
        });
        
        // Check if score is greater than or equal to the lowest highscore
        const lowestScore = Number(sortedHighscores[sortedHighscores.length - 1].score) || 0;
        const qualifies = score >= lowestScore;
        
        console.log('[HighscoreManager] Qualification check:', {
            newScore: score,
            lowestScore: lowestScore,
            qualifies: qualifies,
            currentHighscores: sortedHighscores.map(hs => ({ name: hs.name, score: Number(hs.score) || 0 }))
        });
        
        return qualifies;
    }

    /**
     * Add a new highscore
     * @param {string} name Player name
     * @param {number} score Final score
     * @param {number} level Final level
     * @param {number} lines Total lines cleared
     * @returns {boolean} True if added successfully
     */
    static addHighscore(name, score, level, lines = 0) {
        if (!name || name.trim().length === 0) {
            console.error('[HighscoreManager] Invalid name provided');
            return false;
        }
        
        // Ensure score, level, and lines are numbers
        score = Number(score) || 0;
        level = Number(level) || 1;
        lines = Number(lines) || 0;
        
        if (score <= 0) {
            console.error('[HighscoreManager] Invalid score:', score);
            return false;
        }
        
        // Trim and limit name length
        name = name.trim().substring(0, this.MAX_NAME_LENGTH);
        
        const highscores = this.getHighscores();
        const newHighscore = {
            name: name,
            score: score,
            level: level,
            lines: lines,
            date: Date.now()
        };
        
        console.log('[HighscoreManager] Adding highscore:', newHighscore);
        
        // Add to array and sort by score (descending), ensuring scores are numbers
        highscores.push(newHighscore);
        highscores.sort((a, b) => {
            const scoreA = Number(a.score) || 0;
            const scoreB = Number(b.score) || 0;
            return scoreB - scoreA;
        });
        
        // Keep only top 5
        const topHighscores = highscores.slice(0, this.MAX_HIGHSCORES);
        
        console.log('[HighscoreManager] Saving highscores:', topHighscores);
        this.saveHighscores(topHighscores);
        
        // Verify it was saved
        const saved = this.getHighscores();
        const wasSaved = saved.some(hs => hs.name === name && Number(hs.score) === score);
        if (!wasSaved) {
            console.error('[HighscoreManager] Failed to save highscore!');
        } else {
            console.log('[HighscoreManager] Highscore saved successfully');
        }
        
        return true;
    }

    /**
     * Get the rank of a score (1-5, or null if not in top 5)
     * @param {number} score The score to check
     * @returns {number|null} Rank (1-5) or null
     */
    static getRank(score) {
        const highscores = this.getHighscores();
        for (let i = 0; i < highscores.length; i++) {
            if (score >= highscores[i].score) {
                return i + 1;
            }
        }
        if (highscores.length < this.MAX_HIGHSCORES) {
            return highscores.length + 1;
        }
        return null;
    }
}



