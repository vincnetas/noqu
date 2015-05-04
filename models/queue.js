var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var QueueSchema = new Schema({
    topics : [],
    clients : []
});

mongoose.model('Queue', QueueSchema);