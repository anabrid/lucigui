<script>
   import {fade} from 'svelte/transition'
</script>

<main in:fade="{{duration: 100}}">
    <h2>Lucidac: Getting started</h2>
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
            <li>Julia: <em>REDACProtocol.jl</em>, <em>AnabridREDAC.jl</em>></li>
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


    
</main>