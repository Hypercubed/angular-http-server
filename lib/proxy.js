const httpProxy = require("http-proxy");
const { minimatch } = require('minimatch');

var proxyServer = null;

/**
 * Simple Http Proxy, proxies request where url is contained in config to target from config
 *
 * @param req
 * @param res
 * @param {object} configs - proxyConfig from config file
 * @return {boolean} - will return whether request is being proxied
 */
function proxyHandler(req, res, configs) {
    if (!configs || configs.length === 0) {
        throw new Error(
            "no proxy configs present, please configure in your config file"
        );
    }
    let proxyHit = false;
    configs.forEach((config) => {
        if (!proxyHit) {
            if (!config.forward || config.forward.length === 0) {
                throw new Error(
                    "forward is missing or empty in your proxyConfig"
                );
            }

            if (!config.target || config.target === "") {
                throw new Error(
                    "target is missing or empty in your proxyConfig"
                );
            }

            proxyHit = config.forward.some((pattern) => minimatch(req.url, pattern));
            if (proxyHit) {
                const protocol = config.protocol ? config.protocol : "https";
                console.log(
                    `Proxying request ${req.method}, ${req.url} to ${protocol}://${config.target}`
                );

                if (proxyServer === null) {
                    proxyServer = httpProxy.createProxyServer({secure: config.secure === undefined ? true : config.secure});
                }

                proxyServer.web(req, res, {
                    target: `${protocol}://${config.target}`,
                }, (e, req, res) => {
                    console.error(`Proxy error: ${e.code}`);
                    res.writeHead(502);
                    res.end();
                 });
            }
        }
    });
    return proxyHit;
}

module.exports = proxyHandler;
