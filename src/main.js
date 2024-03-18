// Copyright (c) 2024 anabrid GmbH
// Contact: https://www.anabrid.com/licensing/
// SPDX-License-Identifier: MIT OR GPL-2.0-or-later

import './app.scss'
import App from './App.svelte'

var splashscreen = document.getElementById("app-splashscreen")
if(splashscreen) splashscreen.remove()

const app = new App({
  target: document.getElementById('app'),
})

export default app
