<!--
Copyright (c) 2024 anabrid GmbH
Contact: https://www.anabrid.com/licensing/
SPDX-License-Identifier: MIT OR GPL-2.0-or-later
-->
<script lang="ts">
   import {fade} from 'svelte/transition'
   import { link, querystring } from "svelte-spa-router";

   import devnote from "./topics/devnote.html?raw"
   import starting from "./topics/getting-started.html?raw"
   import Canonical from "./topics/canonical.svelte"

   const topics = [
      {
        label: "Help topics",
        list: [
          {
            slug: "starting",
            title: "Getting started",
            content: starting,
          },
        ]
      },
      {
        label: "LUCIDAC-GUI",
        list: [
          {
            slug: "devenote",
            title: "First usage",
            content: devnote,
            uses_bulma: true
          },
          {
            slug: "code-readme",
            title: "Overview",
            // we access a global string variable prepared by vite.config.js.
            content: vite_replaced.textfiles.README_HTML,
            uses_bulma: false
          },
          {
            slug: "changelog",
            title: "Changelog",
            content: vite_replaced.textfiles.CHANGELOG_HTML,
            uses_bulma: false
          },
          {
            slug: "canonical",
            title: "Hosted versions",
            component: Canonical,
            uses_bulma: true
          }
        ]
      }
    ]

    export let params = {} // set by svelte-spa-router route "#/help/:slug"
    export let topic : string
    $: topic = ("topic" in params) ? params["topic"] : "starting"

    const topicBySlug = (slug) => topics.flatMap(s=>s.list).find(t => t.slug==slug) || { title:"Not Found", content: `<h1>Not found</h1><p>Help topic <em>${slug}</em> not found</p>` }

    let context = typeof topics[0]
    $: context = topicBySlug(topic)

</script>

<main in:fade class="container is-fullhd" style="margin-top: 1.5rem">
    <div class="columns">
        <div class="column is-one-quarter">
            <aside class="menu">
                {#each topics as sec}
                  <p class="menu-label">{sec.label}</p>
                  <ul class="menu-list">
                      {#each sec.list as t}
                      <!-- this works without svelte-spa-router:  on:click={()=>topic = t.slug}  -->
                      <li><a use:link={"/help/" + t.slug} class:is-active={topic==t.slug}>{t.title}</a></li>
                      {/each}
                  </ul>
                {/each}
            </aside>
        </div>

        <div class="column">
            <article class="box" class:content={!context.uses_bulma}>
              {#if "content" in context}
              {@html context.content}
              {:else}
              <svelte:component this={context.component} />
              {/if}
            </article>
        </div>
    </div>
</main>