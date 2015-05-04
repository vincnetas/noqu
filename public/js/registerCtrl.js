module.controller('registerController', ['$scope', 'QuService', function ($scope, QuService) {
    var socket = QuService.getSocket();

    $scope.connected = false;
    $scope.registered = false;
    $scope.topics = [];

    $scope.queueId = localStorage.getItem("queueId");

    function connectQueue(queueId, retry) {
        socket.emit("connectQueue", {
            queueId: queueId
        }, function (response) {
            if (response) {
                $scope.registered = true;
                $scope.clients = response.clients;
                $scope.queueId = response.queueId;
                localStorage.setItem("queueId", $scope.queueId);

                $scope.$apply();
            } else {
                if (retry) {
                    setTimeout(function () {
                        connectToQueue(queueId, retry);
                    }, 1000);
                }
            }
        });
    }
    
    $scope.connectQueue = function() {
        connectQueue($scope.queueId, false);
    }

    $scope.createQueue = function () {
        socket.emit("createQueue", {
            topics: $scope.topics
        }, function (response) {
            if (response) {
                $scope.queueId = response.queueId;
                localStorage.setItem("queueId", $scope.queueId);
                connectQueue($scope.queueId, true);
            } else {

            }
        });
    }

    $scope.closeQueue = function () {
        localStorage.removeItem("queueId");

        $scope.registered = false;
        $scope.topics = [];
        $scope.queueId = null;

        socket.emit('closeQueue', {});
    }

    $scope.addTopic = function () {
        var topic = {
            name: "",
            editingName: "",
            editing: true,
            id: new Date().getTime()
        }
        $scope.topics.push(topic);
    }

    $scope.removeTopic = function (topic) {
        $scope.topics.splice($scope.topics.indexOf(topic), 1);
    }

    function isValidTopic(topicName) {
        return _.trim(topicName).length > 0;
    }

    $scope.applyTopicEdit = function (topic, createNew) {
        if (isValidTopic(topic.editingName)) {
            topic.name = topic.editingName;
            if (createNew) {
                $scope.addTopic();
            }
        } else {
            $scope.removeTopic(topic);  
        }
        topic.editing = false;
    }

    $scope.cancelTopicEdit = function (topic) {
        if (isValidTopic(topic.name)) {
            topic.editingName = topic.name;
        } else {
            $scope.removeTopic(topic);
        }
        topic.editing = false;
    }

    $scope.deleteClient = function (client) {
        socket.emit("deleteClient", client, function (response) {
            if (response) {} else {
                console.error("errro");
            }
        });
    }

    $scope.getToken = function () {
        socket.emit('getAccessToken', {}, function (response) {
            $scope.token = response.token;

            $scope.$apply();

            $(".token-message")
                .css("opacity", "1")
                .animate({
                    opacity: 0
                }, {
                    duration: response.validTime,
                    queue: false,
                    always: function () {
                        $scope.token = null;
                        $scope.$apply();
                    }
                });
        });
    }

    socket.on("queueUpdate", function (data) {
        $scope.clients = data.clients;
        $scope.$apply();
    });

    socket.on('connect', function () {
        $scope.connected = true;
        if ($scope.queueId != null) {
            connectQueue($scope.queueId, true);
        }
        $scope.$apply();
    });

    socket.on('disconnect', function () {
        $scope.connected = false;
        $scope.$apply();
    });

    }]);