<!--
Copyright (c) 2024 anabrid GmbH
Contact: https://www.anabrid.com/licensing/
SPDX-License-Identifier: MIT OR GPL-2.0-or-later
-->
<script>
   import {fade} from 'svelte/transition'

   import ClientDefaults from '@/lib/client_defaults';
   import About, { info_modal_open } from "@/lib/About.svelte"

   import devnote from "@/help-messages/devnote.html?raw"
   import starting from "@/help-messages/getting-started.html?raw"

   const topics = [
      {
        slug: "starting",
        title: "Getting started",
        content: starting,
      },
      {
        slug: "devenote",
        title: "GUI: First usage",
        content: devnote,
        uses_bulma: true
      },
      {
        slug: "code-readme",
        title: "GUI: General overview",
        // we access a global string variable prepared by vite.config.js.
        content: vite_replaced.textfiles.README_HTML,
        uses_bulma: false
      }
    ]

    export let topic_slug = "starting" // default

    // FIXME: The menu does not yet properly work, i.e. the class:is-active
    //        is not reactive. TODO Solve by using svelte-spa-router routes.

    let topic = topics[0] // default
    const topicBySlug = (slug) => topics.find(t => t.slug==slug) || { title:"Not Found", content:"Not found" }
    const set = (slug) => topic = topicBySlug(slug)
</script>

<main in:fade="{{duration: 100}}" class="container is-fullhd" style="margin-top: 1.5rem">
    <div class="columns">
        <div class="column is-one-quarter">
            <aside class="menu">
                <p class="menu-label">
                    Help topics
                </p>
                <ul class="menu-list">
                    {#each topics as t}
                    <li><a on:click={()=>set(t.slug)} class:is-active={topic_slug==t.slug}>{t.title}</a></li>
                    {/each}
                </ul>
            </aside>
        </div>

        <div class="column">
            <article class="box" class:content={!topic.uses_bulma}>
              {@html topic.content}
            </article>
        </div>
    </div>
</main>