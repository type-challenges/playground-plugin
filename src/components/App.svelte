<script lang="ts">
  import Description from './Description.svelte'
  import TypeHelper from './TypeHelper.svelte'
  import type { Context } from '../types'

  export let context: Context

  let active = 'desc'
  let tabs: { name: string; text: string }[] = [
    { name: 'desc', text: 'Description' },
    { name: 'comments', text: 'Comments' },
    { name: 'solutions', text: 'Solutions' },
    { name: 'types', text: 'Type Helper' },
  ]
</script>

<style>
  :global(#type-challenges) {
    margin: 0 -0.7rem;
    width: calc(100% + 1.4rem) !important;
    max-width: unset !important;
  }
  :global(#type-challenges pre) {
    margin-bottom: 1em;
  }

  .hide {
    display: none;
  }

  :root {
    --border-color: rgba(125, 125, 125, 0.4);;
  }

  nav {
    display: flex;
  }

  nav button {
    background: transparent;
    outline: none;
    color: inherit;
    padding: 10px 5px 11px 5px;
    font-size: 14px;
    width: 120px;
    border: 1px solid var(--border-color);
    transition: background .2s ease-in-out;
  }

  nav button:not(:first-child) {
    border-left: none;
  }

  nav button:hover {
    background: rgba(125, 125, 125, 0.05);
  }

  nav button.active {
    font-weight: bold;
    border-bottom-color: transparent;
  }

  nav .flex-auto {
    flex: 1 1 auto;
    border-bottom: 1px solid var(--border-color);
  }

  .panel {
    padding: 0 1rem;
    position: relative;
  }

  .footer {
    margin-top: 5em;
    text-align: center;
  }

  .logo {
    opacity: 0.25;
    transition: opacity .5s ease-in-out;
  }

  .logo:hover {
    opacity: 0.5;
  }
</style>

<nav>
  {#each tabs as { name, text } (name)}
    <button
      role="tab"
      class:active={active === name}
      on:click={() => (active = name)}>
      {text}
    </button>
  {/each}
  <div class="flex-auto"/>
</nav>

<div class="panel">
  <!-- We don't use `if` directive here because of keeping components alive. -->
  <div class:hide={active !== 'desc'}>
    <Description {context} />
  </div>
  <div class:hide={active !== 'helper'}>
    <TypeHelper {context} />
  </div>
</div>
<!-- 
<div class="footer">
  <a class="logo" target="_blank" href="https://github.com/type-challenges/type-challenges">
    <img src="https://raw.githubusercontent.com/type-challenges/type-challenges/master/screenshots/logo-dark.png" height="60" alt="Logo">
  </a>
</div> -->
