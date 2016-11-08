(function() {
    'use strict';

    angular.module('main').factory('ItemStatCalculator', Model);
    Model.$inject = ['BUNGIE_DEFINITIONS', 'DEFINITIONS', 'STAT_BONUS_MAP', 'Range'];

    /**
     * Defines the stat profile model.
     * @param {Object} BUNGIE_DEFINITIONS The definitions, as defined by the Bungie manifest.
     * @param {Object} DEFINITIONS A subset of definitions.
     * @param {Object} STAT_BONUS_MAP The hash map between a stat and its bonus perk.
     * @param {Object} Range The range class.
     */
    function Model(BUNGIE_DEFINITIONS, DEFINITIONS, STAT_BONUS_MAP, Range) {
        /**
         * Provides a stat calculator for the given item.
         * @constructor
         * @param {Object} item The item.
         * @param {Object} equippable The raw data from the Bungie response.
         */
        function ItemStatCalculator(item, equippable) {
            this.item = item;
            this.rawData = equippable.items[0];
        }

        /**
         * Sets the stats on the item.
         * @returns {Object} This stat calculator.
         */
        ItemStatCalculator.prototype.setStats = function() {
            // set the stats 
            for (var statHash in DEFINITIONS.stat) {
                this.item[DEFINITIONS.stat[statHash]] = this.getStatRange(statHash);
            }

            return this;
        }

        /**
         * Gets the stat range for the given stat hash.
         * @param {Number} statHash The stat hash.
         * @returns {Object|null} The range of stats.
         */
        ItemStatCalculator.prototype.getStatRange = function(statHash) {
            // get the stat range, and return nothing when we have nothing
            var range = this.getBaseStatRange(statHash);
            if (!range) {
                return null;
            }

            // ensure we have a talent grid
            var talentGrid = BUNGIE_DEFINITIONS.TALENT_GRID[this.rawData.talentGridHash];
            if (!talentGrid) {
                return null;
            }

            // assign the stat bonus and return the range when it is "valid"
            this.assignStatBonuses(statHash, range, talentGrid);
            return range.min > 0 || range.max > 0 ? range : null;
        };

        /**
         * Gets the base values for the stat.
         * @param {Number} statHash The stat hash.
         * @returns {Object|null} The base values for the stat, represented as a range.
         */
        ItemStatCalculator.prototype.getBaseStatRange = function(statHash) {
            statHash = parseInt(statHash);

            if (this.rawData) {
                // determine the current base stat value
                for (var i = 0; i < this.rawData.stats.length; i++) {
                    if (this.rawData.stats[i].statHash === statHash) {
                        return new Range(this.rawData.stats[i].value, this.rawData.stats[i].value, this.rawData.stats[i].value);
                    }
                }
            }

            return null;
        };

        /**
         * Updates the stat range to differentiate between the bonuses provided.
         * @param {Number} statHash The stat hash.
         * @param {Object} range The current stat range.
         * @param {Object} talentGrid The talent grid containing the perks for the item.
         */
        ItemStatCalculator.prototype.assignStatBonuses = function(statHash, range, talentGrid) {
            var bonus = this.getStatBonus();

            this.rawData.nodes.forEach(function(node, i) {
                if (talentGrid.nodes[i].steps[node.stepIndex].nodeStepHash === STAT_BONUS_MAP[statHash]) {
                    if (node.isActivated) {
                        range.min -= bonus;
                    } else {
                        range.max += bonus;
                    }
                }
            });
        };

        /**
         * Sets the percentage quality for the item associated with the calculator.
         */
        ItemStatCalculator.prototype.setQuality = function() {
            // gets the quality as a percent, based on the value and the maximum
            function getQuality(value, max) {
                var quality = (100 / max) * value;
                return Math.min(100, Math.floor(quality));    
            }

            var scaledStatSum = 0;
            var maxBaseStat = this.getMaxBaseStat();

            // determine the summed value of the stats, scaled to max light
            for (var statHash in DEFINITIONS.stat) {
                var statRange = this.item[DEFINITIONS.stat[statHash]];

                if (statRange) {
                    // get the scaled stat, and add it to the sum
                    var scaledStat = this.getScaledStat(statRange.min);
                    scaledStatSum += scaledStat;

                    // determine the quality of the item, handling pure stat items
                    var maxStatValue = scaledStat <= maxBaseStat ? maxBaseStat : maxBaseStat * 2;
                    statRange.quality = getQuality(scaledStat, maxStatValue);
                }
            }

            // determine the quality, based on the sum of the scaled based stats
            if (scaledStatSum === 0) {
                this.item.quality = 0;
            } else {
                this.item.quality = getQuality(scaledStatSum, maxBaseStat * 2);
            }
        }

        /**
         * Gets the scaled stat values for a base value, and the items current light level.
         * @author /u/cornman0101 (https://www.reddit.com/r/DestinyTheGame/comments/4m417m/final_infusion_stat_calculator_from_200335_light/)
         * @author /u/iihavetoes (https://www.reddit.com/r/DestinyTheGame/comments/4geixn/a_shift_in_how_we_view_stat_infusion_12tier/)
         * @author DestinyItemManager (https://github.com/DestinyItemManager/DIM/blob/092eaf2738ba009e2f68164263a09e4f3fc7a532/app/scripts/services/dimStoreService.factory.js#L1077)
         * @param {Number} statValue The base value of the stat.
         * @returns {Object} The scaled stat.
         */
        ItemStatCalculator.prototype.getScaledStat = function(statValue) {
            // based on /u/cornman0101's findings and calculations (with thanks to DIM)
            var adjustValue = function(lightLevel) {
                if (lightLevel > 300) {
                    return (0.2546 * lightLevel) - 23.825;
                } if (lightLevel > 200) {
                    return (0.1801 * lightLevel) - 1.4612;
                } else {
                    return -1;
                }
            }
            
            // calculate based on a maximum of 335, regardless of higher
            var maxLightLevel = 335;
            var itemLightLevel = Math.min(maxLightLevel, this.item.primaryStat);

            return Math.floor((statValue) * (adjustValue(maxLightLevel) / adjustValue(itemLightLevel)));
        }

        /**
         * Gets the base maximum [split] stat value, for the current item, based on the items type.
         * @author DIM (https://github.com/DestinyItemManager/DIM/blob/092eaf2738ba009e2f68164263a09e4f3fc7a532/app/scripts/services/dimStoreService.factory.js#L1115)
         * @returns {Number} The base stats. 
         */
        ItemStatCalculator.prototype.getMaxBaseStat = function() {
            switch (DEFINITIONS.itemBucketHash[this.item.bucketHash]) {
                case 'helmet':
                    return 46; // bungie reports 48, but i've only seen 46 (DIM)

                case 'gauntlets':
                    return 41; // bungie reports 43, but i've only seen 41 (DIM)

                case 'chest':
                    return 61;

                case 'legs':
                    return 56;

                case 'classItem':
                case 'ghost':
                    return 25;

                case 'artifact':
                    return 38;
            }

            return null;
        };

        /**
         * Gets the stat bonus, based on the item bucket type, and the light level (primary stat).
         * @author /u/iihavetoes (for the bonuses at each level)
         * @author /u/tehdaw (for the spreadsheet with bonuses, https://docs.google.com/spreadsheets/d/1YyFDoHtaiOOeFoqc5Wc_WC2_qyQhBlZckQx5Jd4bJXI/edit?pref=2&pli=1#gid=0)
         * @author DestinyItemManager team (for the implementation)
         * @returns {Number} The stat bonus.
         */
        ItemStatCalculator.prototype.getStatBonus = function() {
            switch (DEFINITIONS.itemBucketHash[this.item.bucketHash]) {
                case 'helmet':
                    return this.item.primaryStat < 292 ? 15
                        : this.item.primaryStat < 307 ? 16
                        : this.item.primaryStat < 319 ? 17
                        : this.item.primaryStat < 332 ? 18
                        : 19;

                case 'gauntlets':
                    return this.item.primaryStat < 287 ? 13
                        : this.item.primaryStat < 305 ? 14
                        : this.item.primaryStat < 319 ? 15
                        : this.item.primaryStat < 333 ? 16
                        : 17;

                case 'chest':
                    return this.item.primaryStat < 287 ? 20
                        : this.item.primaryStat < 300 ? 21
                        : this.item.primaryStat < 310 ? 22
                        : this.item.primaryStat < 319 ? 23
                        : this.item.primaryStat < 328 ? 24
                        : 25;

                case 'legs':
                    return this.item.primaryStat < 284 ? 18
                        : this.item.primaryStat < 298 ? 19
                        : this.item.primaryStat < 309 ? 20
                        : this.item.primaryStat < 319 ? 21
                        : this.item.primaryStat < 329 ? 22
                        : 23;

                case 'classItem':
                case 'ghost':
                    return this.item.primaryStat < 295 ? 8
                        : this.item.primaryStat < 319 ? 9
                        : 10;

                case 'artifact':
                    return this.item.primaryStat < 287 ? 34
                        : this.item.primaryStat < 295 ? 35
                        : this.item.primaryStat < 302 ? 36
                        : this.item.primaryStat < 308 ? 37
                        : this.item.primaryStat < 314 ? 38
                        : this.item.primaryStat < 319 ? 39
                        : this.item.primaryStat < 325 ? 40
                        : this.item.primaryStat < 330 ? 41
                        : 42;
            }

            return 0;
        };

        return ItemStatCalculator;
    };
})();
