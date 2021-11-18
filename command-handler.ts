import { Client, Message } from 'discord.js'
import config from './config'
import yaml from 'yaml'
import fs, { realpath } from 'fs'
import watch from 'node-watch'
import chalk from 'chalk'
import { logError } from './log'
import { inspect } from 'util'
import CommandParameter, { BotCommandError } from './command-parameter'
import { Command, CommandItem } from './command'
import Fuse from 'fuse.js'
import Hangul from 'hangul-js'


const sCommandsPath = './commands'
const sCommandsYaml = sCommandsPath + '/commands.yml'

type CommandMetadata = {
  jsName: string,
  name: string,
  prefix: string,
  aliasTo?: string,
  preload: boolean
}

type CommandFileMetadata = {
  jsName: string,
  prefix: string,
  mainName: string,
  preload: boolean
}

type LoadedCommandFile = {
  meta: CommandFileMetadata,
  exports: any,
  command: Command
}

type CommandInfo = {
  meta: CommandMetadata,
  loaded: LoadedCommandFile
}


let commands = yaml.parse(fs.readFileSync(sCommandsYaml, 'utf-8'))
let commandMapCache: Record<string, Record<string, CommandMetadata>> // prefix -> name -> jsName
let commandInversedCache: Record<string, Record<string, CommandMetadata[]>> // prefix -> jsName -> name
let allCommands: string[]
let allCommandInfos: CommandMetadata[]
let preloads: CommandMetadata[]


const commandSearchFuse: Fuse<string> = new Fuse([])

export const interceptors: Record<string, (handler: CommandHandler, message: Message) => boolean> = {}


function createCommandMapCache() {
  function putArray<K extends string | number | symbol, V>(to: Record<K, V[]>, key: K, value: V) {
    const last = to[key]
    if(last == null) {
      to[key] = [value]
    } else {
      to[key].push(value)
    }
  }

  try {
    const cache: Record<string, Record<string, CommandMetadata>> = {}
    const cacheInversed: Record<string, Record<string, CommandMetadata[]>> = {}
    const all: string[] = []
    const allInfos: CommandMetadata[] = []
    const map = commands.commands
    preloads = []

    for(const prefix of Object.keys(map)) {
      const prefixData = map[prefix]
      const prefixMap: Record<string, CommandMetadata> = {}
      const prefixInversedMap: Record<string, CommandMetadata[]> = {}

      for(const jsFileName of Object.keys(prefixData)) {
        const names = prefixData[jsFileName]
        for(const name of names) {
          if(typeof name == 'string') { // 1. - name
          
            // original (only)
            const meta = { jsName: jsFileName, prefix, name, preload: false }
            
            if(name == '$preload') {
              preloads.push({ ...meta, preload: true })
              continue
            }
            prefixMap[name] = meta
            putArray(prefixInversedMap, jsFileName, meta)
            all.push(prefix + name)
            allInfos.push(meta)
          } else { // 2. - name: [alias1, alias2, alias3, ...]
            const originalNames = Object.keys(name)
            if(originalNames.length != 1) throw Error('what?') // TODO: options here
            const originalName = originalNames[0]
            const aliases = name[originalName]
            
            // original
            const meta = { jsName: jsFileName, prefix, name: originalName, preload: false }
            prefixMap[originalName] = meta
            putArray(prefixInversedMap, jsFileName, meta)
            allInfos.push(meta)

            for(const alias of aliases) {
              const aliasMeta = { jsName: jsFileName, prefix, name: alias, aliasTo: originalName, preload: false }
              prefixMap[alias] = aliasMeta
              putArray(prefixInversedMap, jsFileName, aliasMeta)
              all.push(prefix + alias)
              allInfos.push(aliasMeta)
            }
          }
        }

      }

      cache[prefix] = prefixMap
      cacheInversed[prefix] = prefixInversedMap
    }
    commandMapCache = cache
    commandInversedCache = cacheInversed
    allCommands = all
    allCommandInfos = allInfos
    commandSearchFuse.setCollection(allCommands.map(command => Hangul.disassemble(command).join('')))

  } catch(e) {
    logError(e, 'createCommandMapCache')
  }
}

createCommandMapCache()



fs.watch(sCommandsYaml, 'utf-8', () => {
  fs.readFile(sCommandsYaml, 'utf-8', (_err, data) => {
    commands = yaml.parse(data)
    createCommandMapCache()
  })
})


function findCommandFile(caches: Record<string, LoadedCommandFile>, meta: CommandFileMetadata): LoadedCommandFile {
  const path = require.resolve(sCommandsPath + '/' + meta.jsName)
  let loaded = caches[path]
  if(loaded === undefined) {
    const js = require(path)
    loaded = { meta, exports: js, command: js.default }
    caches[meta.jsName] = loaded

    validateCommand(loaded.command, meta)
  }

  return loaded
}

export function validateCommand(command: Command, meta: CommandFileMetadata) {
  if(!('items' in command)) throw new BotCommandError('command-spec', `Command '${meta.jsName}' does not have 'items' defined.`)

  const names = commandInversedCache[meta.prefix][meta.jsName]
  const items = Object.keys(command.items)
  const missing = names.filter(name => name.name !in items)

  if(missing.length != 0) {
    throw new BotCommandError('command-spec', `Command '${meta.jsName} does not have some items defined: ${missing.join(', ')}.`)
  }
}




async function newCommandSpec(caches: Record<string, LoadedCommandFile>, meta: CommandMetadata, content: string, allContent: string) {
  const loaded = findCommandFile(caches, { prefix: meta.prefix, jsName: meta.jsName, mainName: meta.aliasTo ?? meta.name, preload: meta.preload })
  return new CommandSpec({ meta, loaded }, content, allContent)
}

function wrongCommand(name: string) {
  let content = ''
  content += `명령어 \`${name}\`를 찾을 수 없습니다. \`!help -l\`을 입력해 가능한 명령어를 확인하세요.`

  // operate fuzzy search on commands
  const searched = commandSearchFuse.search(Hangul.disassemble(name).join(''))
  if(searched.length > 0) {
    content += ' (비슷한 명령어: '
    for(const s of searched) {
      const info = allCommandInfos[s.refIndex]
      const commandLine = info.prefix + info.name
      content += `\`${commandLine}\``
      if(info.aliasTo !== undefined) content += `(=> \`${info.aliasTo}\`)`
      content += ', '
    }
    content = content.slice(undefined, -2)
    content += ')'
  }
  return content
}


export class CommandSpec {
  public name: string

  constructor(
    public info: CommandInfo,
    public content: string,
    public allContent: string
  ) {
    this.name = info.meta.aliasTo ?? info.meta.name
  }

  get meta() {
    return this.info.meta
  }
  
  get loaded() {
    return this.info.loaded
  }

  get fileMeta() {
    return this.loaded.meta
  }

  get command() {
    return this.loaded.command
  }

  get prefix() {
    return this.meta.prefix
  }

  get originalName() {
    return this.meta.name
  }

  get jsName() {
    return this.meta.jsName
  }

  async run(handler: CommandHandler, message: Message) {
    if(!this.command) throw Error('command was not loaded. Load with CommandSpec.load(caches)')
    const parameter = new CommandParameter(handler, this.command, message, this.prefix, this.name, this.content, this.allContent)
    try {
      const result = this.command.handle(parameter)
      if(result instanceof Promise) await result

      const delOrder = config().deleteCommand

      if(delOrder && !parameter.deletedOriginal) {
        message.delete()
      }
    } catch(e) {
      if(e instanceof BotCommandError) {
        let content = e.params?.noHead ?  e.message : `⚠ [잘못된 명령어] ${e.message}`
        if(config().detailedUserErrorToDiscord) switch(e.type) {
          case 'no-command': {
            content += '> '
            content += wrongCommand(this.name)
            break
          }
          case 'parameter': break
          case 'exec': break
          case 'command-spec': {
            content += `\n> * 명령어 사양이 잘못되었습니다.`
            break
          }
        }

        message.channel.send(content)

        if(e.params?.showHelp) {
          parameter.showHelp()
        }
      } else {
        logError(e, `command ${this.name}.run(${message})`, message.channel)
        console.error('command:')
        console.dir(this.command)
      }

    }
  }
}


export class CommandHandler {
  private commandCaches: Record<string, LoadedCommandFile> = {}
  private watcher = watch('./', { recursive: true }, (_type, path) => {
    if(path === undefined) return

    if(path.endsWith('.js') || path.endsWith('.ts')) try {
      console.log(`detected modification for ${path}`)
      const realPath = require.resolve('./' + path)
      const last = this.commandCaches[realPath]
      delete this.commandCaches[realPath]
      delete require.cache[realPath]

      if(last?.meta?.preload) {
        findCommandFile(this.commandCaches, last.meta)
      }
    } catch(e) {
      console.log(`[hot reload] error with file ${path}: ${e}`) 
    }
  })


  constructor(public client: Client) {
    this.preloadCommands()
  }

  findCommandFile(meta: CommandMetadata) {
    return findCommandFile(this.commandCaches, { prefix: meta.prefix, jsName: meta.jsName, mainName: meta.aliasTo ?? meta.name, preload: meta.preload })
  }

  preloadCommands() {
    for(const preload of preloads) {
      this.findCommandFile(preload)
    }
  }

  dispose() {
    this.watcher.close()
  }


  // for the sake of listing commands: !help
  async listAllCommands(): Promise<CommandInfo[]> {
    const result: CommandInfo[] = []
    for(const prefix of Object.keys(commandMapCache)) {
      const metas = commandMapCache[prefix]
      const names = Object.keys(metas)

      for(const name of names) {
        const meta = metas[name]
        const loaded = this.findCommandFile(meta)
        result.push({ meta, loaded })
      }
    }

    return result
  }


  public userInputs: Message[] = []


  async handleMessage(message: Message): Promise<boolean> {
    for(const interceptor of Object.values(interceptors)) {
      if(interceptor(this, message)) return true
    }
    const result = await this.handleMessageInternal(message)
    if(result) this.userInputs.push(message)
    return result
  }

  private async handleMessageInternal(message: Message): Promise<boolean> {
    try {

      if(message.author.bot) {
        if(config().noRecurse && message.author == message.client.user) {
          return false
          // no-op
        }
      }

      if(message.content == '!dump') {
        await message.channel.send(inspect(commands, false, 5))
        return true
      }

      const spec = await this.commandSpec(message.content)
      if(spec == false) {
        const c = message.content
        const index = c.indexOf(' ')
        message.channel.send('⚠ ' + wrongCommand(index == -1 ? c : c.slice(0, index)))
        return true
      }

      if(spec != null) {
        await spec.run(this, message)
        return true
      }

      return false
    } catch(e: any) {
      console.log(chalk`{red handleMessage: error: ${e} ${inspect(e)}}`)
      if(e?.stack) console.log(chalk`{red ${e.stack}}`)
      return true
    }
  }

  async commandSpec(content: string): Promise<CommandSpec | false | null> {
    for(const prefix of Object.keys(commandMapCache)) {
      if(content.startsWith(prefix)) {
        const command = await this.commandSpecForPrefix(content, prefix, commandMapCache[prefix])
        if(command != null) {
          return command
        } else {
          return false
        }
      }
    }

    return null
  }

  async commandSpecForPrefix(allContent: string, prefix: string, commands: Record<string, CommandMetadata>): Promise<CommandSpec | null> {
    // commands: name -> js name
    const content = allContent.slice(prefix.length).trim()
    const spaceIndex = content.indexOf(' ')

    // 1. fast path 1
    if(spaceIndex == -1) {
      const command = commands[content]
      if(command !== undefined)
        return await newCommandSpec(this.commandCaches, command, '', allContent)
    }

    // 2. fast path 2
    const oneWordName = content.slice(0, spaceIndex)
    const oneWordCommand = commands[oneWordName]
    if(oneWordCommand !== undefined)
      return await newCommandSpec(this.commandCaches, oneWordCommand, content.slice(spaceIndex + 1).trim(), allContent)

    // 3. slow path
    for(const name of Object.keys(commands)) {
      if(content.startsWith(name + ' '))
        return await newCommandSpec(this.commandCaches, commands[name], content.slice(name.length).trim(), allContent)
    }

    return null
  }
}



