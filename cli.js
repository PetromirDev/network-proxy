// cli.js - Interactive terminal UI for proxy modes
const blessed = require('blessed')
const config = require('./config')
const state = require('./state')

class ProxyCLI {
	constructor() {
		this.currentView = 'main' // 'main' | 'slow' | 'shittyInternet'
		this.setupScreen()
		this.setupMainMenu()
	}

	setupScreen() {
		this.screen = blessed.screen({
			smartCSR: true,
			title: 'Network Testing Proxy',
			fullUnicode: true,
			dockBorders: true,
			forceUnicode: true,
			input: process.stdin,
			output: process.stdout
		})

		// Ensure stdin is in raw mode and listening
		if (process.stdin.setRawMode) {
			process.stdin.setRawMode(true)
		}
		process.stdin.resume()

		this.screen.key(['escape', 'q', 'C-c'], () => {
			return process.exit(0)
		})

		// Workaround for VS Code terminal focus issues
		// Re-render periodically to keep screen responsive
		this.renderInterval = setInterval(() => {
			this.screen.render()
		}, 100)

		// Add any key press as a way to "wake up" the screen
		this.screen.on('keypress', () => {
			this.screen.render()
		})

		// Create a log area at the bottom
		this.logBox = blessed.log({
			bottom: 0,
			left: 0,
			width: '100%',
			height: '20%',
			label: ' Proxy Logs ',
			tags: true,
			border: {
				type: 'line'
			},
			style: {
				fg: 'white',
				border: {
					fg: 'blue'
				}
			},
			scrollable: true,
			alwaysScroll: true,
			scrollbar: {
				ch: ' ',
				track: {
					bg: 'cyan'
				},
				style: {
					inverse: true
				}
			}
		})

		this.screen.append(this.logBox)

		// Intercept console.log to redirect to our log box
		const originalConsoleLog = console.log
		console.log = (...args) => {
			const message = args.join(' ')
			if (message.includes('Debug')) {
				originalConsoleLog(...args)
				return
			}
			this.logBox.log(message)
			this.screen.render()
			// Do NOT output to terminal - it breaks the UI
		}

		// Also intercept console.error to prevent UI breaking
		const originalConsoleError = console.error
		console.error = (...args) => {
			const message = '{red-fg}[ERROR]{/red-fg} ' + args.join(' ')
			this.logBox.log(message)
			this.screen.render()
		}
	}

	clearKeyBindings() {
		// Store the keys we want to unbind
		const keysToUnbind = ['d', 'x', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'backspace', 'left']

		// Unbind each key individually
		keysToUnbind.forEach((key) => {
			try {
				this.screen.unkey(key)
			} catch (e) {
				// Key might not be bound, ignore
			}
		})
	}

	setupMainMenu() {
		// Clear screen
		if (this.box) this.box.destroy()

		// Clear old key bindings
		this.clearKeyBindings()

		this.box = blessed.box({
			top: 0,
			left: 'center',
			width: '90%',
			height: '75%',
			content: this.renderMainMenu(),
			tags: true,
			border: {
				type: 'line'
			},
			style: {
				fg: 'white',
				border: {
					fg: 'cyan'
				}
			}
		})

		this.screen.append(this.box)

		// Setup key bindings for main menu
		this.screen.key(['1'], () => this.showSubMenu('slow'))
		this.screen.key(['2'], () => this.showSubMenu('shittyInternet'))
		this.screen.key(['3'], () => this.showSubMenu('picky'))
		this.screen.key(['4'], () => this.showSubMenu('parentalControl'))
		this.screen.key(['d'], () => this.disableMode())
		this.screen.key(['x'], () => this.disableMode())

		this.screen.render()
	}

	renderMainMenu() {
		const currentState = state.getState()
		const statusText = currentState.enabled
			? `{green-fg}ACTIVE{/green-fg} - Mode: {yellow-fg}${this.getModeDisplayName(
					currentState.mode
			  )}{/yellow-fg} | Target: {yellow-fg}${this.getTargetDisplayName(currentState.target)}{/yellow-fg}`
			: '{red-fg}DISABLED{/red-fg}'

		return `
{bold}{cyan-fg}═══════════════════════════════════════════════════════════════════════════{/cyan-fg}{/bold}
{bold}{white-fg}                    NETWORK TESTING PROXY CONTROL{/white-fg}{/bold}
{bold}{cyan-fg}═══════════════════════════════════════════════════════════════════════════{/cyan-fg}{/bold}

{bold}Status:{/bold} ${statusText}

{bold}{cyan-fg}Available Modes:{/cyan-fg}{/bold}

  {bold}[1]{/bold} Slow Mode
      ${config.getDescription('slow')}

  {bold}[2]{/bold} Shitty Internet Mode
      ${config.getDescription('shittyInternet')}

  {bold}[3]{/bold} Picky Slow + Failures Mode
      ${config.getDescription('picky')}

  {bold}[4]{/bold} Parental Control Mode
      ${config.getDescription('parentalControl')}

  {bold}[d]{/bold} Disable All Modes
      Return to normal proxy pass-through

{bold}{cyan-fg}Controls:{/cyan-fg}{/bold}
  {gray-fg}Press the key in brackets to select a mode{/gray-fg}
  {gray-fg}Press [ESC] or [q] to quit{/gray-fg}

{bold}{cyan-fg}═══════════════════════════════════════════════════════════════════════════{/cyan-fg}{/bold}
`
	}

	showSubMenu(mode) {
		this.currentView = mode

		// Clear screen
		if (this.box) this.box.destroy()

		// Clear old key bindings
		this.clearKeyBindings()

		this.box = blessed.box({
			top: 0,
			left: 'center',
			width: '90%',
			height: '75%',
			content: this.renderSubMenu(mode),
			tags: true,
			border: {
				type: 'line'
			},
			style: {
				fg: 'white',
				border: {
					fg: 'cyan'
				}
			}
		})

		this.screen.append(this.box)

		// Setup key bindings for submenu
		const modeConfig = config.modes[mode]
		modeConfig.submodes.forEach((submode) => {
			this.screen.key([submode.key], () => {
				this.activateMode(mode, submode.target)
			})
		})

		this.screen.key(['backspace', 'left'], () => {
			this.setupMainMenu()
		})

		this.screen.key(['d', 'x'], () => {
			this.disableMode()
		})

		this.screen.render()
	}

	renderSubMenu(mode) {
		const modeConfig = config.modes[mode]
		const currentState = state.getState()

		let submodesList = ''
		modeConfig.submodes.forEach((submode) => {
			const isActive = currentState.enabled && currentState.mode === mode && currentState.target === submode.target
			const activeMarker = isActive ? '{green-fg}[ACTIVE]{/green-fg} ' : ''
			submodesList += `  {bold}[${submode.key}]{/bold} ${activeMarker}${submode.name}\n`
		})

		return `
{bold}{cyan-fg}═══════════════════════════════════════════════════════════════════════════{/cyan-fg}{/bold}
{bold}{yellow-fg}                    ${modeConfig.name.toUpperCase()}{/yellow-fg}{/bold}
{bold}{cyan-fg}═══════════════════════════════════════════════════════════════════════════{/cyan-fg}{/bold}

{bold}Description:{/bold} ${config.getDescription(mode)}

{bold}{cyan-fg}Select Target:{/cyan-fg}{/bold}

${submodesList}

{bold}{cyan-fg}Controls:{/cyan-fg}{/bold}
  {gray-fg}Press a number to select a target{/gray-fg}
  {gray-fg}Press [d] to disable mode | [BACKSPACE] or [←] to go back | [ESC] or [q] to quit{/gray-fg}

{bold}{cyan-fg}═══════════════════════════════════════════════════════════════════════════{/cyan-fg}{/bold}
`
	}

	activateMode(mode, target) {
		state.setMode(mode, target)
		this.logBox.log(
			`{green-fg}✓{/green-fg} Activated: ${this.getModeDisplayName(mode)} → ${this.getTargetDisplayName(target)}`
		)
		// Stay in the submenu and refresh it to show the active state
		this.showSubMenu(mode)
	}

	disableMode() {
		state.disable()
		this.logBox.log('{yellow-fg}✓{/yellow-fg} All modes disabled - Normal pass-through active')
		this.setupMainMenu()
	}

	showNotification(message, color = 'green') {
		const notification = blessed.message({
			parent: this.screen,
			top: 'center',
			left: 'center',
			width: 'shrink',
			height: 'shrink',
			border: 'line',
			style: {
				fg: 'white',
				bg: color,
				border: {
					fg: color
				}
			}
		})

		notification.display(message, 2, () => {
			this.screen.render()
		})
	}

	getModeDisplayName(mode) {
		if (!mode) return 'None'
		const modeConfig = config.modes[mode]
		return modeConfig ? modeConfig.name : mode
	}

	getTargetDisplayName(target) {
		if (!target) return 'None'

		// Find the display name from any mode's submodes
		for (const modeKey in config.modes) {
			const submode = config.modes[modeKey].submodes.find((s) => s.target === target)
			if (submode) return submode.name
		}
		return target
	}

	start() {
		this.screen.render()
	}
}

module.exports = ProxyCLI
