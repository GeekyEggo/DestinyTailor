(function() {
    'use strict';

    angular.module('main').factory('Item', Model);
    Model.$inject = ['BUNGIE_DEFINITIONS'];

    /**
     * Defines the Item model.
     * @param {Object} BUNGIE_DEFINITIONS The definitions from the Bungie manifest.
     * @returns {Function} The constructor for an item.
     */
    function Model(BUNGIE_DEFINITIONS) {
        /**
         * Provides a constructor for the Item model.
         * @constructor
         * @param {Object} equippable The data of the item.
         */
        function Item(equippable) {
            var item = equippable.items[0];

            // ensure the item isn't classified
            if (item !== undefined) {
                var itemDefinition = BUNGIE_DEFINITIONS.ARMOR.hasOwnProperty(item.itemHash) ? BUNGIE_DEFINITIONS.ARMOR[item.itemHash] : {};

                this.itemId = item.itemInstanceId;
                this.name = itemDefinition.itemName;
                this.itemTypeName = itemDefinition.itemTypeName;

                this.icon = itemDefinition.icon;
                this.setPrimaryStat(item);
                this.tierType = itemDefinition.tierType;
                this.tierTypeName = itemDefinition.tierTypeName;

                this.isClassified = false;
            } else {
                this.isClassified = true;
            }

            this.bucketHash = equippable.bucketHash;
        }

        /**
         * Sets the primary stat on the item.
         * @param {Object} item The data of the equippable item.
         */
        Item.prototype.setPrimaryStat = function(item) {
            if (item.primaryStat === undefined) {
                this.primaryStat = 0;
                this.primaryStatName = '';
            } else {
                this.primaryStat = item.primaryStat.value;
                this.primaryStatName = BUNGIE_DEFINITIONS.STATS[item.primaryStat.statHash].statName;
            }
        };

        return Item;
    }
})();
