# ANSI Color Logger

Advanced logging system with ANSI escape sequences support for colored and styled console output.

## Installation

```bash
npm install ansi-js-logger
```

## Quick Start

```javascript
import { LOG } from 'ansi-color-logger';

// Basic usage
LOG.debug('Debug message');
LOG.info('Info message');
LOG.warn('Warning message');
LOG.error('Error message');

// Custom colors
LOG.print('Custom color', 'green');
LOG.print('Hex color', '#ff0000');
LOG.print('RGB color', '255,0,0');
```

## Advanced Features

### String Formatting

```javascript
// Using pipe syntax
LOG.custom('|c.red.Red text| |s.bold.Bold text| |i.up.Superscript|');

// Custom separators
LOG.custom('-c/red/Red text-', { separators: { command: '-', param: '/' } });
```

### Object Formatting

```javascript
// Complex formatting
LOG.custom('Important message', {
    all: { color: 'yellow', style: 'bold' },
    currents: [
        { target: 'Important', color: 'red', style: ['underline', 'italic'] }
    ],
    notes: [
        { target: 'message', index: [0, 1], reg: 'up' }
    ]
});
```

## API Reference

### Basic Methods

* LOG.debug(text, color)
* LOG.info(text, color)
* LOG.warn(text, color)
* LOG.error(text, color)
* LOG.print(text, color)
* LOG.custom(text, options)

### Supported Colors

* **Named:** red, green, blue, yellow, magenta, cyan, white, black
* **HEX:** #ff0000, #f00
* **RGB:** 255,0,0, 255-0-0, 255.0.0

### Supported Styles

* bold, 
* dim, 
* italic, 
* underline, 
* blink
* inverse, 
* hidden, 
* strikethrough

