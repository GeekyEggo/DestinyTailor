(function() {
    'use strict';

    angular.module('main').factory('Item', Model);
    Model.$inject = ['Range'];

    /**
     * Defines the Item model.
     * @param {Function} Range The constructor for a range.
     * @returns {Function} The constructor for an item.
     */
    function Model(Range) {
        /**
         * Provides a constructor for the Item model.
         * @constructor
         * @param {Object} data The data of the item.
         * @param {Object} definitions The supporting definitions.
         */
        function Item(data) {
            var itemDefinition = DestinyArmorDefinition.hasOwnProperty(data.itemHash) ? DestinyArmorDefinition[data.itemHash] : {};

            this.itemId = data.itemId;
            this.name = itemDefinition.itemName;
            this.bucketHash = data.bucketHash;
            this.itemTypeName = itemDefinition.itemTypeName;

            this.icon = itemDefinition.icon;
            this.setPrimaryStat(data, DestinyStatDefinition);
            this.tierType = itemDefinition.tierType;
            this.tierTypeName = itemDefinition.tierTypeName;

            this.discipline = new Range(0, 0, 0);
            this.intellect = new Range(0, 0, 0);
            this.strength = new Range(0, 0, 0);
        }

        /**
         * Sets the primary stat on the item.
         * @param {Object} data The data of the object.
         * @param {Object} definitions The definitions for the item.
         */
        Item.prototype.setPrimaryStat = function(data, definitions) {
            if (data.primaryStat === undefined) {
                this.primaryStat = 0;
                this.primaryStatName = '';
            } else {
                this.primaryStat = data.primaryStat.value;
                this.primaryStatName = definitions[data.primaryStat.statHash].statName;
            }
        };

        return Item;
    }
})();
