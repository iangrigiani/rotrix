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
        const highscores = this.getHighscores();
        if (highscores.length < this.MAX_HIGHSCORES) {
            return true;
        }
        // Check if score is higher than the lowest highscore
        const lowestScore = highscores[highscores.length - 1].score;
        return score > lowestScore;
    }

    /**
     * Add a new highscore
     * @param {string} name Player name
     * @param {number} score Final score
     * @param {number} level Final level
     * @returns {boolean} True if added successfully
     */
    static addHighscore(name, score, level) {
        if (!name || name.trim().length === 0) {
            return false;
        }
        
        // Trim and limit name length
        name = name.trim().substring(0, this.MAX_NAME_LENGTH);
        
        const highscores = this.getHighscores();
        const newHighscore = {
            name: name,
            score: score,
            level: level,
            date: Date.now()
        };
        
        // Add to array and sort by score (descending)
        highscores.push(newHighscore);
        highscores.sort((a, b) => b.score - a.score);
        
        // Keep only top 5
        const topHighscores = highscores.slice(0, this.MAX_HIGHSCORES);
        
        this.saveHighscores(topHighscores);
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


