(function() {
    'use strict';

    angular.module('main').factory('ItemStatParser', Model);
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
         * Provides a stat parser for the given item.
         * @constructor
         * @param {Object} item The item.
         * @param {Object} equippable The raw data from the Bungie response.
         */
        function ItemStatParser(item, equippable) {
            this.item = item;
            this.rawData = equippable.items[0];
        }

        /**
         * Static method for assigning all stats to a given item.
         * @param {Object} item The item.
         * @param {Object} equippable The raw item as provided by Bungie.
         */
        ItemStatParser.setStats = function(item, equippable) {
            var parser = new ItemStatParser(item, equippable);
            for (var statHash in DEFINITIONS.stat) {
                item[DEFINITIONS.stat[statHash]] = parser.getStatRange(statHash);
            }
        };

        /**
         * Gets the stat range for the given stat hash.
         * @param {Number} statHash The stat hash.
         * @returns {Object|null} The range of stats.
         */
        ItemStatParser.prototype.getStatRange = function(statHash) {
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
        ItemStatParser.prototype.getBaseStatRange = function(statHash) {
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
        ItemStatParser.prototype.assignStatBonuses = function(statHash, range, talentGrid) {
            this.rawData.nodes.forEach(function(node, i) {
                if (talentGrid.nodes[i].steps[node.stepIndex].nodeStepHash === STAT_BONUS_MAP[statHash]) {
                    var bonus = this.getStatBonus();
                    if (node.isActivated) {
                        range.min -= bonus;
                    } else {
                        range.max += bonus;
                    }
                }
            }, this);
        };

        /**
         * Gets the stat bonus, based on the item bucket type, and the light level (primary stat).
         * @author /u/iihavetoes (for the bonuses at each level)
         * @author /u/tehdaw (for the spreadsheet with bonuses, https://docs.google.com/spreadsheets/d/1YyFDoHtaiOOeFoqc5Wc_WC2_qyQhBlZckQx5Jd4bJXI/edit?pref=2&pli=1#gid=0)
         * @author DestinyItemManager team (for the implementation)
         * @returns {Number} The stat bonus.
         */
        ItemStatParser.prototype.getStatBonus = function() {
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

            console.warn('item bonus not found', type);
            return 0;
        };

        return ItemStatParser;
    };
})();
