(function() {
    'use strict';

    angular.module('main').factory('inventoryService', inventoryService);
    inventoryService.$inject = ['$q', 'Inventory', 'InventoryAnalysis', 'Item', 'ItemStatParser', 'bungieService'];

    /**
     * Defines the inventory analyser service.
     * @param {Object} $q The promises helper from Angular.
     * @param {Function} Inventory The inventory model constructor.
     * @param {Function} InventoryAnalysis The constructor for an inventory analysis.
     * @param {Function} Item The item constructor.
     * @param {Function} ItemStatParser The item stat parser class.
     * @param {Object} bungieService The Bungie service.
     * @returns {Object} The inventory service.
     */
    function inventoryService($q, Inventory, InventoryAnalysis, Item, ItemStatParser, bungieService) {
        return {
            // functions
            getInventory: getInventory,
            getStatProfiles: getStatProfiles
        };

        /**
         * Loads the inventory for the given character.
         * @param {Object} character The character.
         * @returns {Object} A promise of the inventory, that is fulfilled when the inventory has been loaded.
         */
        function getInventory(character) {
            return bungieService.getInventorySummary(character.membershipType, character.membershipId, character.characterId)
                .then(bungieService.throwErrors)
                .then(createInventory);
        }

        /**
         * Create a new inventory object based on the inventory summary.
         * @param {Object} result The result of the inventory summary request.
         * @returns {Object} The inventory with the basic information.
         */
        function createInventory(result) {
            var inventory = new Inventory();

            // add each item, once we've transformed it slightly
            result.data.Response.data.buckets.Equippable.forEach(function(equippable) {
                var item = new Item(equippable);
                if (inventory.setItem(item)) {
                    ItemStatParser.setStats(item, equippable);
                }
            });

            return inventory;
        }

        /**
         * Gets the unique stat profiles for the given character.
         * @param {Object} character The character to analyse.
         */
        function getStatProfiles(character) {
            var analysis = new InventoryAnalysis(character);
            return analysis.profiles;
        }
    }
})();
