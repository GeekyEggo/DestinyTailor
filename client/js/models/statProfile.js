(function(app) {
    'use strict';

    /**
     * Defines the stat profile model.
     * @param {Object} ITEM_BUCKET_HASHES Key-value-pair of bucket hashes and user friendly identifiers.
     * @param {String[]} STAT_NAMES The constant stat names.
     * @param {Object} Stat The stat model constructor.
     */
    function StatProfile(ITEM_BUCKET_HASHES, STAT_NAMES, Stat) {
        /**
         * Provides a stat profile for a given path.
         * @constructor
         */
        function Model() {
            // main stats
            this.discipline = new Stat();
            this.intellect = new Stat();
            this.strength = new Stat();
            this.tierCount = 0;

            // inventory setup
            this.inventory = {};
            this.items = [];
        }

        /**
         * Adds the item to the profile, using the selected stat name as the max value.
         * @param {Object} item The item being added.
         * @param {String} selectedStatName The stat being selected as the max.
         * @returns {Object} The modified stat profile.
         */
        Model.prototype.add = function(item, selectedStatName) {
            var option = {};

            // set the name and maximum
            option.name = item.name;
            option[selectedStatName] = item[selectedStatName].max;
            this[selectedStatName].value += item[selectedStatName].max;

            // set the reamining stats
            for (var i = 0; i < STAT_NAMES.length; i++) {
                var statName = STAT_NAMES[i];
                if (item[statName] && statName !== selectedStatName) {
                    option[statName] = item[statName].min;
                    this[statName].value += item[statName].min;
                }
            }

            this.items.push(option);
            this.inventory[ITEM_BUCKET_HASHES[item.bucketHash]] = option;
            return this;
        };

        /**
         * Calculates the stat tiers.
         */
        Model.prototype.calculateTiers = function() {
            this.discipline.calculateTier();
            this.intellect.calculateTier();
            this.strength.calculateTier();

            this.tierCount = this.discipline.tier + this.intellect.tier + this.strength.tier;
        };

        /**
         * Determines if the stat profile is equal to the other stat profile, based on the tiers.
         * @param {Object} other The stat profile to compare.
         * @returns {Boolean} True when the stat profiles are considered equal.
         */
        Model.prototype.isEqual = function(other) {
            return this.discipline.tier === other.discipline.tier
                && this.intellect.tier === other.intellect.tier
                && this.strength.tier === other.strength.tier;
        };

        return Model;
    };

    StatProfile.$inject = ['ITEM_BUCKET_HASHES', 'STAT_NAMES', 'Stat'];
    app.factory('StatProfile', StatProfile);
})(angular.module('main'));
