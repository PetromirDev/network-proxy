// config.js - Configuration for proxy testing modes

const SUBMODES_WITHOUT_KEYS = [
	{ name: 'Everything', target: 'everything' },
	{ name: 'Cena', target: 'cena' },
	{ name: 'Velcro', target: 'velcro' },
	{ name: 'DeFi', target: 'defi' },
	{ name: 'All RPC Providers', target: 'allRpcProviders' },
	{ name: 'Invictus RPC Providers', target: 'invictusRpcProviders' },
	{ name: 'Non-Invictus RPC Providers', target: 'nonInvictusRpcProviders' },
	{ name: 'Swap Providers', target: 'swapProviders' },
	{ name: 'Bundler Providers', target: 'bundlerProviders' },
	{ name: 'Paymaster', target: 'paymaster' }
]

const SUBMODES = SUBMODES_WITHOUT_KEYS.map((submode, index) => ({
	...submode,
	key: index.toString()
}))

module.exports = {
	// General settings
	settings: {
		slowDownTimeout: {
			min: 3000,
			max: 8000
		},
		failureRate: 0.2
	},

	// Helper function to generate dynamic descriptions
	getDescription(mode) {
		const { min, max } = this.settings.slowDownTimeout
		const failurePercent = Math.round(this.settings.failureRate * 100)

		switch (mode) {
			case 'slow':
				return `Requests are delayed by ${min / 1000}-${max / 1000} seconds`
			case 'shittyInternet':
				return `Requests are delayed + ${failurePercent}% fail randomly`
			case 'parentalControl':
				return 'All requests are blocked with a message'
			case 'picky':
				return `Endpoints are delayed and blocked every so often`
			default:
				return ''
		}
	},

	// Endpoint matchers - simple string matching with .includes()
	endpoints: {
		cena: ['/api/v3/simple/'],
		velcro: ['/velcro-v3'],
		swapProviders: ['li.quest', 'bungee.exchange'],
		bundlerProviders: ['pimlico', 'biconomy', 'gelato', 'etherspot', 'candide'],
		paymaster: ['/v2/sponsorship'],
		invictusRpcProviders: ['invictus.ambire.com'],
		defi: ['api/v3/defi/']
	},

	// Mode definitions
	modes: {
		slow: {
			name: 'Slow',
			applyFailure: false,
			submodes: SUBMODES
		},
		shittyInternet: {
			name: 'Slow + Failures',
			applyFailure: true,
			submodes: SUBMODES
		},
		picky: {
			name: 'Picky Slow + Failures',
			applyFailure: true,
			submodes: SUBMODES
		},
		parentalControl: {
			name: 'Parental Control',
			blockAll: true,
			submodes: [{ key: '1', name: 'Everything', target: 'everything' }]
		}
	}
}
