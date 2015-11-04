(function(app) {
    'use strict';

    /**
     * Defines the character controller, allowing the user to view their gear and stat profiles.
     * @param {object} $scope The scope of the contorller.
     * @param {object} userService The user service.
     * @param {function} inventoryAnalyser The inventory analyser used to assess the stat paths.
     */
    app.controller('characterController', ['$scope', 'userService', 'inventoryAnalyser', function($scope, userService, inventoryAnalyser) {
        $scope.character = null;
        $scope.statProfiles = [];

        /**
         * Selects the desired stat profile.
         * @param {object} statProfile The stat profile that was selected.
         */
        $scope.selectStatProfile = function(statProfile) {
            console.log(statProfile);
        };

        // watch for the character changing
        $scope.$watch(function() {
            return userService.character ? userService.character.characterId : null;
        }, function() {
            // update the scope
            $scope.character = userService.character;
            $scope.statProfiles = $scope.character ? inventoryAnalyser.getStatProfiles($scope.character) : [];
        });
    }]);
})(angular.module('destinyTailorApp'));
