import { readFile, writeFile } from 'fs/promises'
import watch from 'node-watch'

type ConfigSource = {
  read(): Promise<string>
  write(content: string): Promise<void>
  watch(): AsyncIterable<0>
}


export default ConfigSource


export function configSourceFile(path: string): ConfigSource {
  return {
    async read() {
      return await readFile(path, 'utf-8')
    },
    async write(content: string) {
      await writeFile(path, content, 'utf-8')
    },
    async *watch() {
      let stack = 0
      let resolve: (p: 0) => void
      let promise = new Promise(r => resolve = r)
      let done = false

      const watcher = watch(path/* , { recursive: true } */) // not a directory
      watcher.on('change', () => {
        stack++
        resolve(0)
        promise = new Promise(r => resolve = r)
      })

      while(!done) {
        await promise
        for(let i = 0; i < stack; i++) {
          yield 0
        }
        stack = 0
      }

    }
  }
}
