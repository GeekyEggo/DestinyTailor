(function() {
    'use strict';

    angular.module('main').factory('Inventory', Model);
    Model.$inject = ['DEFINITIONS'];

    /**
     * Creates the constructor for the inventory model.
     * @param {Object} DEFINITIONS The constant definitions.
     * @returns {Function} The inventory constructor.
     */
    function Model(DEFINITIONS) {
        /**
         * Constructs a new inventory object used to store items owned by a character.
         * @constructor
         */
        function Inventory() {
            // weapons
            this.primaryWeapon = null;
            this.specialWeapon = null;
            this.heavyWeapon = null;

            // main
            this.ghost = null;
            this.helmet = null;
            this.gauntlets = null;
            this.chest = null;
            this.legs = null;

            // sub
            this.artifact = null;
            this.classItem = null;
        }

        /**
         * Sets the item based on it's bucket hash.
         * @param {Object} equippable The equippable item to set.
         * @returns {Boolean} True when the item was assigned to an inventory slot; otherwise false.
         */
        Inventory.prototype.setItem = function(equippable) {
            // set the item when we recognise the bucket hash)
            if (DEFINITIONS.itemBucketHash.hasOwnProperty(equippable.bucketHash)) {
                this[DEFINITIONS.itemBucketHash[equippable.bucketHash]] = equippable;
                return true;
            };

            return false;
        };

        return Inventory;
    }
})();
