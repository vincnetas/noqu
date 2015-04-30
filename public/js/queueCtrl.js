module.controller('QuController', ['$scope', 'QuService', function ($scope, QuService) {
    var socket = QuService.getSocket();

    $scope.connected = false;
    $scope.registered = false;
    $scope.topics = localStorage.getObject("topics") || [];
    $scope.clients = localStorage.getObject("clients") || [];
    $scope.queueId = localStorage.getItem("queueId");


    function connectToQueue(queueId) {
        socket.emit("connectQueue", {
            queueId: queueId,
            data: {
                topics: $scope.topics
            }
        }, function (response) {
            if (response.connected) {
                $scope.registered = true;
                $scope.$apply();
            } else {
                setTimeout(connectToQueue, 1000);
            }
        });
    }

    $scope.addTopic = function () {
        $scope.topics.push({
            name: $scope.topic,
            id: new Date().getTime()
        });
        localStorage.setObject("topics", $scope.topics);
    }

    $scope.connect = function () {
        $scope.queueId = Math.round(Math.random() * 1000);
        localStorage.setItem("queueId", $scope.queueId);

        connectToQueue($scope.queueId);
    }

    $scope.removeTopic = function (topic) {
        $scope.topics.splice($scope.topics.indexOf(topic), 1);
        localStorage.setObject("topics", $scope.topics);
    }

    $scope.disconnect = function () {
        $scope.queueId = null;

        localStorage.removeItem("queueId");
        localStorage.removeItem("topics");
        localStorage.removeItem("clients");

        $scope.registered = false;
        $scope.topics = [];
        $scope.topic = null;

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

    socket.on('newDisplay', function () {
        socket.emit("queueState", {
            clients: $scope.clients
        });
    });

    }]);