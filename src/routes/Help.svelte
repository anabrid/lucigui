<!--
Copyright (c) 2024 anabrid GmbH
Contact: https://www.anabrid.com/licensing/
SPDX-License-Identifier: MIT OR GPL-2.0-or-later
-->
<script lang="ts">
   import {fade} from 'svelte/transition'
   import { link, querystring } from "svelte-spa-router";

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

    export let params = {} // set by svelte-spa-router route "#/help/:slug"
    export let topic : string
    $: topic = ("topic" in params) ? params["topic"] : "starting"

    const topicBySlug = (slug) => topics.find(t => t.slug==slug) || { title:"Not Found", content: `<h1>Not found</h1><p>Help topic <em>${slug}</em> not found</p>` }

    let context = typeof topics[0]
    $: context = topicBySlug(topic)

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
                    <!-- this works without svelte-spa-router:  on:click={()=>topic = t.slug}  -->
                    <li><a use:link={"/help/" + t.slug} class:is-active={topic==t.slug}>{t.title}</a></li>
                    {/each}
                </ul>
            </aside>
        </div>

        <div class="column">
            <article class="box" class:content={!context.uses_bulma}>
              {@html context.content}
            </article>
        </div>
    </div>
</main>