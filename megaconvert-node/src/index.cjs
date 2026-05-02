// CJS wrapper for megaconvert
// Use: const { MegaConvert } = require('megaconvert')

let _module;

module.exports = new Proxy({}, {
  get(_, prop) {
    if (!_module) {
      _module = import('./index.js');
    }
    if (prop === 'then') {
      return _module.then.bind(_module);
    }
    return async (...args) => {
      const mod = await _module;
      const target = mod[prop] || mod.default?.[prop];
      if (typeof target === 'function') return target(...args);
      return target;
    };
  }
});

// For direct class access:
// const { MegaConvert } = await import('megaconvert')
