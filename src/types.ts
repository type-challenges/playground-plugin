import { Sandbox } from "./vendor/sandbox";
import { VirtualTypeScriptEnvironment } from "./vendor/typescript-vfs";

export interface Context {
  sandbox: Sandbox,
  vfs: VirtualTypeScriptEnvironment
}
