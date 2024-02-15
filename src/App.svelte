<script>
  import Router, {link, querystring} from 'svelte-spa-router'
  import active from 'svelte-spa-router/active'

  import Home from './routes/Home.svelte'
  import Starting from './routes/Starting.svelte'
  import Demo from './routes/Demo.svelte'

  const routes = {
    '/': Home,
    '/starting': Starting,
    '/demo': Demo
  }
</script>

<nav>
  <a href="/" use:link use:active>Home</a> |
  <a href="/starting" use:link use:active>Starting</a> |
  <a href="/demo" use:link use:active>Demo</a>
</nav>

<section>
  <Router {routes}/>
</section>
