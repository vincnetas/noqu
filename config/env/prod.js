/**
 * Expose
 */

module.exports = {
    db: process.env.OPENSHIFT_MONGODB_DB_URL + "noqu",
    host: process.env.OPENSHIFT_NODEJS_IP,
    port: process.env.OPENSHIFT_NODEJS_PORT
};