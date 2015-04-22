angular.module('noquApp', [])
    .factory('QuService', ['$http', function ($http) {
        return {
            getSocket: function () {
                //var socket = io.connect();
                var socket = io.connect('http://app.noqu.me:8000', {
                    'forceNew': true
                });
                return socket;
            }
        }
    }])
    .controller('QuController', ['$scope', 'QuService', function ($scope, QuService) {
        var socket = QuService.getSocket();

        $scope.clients = [];

        $scope.queueId = localStorage.getItem("queueId");
        if ($scope.queueId != null) {
            socket.emit("connectQueue", {
                queueId: $scope.queueId
            }, function (response) {
                if (response.connected) {
                    // do nothing
                } else {
                    alert(response.errorMessage);
                }
            });
        }

        $scope.connect = function () {
            $scope.queueId = Math.round(Math.random() * 1000);
            localStorage.setItem("queueId", $scope.queueId);

            socket.emit("connectQueue", {
                queueId: $scope.queueId
            }, function (response) {
                if (response.connected) {
                    // do nothing
                } else {
                    alert(response.errorMessage);
                }
            });
        }

        socket.on("newClient", function (data) {
            $scope.clients.push(data);
            $scope.$apply();

            socket.emit("queueState", {
                clients: $scope.clients
            });
        });

        $scope.deleteClient = function (client) {
            $scope.clients.splice($scope.clients.indexOf(client), 1);
            socket.emit("queueState", {
                clients: $scope.clients
            });
        }

    }]).controller('QuClController', ['$scope', 'QuService', function ($scope, QuService) {
        var socket = QuService.getSocket();

        socket.on("disconnect", function (data) {
            $scope.errorMessage = data.errorMessage;
            $scope.$apply();
        });

        $scope.connect = function () {
            socket.emit("connectClient", {
                queueId: $scope.queueId
            }, function (response) {
                if (response.connected) {
                    // something
                } else {
                    $scope.errorMessage = response.errorMessage;
                    $scope.$apply();
                }
            });
        }

        $scope.newClient = function () {
            socket.emit("newClient", {
                name: $scope.name,
                id: new Date().getTime()
            }, function (response) {
                if (response.connected) {
                    // something
                } else {
                    $scope.errorMessage = response.errorMessage;
                    $scope.$apply();
                }
            });
        }
    }]).controller('QuDiController', ['$scope', 'QuService', function ($scope, QuService) {
        var socket = QuService.getSocket();

        $scope.connect = function () {
            socket.emit("connectDisplay", {
                queueId: $scope.queueId
            }, function (response) {
                if (response.connected) {
                    // something
                } else {
                    $scope.errorMessage = response.errorMessage;
                    $scope.$apply();
                }
            });
        }

        socket.on("queueState", function (data) {
            $scope.clients = data.clients;
            $scope.$apply();
        });
    }]);