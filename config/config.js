/**
 * Module dependencies.
 */

var path = require('path');
var extend = require('util')._extend;

var development = require('./env/dev');
var production = require('./env/prod');

var notifier = {
    service: 'postmark',
    APN: false,
    email: true, // true
    actions: ['comment'],
    tplPath: path.normalize(__dirname + '/../app/mailer/templates'),
    key: 'POSTMARK_KEY'
};

var defaults = {
    root: path.normalize(__dirname + '/..'),
    notifier: notifier
};

/**
 * Expose
 */
module.exports = {
    dev: extend(development, defaults),
    prod: extend(production, defaults)
}[process.env.NODE_ENV || 'dev'];