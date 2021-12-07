<script lang="ts">
  import { fetchQuestions } from "../fetch";
  import type { Context } from "../types";
  import { locale } from "../stores";
  import { markdownToHtml } from "../markdown";
  import { findNearlyAnchorElement } from "../dom";

  export let context: Context;
  export let toQuestion: (quizNo: number) => void;
  export let updateQuizList: (quizList: number[]) => void;

  let root: HTMLElement;
  let content: string = "";
  $: {
    (async () => {
      content = await markdownToHtml(
        await fetchQuestions($locale),
        context.sandbox
      );

      const quizRegexp =
        /<a[^>]+href=['"]\.\/questions(?:\/([\w\d-]+))?\/README(\.[\w-]+)?\.md['"]/g;
      updateQuizList(
        [...content.matchAll(quizRegexp)].map((m) => parseInt(m?.[1]))
      );
    })();
  }

  const getAbsoluteLink = (url: string): string | null => {
    const repoSite =
      "https://github.com/type-challenges/type-challenges/blob/master/README.md";
    const absoluteURL = new URL(url, repoSite);
    const isRelativeUrl = new URL(repoSite).origin === absoluteURL.origin;
    if (!isRelativeUrl) {
      return url;
    }

    const pathname = absoluteURL.pathname;
    if (/\/README(.[\w-]+)?\.md$/.test(pathname)) {
      return null;
    } else {
      return absoluteURL.toString();
    }
  };

  function handleClick(e: MouseEvent) {
    const anchorElement = findNearlyAnchorElement(e.target, root);
    if (anchorElement) {
      e.stopPropagation();
      e.preventDefault();
      const url = anchorElement.getAttribute("href") ?? "";
      const absoluteUrl = getAbsoluteLink(url);

      if (absoluteUrl) {
        window.open(absoluteUrl);
        return;
      }

      // switch language
      const localeMatch = url.match(/^\.\/README(?:\.([\w-]+))?.md$/);
      if (localeMatch) {
        locale.set(localeMatch[1] ?? "");
        return;
      }
      // pick a question
      const questionMatch = url.match(
        /^\.\/questions(?:\/([\w\d-]+))?\/README(\.[\w-]+)?\.md$/
      );
      if (questionMatch && questionMatch[1]) {
        toQuestion(parseInt(questionMatch[1]));
      }
    }
  }
</script>

<div on:click|stopPropagation={handleClick} bind:this={root}>
  {@html content}
</div>

<style></style>
