<script lang="ts">
  import Description from "./Description.svelte";
  import TypeHelper from "./TypeHelper.svelte";
  import Challenges from "./Challenges.svelte";
  import type { Context } from "../types";
  import { onMount } from "svelte";
  import { locale } from "../stores";
  export let context: Context;

  const tab2Panel = {
    desc: Description,
    helper: TypeHelper,
    challenges: Challenges,
  };
  type TabPanelKey = keyof typeof tab2Panel;
  interface IValidTab {
    name: TabPanelKey;
    text: string;
  }
  function isValidTab(tab: { name: string; text: string }): tab is IValidTab {
    return tab.name in tab2Panel;
  }
  const tabs = [
    { name: "challenges", text: "Challenges" },
    { name: "desc", text: "Description" },
    { name: "comments", text: "Comments" },
    { name: "solutions", text: "Solutions" },
    { name: "helper", text: "Type Helper" },
  ].filter<IValidTab>(isValidTab);

  let active: TabPanelKey = "challenges";
  let currentQuiz: number = NaN;
  let quizList: number[] = [];
  onMount(() => {
    const { sandbox } = context;
    const sandboxText = sandbox.getText();
    const matchLocale = sandboxText.match(
      /\/\/tsch\.js\.org\/(\d+)?(?:\/([\w-]+)|)/
    );

    if (matchLocale) {
      const [, quizNo, lang = ""] = matchLocale;
      locale.set(lang);
      if (!isNaN(+quizNo)) {
        gotoQuestion(+quizNo);
      }
    }
  });

  function gotoQuestion(quizNo: number) {
    active = "desc";
    currentQuiz = quizNo;
  }

  function setQuizList(list: number[]) {
    quizList = [...list];
  }

  function gotoNextQuestion(quizNo: number) {
    const index = quizList.indexOf(quizNo);

    if (index > -1 && index + 1 < quizList.length) {
      gotoQuestion(quizList[index + 1]);
    }
  }
</script>

<div class="tab-container">
  <nav>
    {#each tabs as { name, text } (name)}
      <button
        role="tab"
        class:active={active === name}
        on:click={() => (active = name)}
      >
        {text}
      </button>
    {/each}
    <div class="flex-auto" />
  </nav>
  <div class="panel">
    <!-- We don't use `if` directive here because of keeping components alive. -->
    <div class:hide={active !== "challenges"} class="inner">
      <Challenges
        {context}
        toQuestion={gotoQuestion}
        updateQuizList={setQuizList}
      />
    </div>
    <div class:hide={active !== "desc"} class="inner">
      <Description {context} quiz={currentQuiz} toNext={gotoNextQuestion} />
    </div>
    <div class:hide={active !== "helper"} class="inner">
      <TypeHelper {context} />
    </div>
  </div>
</div>

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
    --border-color: rgba(125, 125, 125, 0.4);
  }

  .tab-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
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
    transition: background 0.2s ease-in-out;
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
    flex: 1;
    overflow: hidden;
  }

  .panel .inner {
    height: 100%;
    overflow-y: auto;
    margin-right: -1rem;
    padding-right: 1rem;
    overflow-x: hidden;
  }

  .footer {
    margin-top: 5em;
    text-align: center;
  }

  .logo {
    opacity: 0.25;
    transition: opacity 0.5s ease-in-out;
  }

  .logo:hover {
    opacity: 0.5;
  }
</style>
