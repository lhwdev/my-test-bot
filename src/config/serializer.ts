import ConfigSource from './source'

export default abstract class ConfigSerializer {
  abstract hydrate(source: ConfigSource): Promise<any>

  abstract watch(source: ConfigSource): AsyncIterable<void>
}
