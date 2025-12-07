# ANSI Color Logger

Advanced logging system with ANSI escape sequences support for colored and styled console output.

## Installation

```bash
npm install ansi-js-logger
```

## Quick Start

```javascript
import { LOG } from "ansi-color-logger";

// Basic usage
LOG.debug("Debug message");
LOG.info("Info message");
LOG.warn("Warning message");
LOG.error("Error message");

// Custom colors
LOG.print("Custom color", "green");
LOG.print("Hex color", "#ff0000");
LOG.print("RGB color", "255,0,0");
```

## Advanced Features

### Duplicate Log Suppression

```javascript
import { LOG, configureLogSuppression } from "ansi-color-logger";

// Enable suppression globally
configureLogSuppression({
  enabled: true,
  timeout: 1000, // Logs within 1s are considered duplicates
  showCounter: true, // Show repeat counter
});

// Or use methods
LOG.enableSuppression();
LOG.disableSuppression();

// Usage with suppression
LOG.debug("Ping", "green", false); // Suppress if repeated within timeout
LOG.info("Status", true); // Second param as boolean = force flag
LOG.error("Error!", "red", true); // Force output (ignore suppression)

// View statistics
console.log(LOG.getSuppressionStats());

// Reset history
LOG.resetSuppression();
```

### String Formatting

```javascript
// Using pipe syntax
LOG.custom("|c.red.Red text| |s.bold.Bold text| |i.up.Superscript|");

// Custom separators
LOG.custom("-c/red/Red text-", { separators: { command: "-", param: "/" } });
```

### Object Formatting

```javascript
// Complex formatting
LOG.custom("Important message", {
  all: { color: "yellow", style: "bold" },
  currents: [
    { target: "Important", color: "red", style: ["underline", "italic"] },
  ],
  notes: [{ target: "message", index: [0, 1], reg: "up" }],
});
```

## API Reference

### Basic Methods

- LOG.debug(text, color = "blue", force = false) - Debug output (blue by default)
- LOG.info(text, color = null, force = false) - Info output
- LOG.warn(text, color = "yellow", force = false) - Warning output (yellow)
- LOG.error(text, color = "red", force = false) - Error output (red)
- LOG.print(text, color, force = false) - Custom colored output
- LOG.custom(text, options, force = false) - Advanced formatting

### Suppression Control Methods

- configureLogSuppression(config) - Configure suppression settings
- LOG.enableSuppression() - Enable duplicate suppression
- LOG.disableSuppression() - Disable duplicate suppression
- LOG.resetSuppression() - Clear suppression history
- LOG.getSuppressionStats() - Get suppression statistics

### Supported Colors

- **Named:** red, green, blue, yellow, magenta, cyan, white, black
- **HEX:** #ff0000, #f00
- **RGB:** 255,0,0, 255-0-0, 255.0.0

### Formatting Syntax

#### String Commands

- |c.color.Text| - Color
- |s.style.Text| - Style
- |i.up/down.Text| - Superscript/subscript
- |c.bg_color.Text| - Background color
- |c.color+.Text| - Bright color

#### Object Formatting Options

```javascript
{
  all: { color: 'color', style: 'style' },           // Global styles
  currents: [                                        // Targeted styles
    { target: 'text', color: 'color', style: 'style' }
  ],
  notes: [                                           // Character modifications
    { target: 'text', index: [0,1], reg: 'up/down' }
  ],
  separators: { command: '|', param: '.' }           // Custom separators
}
```
