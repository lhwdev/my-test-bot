import ConfigHandler from './handler'
import ConfigSerializer from './serializer'
import { configSourceFile } from './source'


export const handlerSymbol = Symbol('configHandler')

export type Config = {
  [handlerSymbol]: ConfigHandler,
  [index: string | number]: Config
}


export type ConfigLoadOptions = {
  hot?: boolean
}

export function configHandler(config: Config): ConfigHandler {
  return config[handlerSymbol]
}


export async function loadConfig(path: string, serializer: ConfigSerializer, options: ConfigLoadOptions = {}) {
  const source = configSourceFile(path)
  const config = await serializer.hydrate(source)
  const handler = configHandler(config)

  if(options.hot) {
    const run = async () => {
      for await(const _item of serializer.watch(source)) {
        handler.deserialize('hotReload')
      }
    }
    run()
  }

  return config
}

