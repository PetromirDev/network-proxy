// rule.js
const config = require('./config')
const state = require('./state')

// Helper: Check if request body is a valid Ethereum JSON-RPC request
function isEthereumRpcRequest(requestDetail) {
	try {
		const body = requestDetail?.requestData || requestDetail?.requestOptions?.body

		if (!body) return false

		// Try to parse as JSON
		let parsed
		if (Buffer.isBuffer(body)) {
			// Convert Buffer to string first
			parsed = JSON.parse(body.toString('utf8'))
		} else if (typeof body === 'string') {
			parsed = JSON.parse(body)
		} else if (typeof body === 'object') {
			parsed = body
		} else {
			return false
		}

		// Handle both single requests and batch requests
		const requests = Array.isArray(parsed) ? parsed : [parsed]

		// Check if any request has Ethereum RPC method
		return requests.some((req) => {
			return typeof req.method === 'string' && typeof req.id !== 'undefined' && typeof req.jsonrpc === 'string'
		})
	} catch (e) {
		return false
	}
}

// Helper: Check if URL is an Invictus RPC provider
function isInvictusRpc(url) {
	const invictusPatterns = config.endpoints.invictusRpcProviders
	return invictusPatterns.some((pattern) => url.includes(pattern))
}

// Helper: Check if this is a non-Invictus Ethereum RPC request
function isNonInvictusRpcRequest(requestDetail) {
	const url = requestDetail?.url || ''
	return isEthereumRpcRequest(requestDetail) && !isInvictusRpc(url)
}

// Helper: Check if URL matches any of the endpoint patterns
function matchesEndpoint(url, target, requestDetail) {
	if (target === 'everything') {
		return true
	}

	if (target === 'allRpcProviders') {
		return isEthereumRpcRequest(requestDetail)
	}

	// Special handling for non-Invictus RPC detection
	if (target === 'nonInvictusRpcProviders') {
		return isNonInvictusRpcRequest(requestDetail)
	}

	const patterns = config.endpoints[target]
	if (!patterns) {
		return false
	}

	return patterns.some((pattern) => url.includes(pattern))
}

// Helper: Generate random delay within configured range
function getRandomDelay() {
	const min = config.settings.slowDownTimeout.min
	const max = config.settings.slowDownTimeout.max
	return Math.floor(Math.random() * (max - min + 1)) + min
}

// Helper: Check if request should fail (based on failure rate)
function shouldFail() {
	return Math.random() < config.settings.failureRate
}

// Helper: Delay promise
function delay(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

let isPickyActive = false

module.exports = {
	summary: 'Network testing proxy with configurable modes',

	*beforeSendResponse(requestDetail, responseDetail) {
		try {
			const url = requestDetail?.url || ''
			const method = (requestDetail?.requestOptions?.method || requestDetail?.method || 'GET').toUpperCase()

			// If no mode is active, pass through normally
			if (!state.isActive()) {
				return null
			}

			const currentState = state.getState()
			const modeConfig = config.modes[currentState.mode]

			// Handle Parental Control mode - blocks everything
			if (modeConfig.blockAll) {
				console.log(`[${currentState.mode}] BLOCKING ${method} ${url}`)
				const isPost = method === 'POST'
				return {
					response: {
						statusCode: isPost ? 403 : 200,
						header: { 'Content-Type': 'text/html; charset=utf-8' },
						body: "<h1>Can't use the internet at the moment</h1><p>Please try again later.</p>"
					}
				}
			}

			// Check if this URL matches the current target
			if (!matchesEndpoint(url, currentState.target, requestDetail)) {
				return null // Pass through
			}

			if (currentState.mode === 'picky') {
				if (isPickyActive) {
					return null // Already applied delay/failure for this request
				}

				isPickyActive = true

				setTimeout(() => {
					isPickyActive = false
				}, 1000) // Reset after 1 second
			}

			// Apply delay
			const delayMs = getRandomDelay()
			console.log(`[${currentState.mode}] Delaying ${method} ${url} by ${delayMs}ms`)
			yield delay(delayMs)

			// Apply failure if in "shitty internet" mode
			if (modeConfig.applyFailure && shouldFail()) {
				console.log(`[${currentState.mode}] FAILING ${method} ${url}`)
				return {
					response: {
						statusCode: 503,
						header: { 'Content-Type': 'text/html; charset=utf-8' },
						body: '<h1>Network Error</h1><p>Service temporarily unavailable</p>'
					}
				}
			}

			// Otherwise, let the request go through (with the delay already applied)
			return null
		} catch (err) {
			console.error('[rule error]', err)
			return null // fallback: forward normally if something breaks
		}
	}
}
