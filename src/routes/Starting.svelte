<!--
Copyright (c) 2024 anabrid GmbH
Contact: https://www.anabrid.com/licensing/
SPDX-License-Identifier: MIT OR GPL-2.0-or-later
-->
<script>
   import {fade} from 'svelte/transition'

   import { globals } from '@/lib/utils';
   import About, { info_modal_open } from "@/lib/About.svelte"

</script>

<main in:fade="{{duration: 100}}">

    <div class="tile is-ancestor">
        <div class="tile is-parent is-horizontal">
          <div class="tile is-child box">
            <h2 class="title">Lucidac: Getting started</h2>
            <div class="content">
            <p>LUCIDAC is the world's first discrete fully configurable analog computer made
                by <a href="https://anabrid.com">anabrid</a>.
                Head over to the <b>LUCIDAC documentation</b> for understanding how to use the
                device.
            
            <p>Harness the real power of your LUCIDAC by making use of the client libraries
            for various programming languages as well as the command line interfaces.
            We offer client libraries for
            <ul>
                    <li>Python, extensive reference implementation: <em>pybrid</em></li>
                    <li>Minimal Python: <em>shcpy</em></li>
                    <li>Julia: <em>REDACProtocol.jl</em>, <em>AnabridREDAC.jl</em></li>
                    <li>C++: <em>tcredac</em>, <em>lucism</em>, etc. </li>
                    <li>Typescript/Javascript/ECMAScript: <em>HybridController.ts</em></li>
                </ul>
                <p>Access is possible over various ways:
                <ul>
                    <li>TCP/IP JSON-Lines protocol, also accessible with <em>netcat</em></li>
                    <li>HTTP JSON-RCP kind-of protocol, also accessible with <em>curl</em></li>
                    <li>USB-C Serial console speaking the JSON-Lines protocol (Fallback admin interface)</li>
            </ul>
            <p>The strongly typed JSON-lines based protocol makes it easy to write a third
                party custom client in a different programming language.
            
            <p>All LUCIDAC Software is Open Source. You can explore the programming of the
            Microcontroller unit (MCU) which is called the <em>HybridController</em>.
            The documentation is online at...
            </p>
            </div>
        </div>

        <div class="tile is-child box">
            <h2 class="title">On using this app</h2>
            <h3 class="subtitle">Readme for first time users</h3>
            <div class="content">
            <p>Please note that this application is in early development (you are in fact
                using version {globals.application_name_and_version}). You are very much invited
                to test out what is already possible and report problems, expectations, inconsistencies
                bugs, etc in form of a <a href="https://lab.analogparadigm.com/lucidac/software/lucidac-gui/-/issues/new">new ticket</a>
                on our <a href="https://lab.analogparadigm.com/lucidac/software/lucidac-gui/-/issues">bug tracker</a>.
                You can also submit a
                <a href="mailto:gitlab+lucidac-software-lucidac-gui-257-d1ykn0opqs6ae6xzq8v71ibwa-issue@anabrid.dev">new ticket by mail</a>.
            </p>
            <p>
                To simplify user reports even further, we use the
                Application Perfromance Monitoring & Error Tracking Software
                <a href="https://sentry.io/">sentry</a>. This allows you to report a bug
                even easier by clicking the <em>report a bug</em> button in the lower right,
                which will automatically also include a screenshot and internal debugging details.
                A few comments about sentry:
            </p>
            <ul>
                <li>Sentry may be blocked by your adblocker because it can also be used for tracking users (which we don't do).
                    Consider disabling your adblocker for this page.</li>
                <li>Sentry is known not to work too well with Firefox (it silently ignores your bug reports).
                    Consider using Chrome or similar browsers (Edge, Safari).
                </li>
                <li>We will provide an opt-in/opt-out for sentry performance monitoring in the future to comply with
                    GDPR. Currently the software is in development. We probably also will get rid of sentry in favour
                    of another solution.
                </li>
            </ul>
            <p>This application is open source. The code is hosted at
                <a href="https://lab.analogparadigm.com/lucidac/software/lucidac-gui">gitlab: lucidac/software/lucidac-gui</a>.
                You may also consider to have a look at the <a on:click={info_modal_open.toggle}>project README file</a> for further details.
                The project was initiated by Sven in Feb/March 2024.
            </p>
            </div>
        </div>
    </div>
    
</main>