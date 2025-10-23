// state.js - Shared state manager for proxy modes

class ProxyState {
	constructor() {
		this.mode = null // 'slow' | 'shittyInternet' | null
		this.target = null // 'everything' | 'cena' | 'velcro' | etc.
		this.enabled = false
	}

	setMode(mode, target) {
		this.mode = mode
		this.target = target
		this.enabled = true
	}

	disable() {
		this.enabled = false
		this.mode = null
		this.target = null
	}

	isActive() {
		return this.enabled && this.mode !== null && this.target !== null
	}

	getState() {
		return {
			enabled: this.enabled,
			mode: this.mode,
			target: this.target
		}
	}
}

// Singleton instance
const state = new ProxyState()

module.exports = state
