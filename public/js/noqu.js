Storage.prototype.setObject = function (key, value) {
    this.setItem(key, angular.toJson(value));
}

Storage.prototype.getObject = function (key) {
    var value = this.getItem(key);
    return value && JSON.parse(value);
}

angular.module('noquApp', [])
    .factory('QuService', ['$http', function ($http) {
        return {
            getSocket: function () {
                var result = null;
                if (window.location.hostname == "app.noqu.me") {
                    result = io.connect('http://app.noqu.me:8000', {
                        'forceNew': true
                    });
                } else {
                    result = io.connect();
                }

                return result;
            }
        }
    }])
    .controller('QuController', ['$scope', 'QuService', function ($scope, QuService) {
        var socket = QuService.getSocket();

        $scope.connected = false;
        $scope.registered = false;
        $scope.clients = localStorage.getObject("clients") || [];
        $scope.queueId = localStorage.getItem("queueId");


        function connectToQueue(queueId) {
            socket.emit("connectQueue", {
                queueId: queueId
            }, function (response) {
                if (response.connected) {
                    $scope.registered = true;
                    $scope.$apply();
                } else {
                    setTimeout(connectToQueue, 1000);
                }
            });
        }

        $scope.connect = function () {
            $scope.queueId = Math.round(Math.random() * 1000);
            localStorage.setItem("queueId", $scope.queueId);

            connectToQueue($scope.queueId);
        }

        $scope.disconnect = function () {
            $scope.queueId = null;
            localStorage.removeItem("queueId");
            localStorage.removeItem("clients");
            socket.emit('closeQueue', {});
        }

        $scope.deleteClient = function (client) {
            $scope.clients.splice($scope.clients.indexOf(client), 1);
            localStorage.setObject("clients", $scope.clients);

            socket.emit("queueState", {
                clients: $scope.clients
            });
        }

        socket.on("newClient", function (data) {
            $scope.clients.push(data);
            localStorage.setObject("clients", $scope.clients);

            socket.emit("queueState", {
                clients: $scope.clients
            });
            $scope.$apply();
        });

        socket.on('connect', function () {
            $scope.connected = true;
            if ($scope.queueId != null) {
                connectToQueue($scope.queueId);
            }
            $scope.$apply();
        });

        socket.on('disconnect', function () {
            $scope.connected = false;
            $scope.$apply();
        });

    }]).controller('QuClController', ['$scope', 'QuService', function ($scope, QuService) {
        var socket = QuService.getSocket();

        $scope.queueId = localStorage.getItem("clientQueueId");
        $scope.homeScreen = $scope.queueId == null;
        $scope.connected = false;
        $scope.registered = false;

        var reconnect = function (queueId) {
            socket.emit("connectClient", {
                queueId: $scope.queueId
            }, function (response) {
                if (response.connected) {
                    $scope.registered = true;
                } else {
                    setTimeout(reconnect, 1000);
                }
                $scope.$apply();
            });
        }

        socket.on("connect", function () {
            $scope.connected = true;

            if (!$scope.homeScreen) {
                reconnect();
            }

            $scope.$apply();
        });

        socket.on("disconnect", function () {
            $scope.connected = false;
            $scope.registered = false;

            $scope.$apply();
        });

        socket.on('closeQueue', function () {
            $scope.registered = false;
            reconnect();
        });

        $scope.connect = function () {
            socket.emit("connectClient", {
                queueId: $scope.queueId
            }, function (response) {
                if (response.connected) {
                    $scope.registered = true;
                    $scope.homeScreen = false;
                } else {
                    $scope.errorMessage = response.errorMessage;
                    $(".error-message").css("opacity", "1");
                    $(".error-message").animate({
                        opacity: 0
                    }, {
                        duration: 2000,
                        queue: false
                    });
                }
                $scope.$apply();
            });
        }

        $scope.newClient = function () {
            socket.emit("newClient", {
                name: $scope.name,
                id: new Date().getTime()
            }, function (response) {
                if (response.ok) {
                    $scope.userMessage = "you're in the line now. take a seat and wait to be called."
                    $scope.name = "";
                    $scope.messageIsActive = true;
                    $(".user-message").css("opacity", "1");
                    $(".user-message").animate({
                        opacity: 0
                    }, {
                        duration: 5000,
                        queue: false,
                        always: function () {
                            $scope.messageIsActive = false;
                            $scope.$apply();
                        }
                    });
                }
                $scope.$apply();
            });
        }
    }]).controller('QuDiController', ['$scope', 'QuService', function ($scope, QuService) {
        var socket = QuService.getSocket();

        $scope.queueId = localStorage.getItem("clientQueueId");
        $scope.homeScreen = $scope.queueId == null;
        $scope.connected = false;
        $scope.registered = false;

        var reconnect = function (queueId) {
            socket.emit("connectDisplay", {
                queueId: $scope.queueId
            }, function (response) {
                if (response.connected) {
                    $scope.registered = true;
                } else {
                    setTimeout(reconnect, 1000);
                }
                $scope.$apply();
            });
        }

        $scope.connect = function () {
            socket.emit("connectDisplay", {
                queueId: $scope.queueId
            }, function (response) {
                if (response.connected) {
                    $scope.registered = true;
                    $scope.homeScreen = false;
                } else {
                    $scope.errorMessage = response.errorMessage;
                    $(".error-message").css("opacity", "1");
                    $(".error-message").animate({
                        opacity: 0
                    }, {
                        duration: 2000,
                        queue: false
                    });

                    $scope.errorMessage = response.errorMessage;
                }
                $scope.$apply();
            });
        }

        socket.on('connect', function () {
            $scope.connected = true;
            if (!$scope.homeScreen) {
                reconnect();
            }
            $scope.$apply();
        });

        socket.on("queueState", function (data) {
            $scope.clients = data.clients;
            $scope.$apply();
        });

        socket.on('disconnect', function () {
            $scope.connected = false;
            $scope.registered = false;
            $scope.$apply();
        });
    
        socket.on('closeQueue', function () {
            $scope.registered = false;
            reconnect();
        });
    }]);