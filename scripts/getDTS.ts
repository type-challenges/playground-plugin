// Grab the DTS files from the TypeScript website
// then do a bit of string manipulation in order to make it
// compile without _all_ of the dependencies

import { promises as fs, constants as fsConsts } from 'fs'
import * as path from 'path'
import fetch from 'node-fetch'

function download(url: string): Promise<string> {
  return fetch(url).then((r) => r.text())
}

function saveFile(dest: string, content: string): Promise<void> {
  return fs.writeFile(path.join(__dirname, '..', dest), content, 'utf8')
}

async function isNotExists(path: string): Promise<boolean> {
  try {
    await fs.access(path, fsConsts.F_OK)
    return false
  } catch {
    return true
  }
}

;(async () => {
  const vendor = path.join('src', 'vendor')
  const ds = path.join(vendor, 'ds')

  if (await isNotExists(ds)) {
    await fs.mkdir(ds, { recursive: true })
  }

  const host = 'https://www.staging-typescript.org'
  // For playground-dev purposes
  // const host = 'http://localhost:8000'

  /** The API for the monaco typescript worker. */
  async function getTSWorker() {
    const text = await download(`${host}/js/sandbox/tsWorker.d.ts`)
    return saveFile(path.join(vendor, 'tsWorker.d.ts'), text)
  }

  async function getDesignSystemDts() {
    const text = await download(
      `${host}/js/playground/ds/createDesignSystem.d.ts`
    )
    return saveFile(
      path.join(ds, 'createDesignSystem.d.ts'),
      text.replace('typescriptlang-org/static/js/sandbox', '../sandbox')
    )
  }

  async function getPluginUtils() {
    const text = await download(`${host}/js/playground/pluginUtils.d.ts`)
    return saveFile(
      path.join(vendor, 'pluginUtils.d.ts'),
      text.replace('from "typescript-sandbox"', 'from "./sandbox"')
    )
  }

  async function getTSVfs() {
    const text = await download(`${host}/js/sandbox/vendor/typescript-vfs.d.ts`)
    return saveFile(
      path.join(vendor, 'typescript-vfs.d.ts'),
      text
        .replace('/// <reference types="lz-string" />', '') // remove import
        .replace('import("lz-string").LZStringStatic', 'any') // remove 'lz-string'
    )
  }

  async function getSandbox() {
    const text = await download(`${host}/js/sandbox/index.d.ts`)
    return saveFile(
      path.join(vendor, 'sandbox.d.ts'),
      text
        .replace('./vendor/typescript-vfs', './typescript-vfs') // replace TS-VFS
        .replace('import lzstring', '// import lzstring') // remove 'lz-string'
        .replace('lzstring: typeof lzstring', '// lzstring: typeof lzstring') // remove 'lz-string'
    )
  }

  async function getPlayground() {
    const text = await download(`${host}/js/playground/index.d.ts`)
    return saveFile(
      path.join(vendor, '/playground.d.ts'),
      text
        .replace(/typescript-sandbox/g, './sandbox') // replace sandbox
        .replace(
          /typescriptlang-org\/static\/js\/sandbox\/vendor\/typescript-vfs/g,
          './typescript-vfs'
        ) // replace TS-VFS
        .replace('lzstring: typeof', '// lzstring: typeof') // remove 'lz-string'
        .replace('getWorkerProcess', '// getWorkerProcess') // remove worker
        .replace('ui:', '// ui:') // remove UI
    )
  }

  return Promise.all([
    getTSWorker(),
    getDesignSystemDts(),
    getPluginUtils(),
    getTSVfs(),
    getSandbox(),
    getPlayground(),
  ])
})()
