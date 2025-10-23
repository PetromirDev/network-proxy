// config.js - Configuration for proxy testing modes

module.exports = {
	// General settings
	settings: {
		slowDownTimeout: {
			min: 1000,
			max: 5000
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
		invictusRpcProviders: ['invictus.ambire.com']
	},

	// Mode definitions
	modes: {
		slow: {
			name: 'Slow',
			applyFailure: false,
			submodes: [
				{ key: '1', name: 'Everything', target: 'everything' },
				{ key: '2', name: 'Cena', target: 'cena' },
				{ key: '3', name: 'Velcro', target: 'velcro' },
				{ key: '4', name: 'Swap Providers', target: 'swapProviders' },
				{ key: '5', name: 'Bundler Providers', target: 'bundlerProviders' },
				{ key: '6', name: 'Paymaster', target: 'paymaster' },
				{ key: '7', name: 'All RPC Providers', target: 'allRpcProviders' },
				{ key: '8', name: 'Invictus RPC Providers', target: 'invictusRpcProviders' },
				{ key: '9', name: 'Non-Invictus RPC Providers', target: 'nonInvictusRpcProviders' }
			]
		},
		shittyInternet: {
			name: 'Shitty Internet',
			applyFailure: true,
			submodes: [
				{ key: '1', name: 'Everything', target: 'everything' },
				{ key: '2', name: 'Cena', target: 'cena' },
				{ key: '3', name: 'Velcro', target: 'velcro' },
				{ key: '4', name: 'Swap Providers', target: 'swapProviders' },
				{ key: '5', name: 'Bundler Providers', target: 'bundlerProviders' },
				{ key: '6', name: 'Paymaster', target: 'paymaster' },
				{ key: '7', name: 'All RPC Providers', target: 'allRpcProviders' },
				{ key: '8', name: 'Invictus RPC Providers', target: 'invictusRpcProviders' },
				{ key: '9', name: 'Non-Invictus RPC Providers', target: 'nonInvictusRpcProviders' }
			]
		},
		parentalControl: {
			name: 'Parental Control',
			blockAll: true,
			submodes: [{ key: '1', name: 'Everything', target: 'everything' }]
		}
	}
}
