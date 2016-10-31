(function() {
    'use strict';

    angular.module('main').factory('httpUtils', httpUtils);
    httpUtils.$inject = ['$http'];

    /**
     * Defines a helper class for HTTP requests.
     * @param {Object} $http The Angular HTTP request provider.
     * @returns {Object} The HTTP utilities.
     */
    function httpUtils($http) {
        var urlRegex = /{(\w+)}/;

        return {
            buildUrl: buildUrl,
            get: get
        };

        /**
         * Builds up a URL endpoint, injecting the parameters into the URL; credit goes entirely to DestinyTrialsReport {@link https://goo.gl/nH7HsI} for this; keep up the great work guys.
         * @param {String} url The variablised endpoint URL.
         * @param {Object} params The parameters to inject into the URL.
         * @returns {String} The URL.
         */
        function buildUrl(url, params) {
            var match;
            while (match = urlRegex.exec(url)) {
                if (null === params[match[1]]) {
                    throw 'Missing "' + match[1] + '" for ' + url;
                }

                url = url.replace(match[0], params[match[1]]);
            }

            return url;
        };

        /**
         * Executes a get request.
         * @param {String} url The variablised endpoint URL.
         * @param {Object} params The parameters to inject into the URL.
         * @param {Object} options The options.
         * @returns {Object} The response.
         */
        function get(url, params, options) {
            var url = buildUrl(url, params);
            return $http.get(url, options);
        };
    }
})();
