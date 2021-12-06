import type { PlaygroundPlugin, PluginUtils } from "./vendor/playground";
import { VirtualTypeScriptEnvironment } from "./vendor/typescript-vfs";
import { log } from "./logger";
import App from "./components/App.svelte";
import { prepareTSVfs } from "./typeHelpers";
import { Context } from "./types";

export default function (utils: PluginUtils) {
  let vfs: VirtualTypeScriptEnvironment;

  const customPlugin: PlaygroundPlugin = {
    id: "type-challenges",
    displayName: "Type Challenges",
    didMount: async (sandbox, container) => {
      log("DidMount type-challenges plugin");
      container.id = "type-challenges";
      vfs = await prepareTSVfs(sandbox);

      const context: Context = { sandbox, vfs };
      new App({ target: container, props: { context } });
    },

    modelChangedDebounce: (sandbox) => {
      log("modelChangedDebounce in type-challenges");

      vfs?.updateFile(sandbox.filepath, sandbox.getText());
      window.dispatchEvent(new CustomEvent("codeChanged"));
    },

    didUnmount: () => {
      log("De-focusing plugin");
    },
  };

  return customPlugin;
}
