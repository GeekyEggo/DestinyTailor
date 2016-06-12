(function() {
    'use strict';

    angular.module('main').factory('Item', Model);
    Model.$inject = ['BUNGIE_DEFINITIONS', 'Range'];

    /**
     * Defines the Item model.
     * @param {Object} BUNGIE_DEFINITIONS The definitions from the Bungie manifest.
     * @param {Function} Range The constructor for a range.
     * @returns {Function} The constructor for an item.
     */
    function Model(BUNGIE_DEFINITIONS, Range) {
        /**
         * Provides a constructor for the Item model.
         * @constructor
         * @param {Object} data The data of the item.
         */
        function Item(data) {
            var itemDefinition = BUNGIE_DEFINITIONS.ARMOR.hasOwnProperty(data.itemHash) ? BUNGIE_DEFINITIONS.ARMOR[data.itemHash] : {};

            this.itemId = data.itemId;
            this.name = itemDefinition.itemName;
            this.bucketHash = data.bucketHash;
            this.itemTypeName = itemDefinition.itemTypeName;

            this.icon = itemDefinition.icon;
            this.setPrimaryStat(data);
            this.tierType = itemDefinition.tierType;
            this.tierTypeName = itemDefinition.tierTypeName;

            this.discipline = new Range(0, 0, 0);
            this.intellect = new Range(0, 0, 0);
            this.strength = new Range(0, 0, 0);
        }

        /**
         * Sets the primary stat on the item.
         * @param {Object} data The data of the object.
         */
        Item.prototype.setPrimaryStat = function(data) {
            if (data.primaryStat === undefined) {
                this.primaryStat = 0;
                this.primaryStatName = '';
            } else {
                this.primaryStat = data.primaryStat.value;
                this.primaryStatName = BUNGIE_DEFINITIONS.STATS[data.primaryStat.statHash].statName;
            }
        };

        return Item;
    }
})();
