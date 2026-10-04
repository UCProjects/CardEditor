const nodeFetch = require('node-fetch');

function createAgent() {
  const proxy = process.env.ALL_PROXY;
  if (!proxy) return undefined;
  const { SocksProxyAgent } = require('socks-proxy-agent');
  return new SocksProxyAgent(proxy);
}

const agent = createAgent();

module.exports = (url, options) => nodeFetch(url, { agent, ...options });
