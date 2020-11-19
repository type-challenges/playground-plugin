import type { PlaygroundPlugin, PluginUtils } from './vendor/playground'
import App from './components/App.svelte'

const log = (...args: any) => console.log('%ctype-challenges =>', 'color: teal', ...args)

const makePlugin = (utils: PluginUtils) => {
  const customPlugin: PlaygroundPlugin = {
    id: 'type-challenges',
    displayName: 'Type Challenges',
    didMount: (sandbox, container) => {
      log('DidMount type-challenges plugin')
      const ds = utils.createDesignSystem(container)
      container.id = 'type-challenges'

      const tabBar = ds.createTabBar()
      new App({ target: container, props: { tabBar, sandbox } })
    },

    modelChangedDebounce: async () => {
      log('modelChangedDebounce in type-challenges')
      window.dispatchEvent(new CustomEvent('updateShowTypes'))
    },

    didUnmount: () => {
      log('De-focusing plugin')
    },
  }

  return customPlugin
}

export default makePlugin
