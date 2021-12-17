import ConfigSource from './source'


export default abstract class ConfigHandler {
  abstract get source(): ConfigSource

  abstract serialize(value: any): void
  abstract deserialize(origin: 'hotReload'): void

  abstract update(path: string, value: any): void
  abstract delete(path: string): void
}
