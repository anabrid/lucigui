<script>
  import Router, {link, querystring} from 'svelte-spa-router'
  import active from 'svelte-spa-router/active'

  import { endpoint, endpoint_reachable } from './lib/HybridControllerStore.ts'
  //import SystemAvailability from './lib/SystemAvailability.svelte';

  import Home from './routes/Home.svelte'
  import Starting from './routes/Starting.svelte'
  import Settings from './routes/Settings.svelte'
  import Editor from './routes/Editor.svelte'

  const nav = [ Home, Settings, Editor, Starting ]
  const urls = ["/", "/settings", "/editor", "/starting"]
  const titles = [ "Home", "Settings", "Editor", "Getting Started" ]

  const zip = rows=>rows[0].map((_,c)=>rows.map(row=>row[c]))
  const routes = Object.fromEntries(zip([urls, nav]))
  console.log("routes", routes)

  // treat document title at navigation
  function routeLoaded(event) {
    const route_id = urls.findIndex(e => e == event.detail.route)
    if(route_id == -1) return
    // inserting the device name would also be handy
    document.title = titles[route_id] + " (" + globals.application_name + ")"
  }
</script>

<menu>
  <div class="left side">
    <b>LUCIDAC:</b>
    {$endpoint_reachable}
  </div>
    
  <nav>
    {#each zip([urls, titles]) as [href, title] }
      <a {href} use:link use:active>{title}</a>
    {/each}
  </nav>

  <div class="right side">
    Endpoint: {$endpoint}
    (User)
  </div>
</menu>

<section>
  <Router {routes}
    on:routeLoaded={routeLoaded}/>
</section>

<style type="scss">
  menu { display: flex; flex-direction: row; padding: 0; }
  menu nav { flex-grow: 1; text-align: center; }
  menu nav a:not(:last-child)::after {
    content: " - "
  }
</style>