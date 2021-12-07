<script lang="ts">
  import { afterUpdate, onMount } from "svelte";
  import { fetchQuestion } from "../fetch";
  import type { Context } from "../types";
  import type { editor } from "monaco-editor";
  import { locale } from "../stores";
  import { markdownToHtml } from "../markdown";
  import { findNearlyAnchorElement } from "../dom";

  export let context: Context;
  export let quiz: number;
  export let toNext: (quiz: number) => void;

  let root: HTMLElement;
  let markers: editor.IMarker[] = [];
  let playgroundUrl: string = "";
  let frame: HTMLIFrameElement;
  let loadPromise: Promise<string>;
  let isMarkerLoaded = false;
  $: isPassed = isMarkerLoaded && markers.length === 0;

  onMount(() => {
    loadPromise = onSwitchQuestion(quiz, $locale);
  });

  $: if (quiz) {
    loadPromise = onSwitchQuestion(quiz, $locale);
  }

  async function onSwitchQuestion(quiz: number, locale: string) {
    if (!isNaN(quiz)) {
      const { readme, playUrl } = await fetchQuestion(quiz, locale);
      if (playUrl) {
        isMarkerLoaded = false;
        playgroundUrl = playUrl;
        setTimeout(() => {
          isMarkerLoaded = true;
        }, 2000);
        return await markdownToHtml(readme, context.sandbox);
      }
    }
    return "";
  }

  context.sandbox.editor.onDidChangeModelDecorations(() => {
    markers = context.sandbox.monaco.editor
      .getModelMarkers({
        resource: context.sandbox.getModel().uri,
      })
      .filter(
        ({ severity }) =>
          severity === context.sandbox.monaco.MarkerSeverity.Error
      );
  });

  function handleClick(e: MouseEvent) {
    let anchorElement = findNearlyAnchorElement(e.target, root);
    if (anchorElement) {
      e.stopPropagation();
      e.preventDefault();

      const url = anchorElement.getAttribute("href");

      if (url) {
        const isRelativeUrl =
          new URL("https://tsch.js.org").origin ===
          new URL(url, "https://tsch.js.org").origin;

        if (!isRelativeUrl) {
          if (/https:\/\/tsch\.js\.org\/\d+\/play/.test(url)) {
            document.location = url;
          } else {
            window.open(url);
          }
          return;
        }

        const localeMatch = url.match(/^\.\/README(?:\.([\w-]+))?.md$/);
        if (localeMatch) {
          locale.set(localeMatch[1] ?? "");
          return;
        }
      }
    }
  }

  function doVisitSolutions() {
    window.open(`https://tsch.js.org/${quiz}/solutions`);
  }
  async function doShareAnswer() {
    const codeMatch = context.sandbox
      .getText()
      .match(
        /(?:\/\*\s_+\sここにコードを記入\s_+\s\*\/(.+)\/\*\s_+\sテストケース\s_+\s\*\/)|(?:\/\*\s_+\s你的代码\s_+\s\*\/(.+)\/\*\s_+\s测试用例\s_+\s\*\/)|(?:\/\*\s_+\sYour Code Here\s_+\s\*\/(.+)\/\*\s_+\sTest Cases\s_+\s\*\/)/s
      );

    const code = codeMatch ? codeMatch[1] ?? codeMatch[2] ?? codeMatch[3] : "";
    const text = code.trim();

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/plain": Promise.resolve(
            new Blob([text], { type: "text/plain" })
          ),
        }),
      ]);
    }
    window.open(`https://tsch.js.org/${quiz}/answer/${$locale}`);
  }
  function doNextQuestion() {
    toNext(quiz);
  }
  function onPlaygourndLoaded() {
    const redirectedUrl = frame.contentWindow?.location.href;

    if (redirectedUrl?.startsWith("https://www.typescriptlang.org/play")) {
      const realURL = new URL(redirectedUrl);
      if (realURL.search !== document.location.search) {
        document.location = redirectedUrl;
      } else {
        const code = realURL.hash.replace("#code/", "").trim();
        const userCode =
          // @ts-ignore
          context.sandbox?.lzstring?.decompressFromEncodedURIComponent(code);
        context.sandbox.setText(userCode);
        document.location.hash = `#code/${code}`;
      }
    }
  }
</script>

<iframe
  src={playgroundUrl}
  frameborder="0"
  class:hide={true}
  bind:this={frame}
  on:load={onPlaygourndLoaded}
  title="preload"
/>
{#await loadPromise}
  <div class="loading">
    <p>Loading question...</p>
  </div>
{:then content}
  {#if content === ""}
    <p>No question found.</p>
  {:else}
    <div on:click={handleClick} bind:this={root}>
      {@html content}
    </div>
    {#if isMarkerLoaded}
      <div class="status" class:passed={isPassed}>
        {#each markers as marker}
          <div class="message">
            ❌ Line{" "}
            {marker.startLineNumber}:
            <span>{marker.message}</span>
          </div>
        {:else}🎉 Yay! You have finished this challenge.{/each}
      </div>
    {/if}
    <div class="actions">
      <button class="secondary" on:click={doVisitSolutions}>Solutions</button>
      {#if isPassed}
        <button class="secondary" on:click={doShareAnswer}>Share Answer</button>
      {/if}
      <button class="primary" on:click={doNextQuestion}>Next Challenge</button>
    </div>
  {/if}
{:catch error}
  <p>fetch question with error: {error.message}</p>
{/await}

<style>
  p > :global(code) {
    background: rgba(125, 125, 125, 0.2);
    padding: 2px 4px;
    border-radius: 4px;
  }

  :global(blockquote) {
    margin: 0;
    padding: 0;
    opacity: 0.8;
    font-style: italic;
  }

  .hide {
    display: none;
  }

  .loading {
    display: grid;
    place-items: center;
    font-size: 15px;
  }

  .status {
    margin-top: 10px;
    padding: 0.6rem 1rem;
    border: 1px solid #f5c6cb;
    border-radius: 0.25rem;
    color: #721c24;
    background-color: #f8d7da;
  }
  .status.passed {
    color: #155724;
    background-color: #d4edda;
    border-color: #c3e6cb;
  }

  .message:not(:last-child) {
    margin-bottom: 3px;
  }
  .message span {
    margin-left: 5px;
  }

  .actions {
    display: flex;
    margin-top: 10px;
    justify-content: space-between;
  }
  .actions button {
    cursor: pointer;
    outline: none;
    padding: 10px 24px;
    font-size: 14px;
    border: 1px solid;
    opacity: 0.94;
    transition: opacity ease-in-out 0.2s;
  }

  .actions button:hover {
    opacity: 1;
  }

  button.primary {
    background-color: #3178c6;
    color: #fff;
    border-color: transparent;
    margin-left: auto;
  }

  button.secondary {
    background: transparent;
    color: inherit;
    border-color: var(--border-color);
    margin-right: 8px;
  }

  .copy {
    width: 0;
    height: 0;
    border: 0;
    padding: 0;
    margin: 0;
    opacity: 0;
    z-index: -1;
  }
</style>
