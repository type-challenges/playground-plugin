import type { PlaygroundPlugin, PluginUtils } from './vendor/playground'
import type { Sandbox } from './vendor/sandbox'
import Challenge from './components/Challenge.svelte'
import Types from './components/Types.svelte'

const log = (...args: any) => console.log('%ctype-challenges =>', 'color: teal', ...args)

const tabsDefine = {
  challenge: 'Challenge',
  types: 'Types',
}

const makePlugin = (utils: PluginUtils) => {
  let tabBar: HTMLDivElement
  let tabs: Record<keyof typeof tabsDefine, { name: string; button: HTMLButtonElement; panel: HTMLDivElement }> = {} as any
  let activeTab: keyof typeof tabsDefine = 'challenge'

  let sandbox: Sandbox
  let ds: ReturnType<typeof utils.createDesignSystem>

  const customPlugin: PlaygroundPlugin = {
    id: 'type-challenges',
    displayName: 'Type Challenges',
    didMount: (_sandbox, container) => {
      log('DidMount type-challenges plugin')
      sandbox = _sandbox
      ds = utils.createDesignSystem(container)
      container.id = 'type-challenges'

      tabBar = ds.createTabBar()

      const panels = document.createElement('div')

      ;(Object.entries(tabsDefine) as [keyof typeof tabsDefine, string][]).map(([key, name]) => {
        const button = ds.createTabButton(name)
        const panel = document.createElement('div')

        button.onclick = () => {
          activeTab = key
          Object.values(tabs).forEach((i) => {
            if (i.button === button) {
              i.button.classList.add('active')
              panels.appendChild(i.panel)
            } else {
              i.button.classList.remove('active')
              panels.removeChild(i.panel)
            }
          })
        }
        tabBar.append(button)

        if (key === activeTab) {
          panels.append(panel)
          button.classList.add('active')
        }

        tabs[key] = {
          name,
          button,
          panel,
        }
      })
      container.appendChild(tabBar)
      container.appendChild(panels)

      new Challenge({ target: tabs.challenge.panel, props: { sandbox } })
      new Types({ target: tabs.types.panel, props: { sandbox } })
    },

    modelChangedDebounce: async (_sandbox, model) => {
      log('modelChangedDebounce in type-challenges')
      sandbox = _sandbox

      window.dispatchEvent(new CustomEvent('updateShowTypes'))
    },

    didUnmount: () => {
      log('De-focusing plugin')
    },
  }

  return customPlugin
}

export default makePlugin
