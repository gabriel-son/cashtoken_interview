const {environment, port} = require('../config')
module.exports = (path, req, protocol) => {
    const host = req.hostname;
    if(environment === 'development') return `${protocol}://${host}:${port}/${path}`;

    return `${protocol}://${host}/${path}`;
}