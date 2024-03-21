// Copyright (c) 2024 anabrid GmbH
// Contact: https://www.anabrid.com/licensing/
// SPDX-License-Identifier: MIT OR GPL-2.0-or-later

import './app.scss'
import App from './App.svelte'

var splashscreen = document.getElementById("app-splashscreen")
if(splashscreen) splashscreen.remove()

try {
  const app = new App({
    target: document.getElementById('app'),
    props: {
      // pass global variable defined in index.html
      client_defaults: window.client_defaults
    }
  })
} catch(e) {
  console.error("Crash: ", e)
  var errorPanel = document.createElement("div")
  errorPanel.classList.add("notification")
  errorPanel.classList.add("danger")
  errorPanel.innerHTML = `<strong>Application crashed</strong> The application crashed with this error message: ${e}. The only way to recover is to reload the whole page.`
  document.body.insertBefore(errorPanel, document.body.firstChild)
}

export default app
