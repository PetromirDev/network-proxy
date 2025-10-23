// server.js
const AnyProxy = require('anyproxy')
const path = require('path')
const ProxyCLI = require('./cli')

const RULE = path.join(__dirname, 'rule.js')
const LISTEN_PORT = 8080

const options = {
	port: LISTEN_PORT,
	rule: require(RULE),
	// webInterface lets you inspect proxy web UI; disabled here for simplicity
	webInterface: {
		enable: false
	},
	// Must enable HTTPS interception (MITM)
	forceProxyHttps: true,
	// allow self-signed upstream certs to be ignored (for testing)
	dangerouslyIgnoreUnauthorized: true,
	// verbose
	silent: true // Set to true to reduce noise
}

const proxyServer = new AnyProxy.ProxyServer(options)

proxyServer.on('ready', () => {
	// Start the CLI interface
	const cli = new ProxyCLI()
	cli.start()
})

proxyServer.on('error', (e) => {
	console.error('[anyproxy] error', e)
})

proxyServer.start()

// stop gracefully on exit
process.on('SIGINT', () => {
	proxyServer.close()
	console.log('\n[anyproxy] stopped')
	process.exit()
})
