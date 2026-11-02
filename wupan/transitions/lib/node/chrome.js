'use strict';
const fs = require('fs');
const path = require('path');

// Fixed, isolated profiles avoid repeated blank-password probes on Windows.
async function launchChrome(name, opts = {}) {
  const { chromium } = require('playwright-core');
  const profile = path.resolve(opts.profileDir || path.join(__dirname, '../../tmp/chrome', name));
  fs.mkdirSync(profile, { recursive: true });
  const statePath = path.join(profile, 'Local State');
  const state = fs.existsSync(statePath) ? JSON.parse(fs.readFileSync(statePath, 'utf8')) : {};
  state.password_manager = Object.assign({}, state.password_manager, {
    os_password_blank: false, os_password_last_changed: '13401089371798986'
  });
  fs.writeFileSync(statePath, JSON.stringify(state));
  const exe = opts.executablePath || process.env.SHANHE_CHROME;
  return chromium.launchPersistentContext(profile, {
    headless: true, args: opts.args || [],
    ...(exe ? { executablePath: exe } : { channel: opts.channel || 'chrome' })
  });
}
module.exports = { launchChrome };
