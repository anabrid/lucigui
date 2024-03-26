<script lang="ts">
  import { FontAwesomeIcon } from "@fortawesome/svelte-fontawesome";
  import { faUser, faLock } from "@fortawesome/free-solid-svg-icons";
  import { getContext } from "svelte";
  import type { SvelteHybridController } from "@/lucicon/svelte";
  import { HybridController } from "@/lucicon/connection";
  import { slide } from "svelte/transition";

  const hc = getContext("hc") as SvelteHybridController

  let username : string
  let password : string
  let login_process_running = false
  let message : string
  let error_class = ""

  async function login() {
    login_process_running = true
    try {
      const res = await hc.login(username, password)
      console.info("Login success: ", res)
    } catch(e) {
      console.error("Login failed: ", e)
      error_class = ("error_code" in e && e.error_code == HybridController.ERROR_LOGIN_NOT_NECCESSARY) ?
        "is-info" : "is-danger"
      message = ("error" in e) ? e.error : JSON.stringify(e)
    } finally {
      login_process_running = false
    }
  }

</script>

<form on:submit|preventDefault={login}>
<div class="field">
    <p class="control has-icons-left has-icons-right">
      <input class="input" type="text" placeholder="Username" bind:value={username} disabled={login_process_running}>
      <span class="icon is-small is-left">
        <FontAwesomeIcon icon={faUser} />
      </span>
      <span class="icon is-small is-right">
        <i class="fas fa-check"></i>
      </span>
    </p>
  </div>
  <div class="field">
    <p class="control has-icons-left">
      <input class="input" type="password" placeholder="Password" bind:value={password} disabled={login_process_running}>
      <span class="icon is-small is-left">
        <FontAwesomeIcon icon={faLock} />
      </span>
    </p>
  </div>
  <div class="field">
    <p class="control">
      <button class="button is-success" type="submit" disabled={login_process_running}>
        Login
      </button>
    </p>
  </div>
  {#if message}
    <div class="field" transition:slide>
        <div class="notification {error_class}">
            <button class="delete" on:click={() => message=""}></button>
            {message}
        </div>
    </div>
  {/if}
  </form>
