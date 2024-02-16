<script>
  import Router, {link, querystring} from 'svelte-spa-router'
  import active from 'svelte-spa-router/active'

  import Status from './lib/Status.svelte'

  import Home from './routes/Home.svelte'
  import Starting from './routes/Starting.svelte'
  import Demo from './routes/Demo.svelte'
  import Connectome from './routes/Connectome.svelte'

  const routes = {
    '/': Home,
    '/starting': Starting,
    '/demo': Demo,
    '/connectome': Connectome
  }

  // treat document title at navigation
  function routeLoaded(event) {
    if("title" in event.detail.component) {
      document.title = event.detail.component.title
    } else {
      document.title = "reasonable default"
    }
  }
</script>

<nav>
  <a href="/" use:link use:active>Home</a> |
  <a href="/starting" use:link use:active>Starting</a> |
  <a href="/demo" use:link use:active>Demo</a> | 
  <a href="/connectome" use:link use:active>Connectome</a>
</nav>

<section>
  <Router {routes}
    on:routeLoaded={routeLoaded}/>
</section>
