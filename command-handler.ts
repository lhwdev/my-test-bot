import { Channel, Client, DMChannel, Guild, Message, NewsChannel, TextChannel, User } from 'discord.js'
import config from './config'
import yaml from 'yaml'
import fs from 'fs'
import watch from 'node-watch'
import chalk from 'chalk'
import { logError } from './log'
import { join, resolve, sep } from 'path'
import { inspect } from 'util'
import CommandParameter, { BotCommandError, resolveItemAlias } from './command-parameter'
import { Command, CommandItem } from './command'
import Fuse from 'fuse.js'


const sCommandsPath = './commands'
const sCommandsYaml = sCommandsPath + '/commands.yml'

type CommandMetadata = {
  name: string,
  prefix: string,
  aliasTo?: string
}


let commands = yaml.parse(fs.readFileSync(sCommandsYaml, 'utf-8'))
let commandMapCache: Record<string, Record<string, string>> // name -> jsName
let commandInversedCache: Record<string, Record<string, string[]>> // jsName -> name
let allCommands: string[]
let allCommandInfos: CommandMetadata[]


const commandSearchFuse: Fuse<string> = new Fuse([])


function createCommandMapCache() {
  function putArray(to, key, value) {
    const last = to[key]
    if(last == null) {
      to[key] = [value]
    } else {
      to[key].push(value)
    }
  }

  try {
    const cache = {}
    const cacheInversed = {}
    const all: string[] = []
    const allInfos: CommandMetadata[] = []
    const map = commands.commands

    for(const prefix of Object.keys(map)) {
      const prefixData = map[prefix]
      const prefixMap = {}
      const prefixInversedMap = {}

      for(const jsFileName of Object.keys(prefixData)) {
        const names = prefixData[jsFileName]
        for(const name of names) {
          if(typeof name == 'string') { // 1. - name
            prefixMap[name] = jsFileName
            putArray(prefixInversedMap, jsFileName, name)
            all.push(prefix + name)
            allInfos.push({ prefix, name })
          } else { // 2. - name: [alias1, alias2, alias3, ...]
            const originalNames = Object.keys(name)
            if(originalNames.length != 1) throw Error('what?')
            const originalName = originalNames[0]
            const aliases = name[originalName]
            prefixMap[originalName] = jsFileName

            for(const alias of aliases) {
              prefixMap[alias] = jsFileName
              putArray(prefixInversedMap, jsFileName, alias)
              all.push(prefix + alias)
              allInfos.push({ prefix, name: alias, aliasTo: originalName })
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
    commandSearchFuse.setCollection(allCommands)

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


function loadCommandFile(caches: Record<string, any>, prefix: string, jsName: string): any {
  const path = require.resolve(sCommandsPath + '/' + jsName)
  let js = caches[path]
  if(js === undefined) {
    js = require(path)
    caches[jsName] = js
  }

  validateCommand(js.default, prefix, jsName)

  return js
}

export function validateCommand(command: any, prefix: string, jsName: string) {
  if(!('items' in command)) throw new BotCommandError('command-spec', `Command '${jsName}' does not have 'items' defined.`)

  const names = commandInversedCache[prefix][jsName]
  const items = Object.keys(command.items)
  const missing = names.filter(name => name !in items)

  if(missing.length != 0) {
    throw new BotCommandError('command-spec', `Command '${jsName} does not have some items defined: ${missing.join(', ')}.`)
  }
}


async function newCommandSpec(caches: Record<string, any>, prefix: string, name: string, jsName: string, content: string, allContent: string) {
  const js = loadCommandFile(caches, prefix, jsName)
  const command = js.default

  return new CommandSpec(js, command, prefix, name, jsName, content, allContent)
}

function wrongCommand(name: string) {
  let content = ''
  content += `명령어 \`${name}\`를 찾을 수 없습니다. \`!help -l\`을 입력해 가능한 명령어를 확인하세요.`

  // operate fuzzy search on commands
  const searched = commandSearchFuse.search(name)
  if(searched.length > 0) {
    content += ' (비슷한 명령어: '
    for(const s of searched) {
      const info = allCommandInfos[s.refIndex]
      const commandLine = info.prefix + info.name
      content += commandLine
      if(info.aliasTo !== undefined) content += `(=> ${info.aliasTo})`
      content += ', '
    }
    content = content.slice(undefined, -2)
    content += ')'
  }
  return content
}


export class CommandSpec {
  constructor(
    public jsExport: any,
    public command: Command,
    public prefix: string,
    public name: string,
    public jsName: string,
    public content: string,
    public allContent: string
  ) {}

  async run(handler: CommandHandler, message: Message) {
    if(!this.command) throw Error('command was not loaded. Load with CommandSpec.load(caches)')
    const parameter = new CommandParameter(handler, this.command, message, this.prefix, this.name, this.content, this.allContent)
    try {
      await this.command.handle(parameter)

      const delOrder = config().deleteCommand

      if(delOrder && !parameter.deletedOriginal) {
        message.delete()
      }
    } catch(e) {
      if(e instanceof BotCommandError) {

        let content = `⚠ [잘못된 명령어] ${e.message}`
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
  private commandCaches: Record<string, any> = {}
  private watcher = watch(sCommandsPath, { recursive: true }, (_type, path) => {
    if(path === undefined) return

    if(path.endsWith('.js') || path.endsWith('.ts')) {
      const realPath = require.resolve('./' + path)
      delete this.commandCaches[realPath]
      delete require.cache[realPath]
    }
  })


  constructor(public client: Client) {}

  dispose() {
    this.watcher.close()
  }


  // for the sake of listing commands: !help
  async listAllCommands(): Promise<[string, string, CommandItem][]> {
    const result: [string, string, CommandItem][] = []
    for(const prefix of Object.keys(commandMapCache)) {
      const map = commandMapCache[prefix]
      const names = Object.keys(map)

      for(const name of names) {
        const command = loadCommandFile(this.commandCaches, prefix, map[name]).default!! as Command
        result.push([prefix, name, command.items[name]!!])
      }

    }

    return result
  }


  async handleMessage(message: Message): Promise<boolean> {
    try {

      if(message.author.bot) {
        if(config().noRecurse && message.author == message.client.user) {
          // no-op
        } else {
          return false
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
    } catch(e) {
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

  async commandSpecForPrefix(allContent: string, prefix: string, commands: Record<string, string>): Promise<CommandSpec | null> {
    // commands: name -> js name
    const content = allContent.slice(prefix.length).trim()
    const spaceIndex = content.indexOf(' ')

    // 1. fast path 1
    if(spaceIndex == -1) {
      const command = commands[content]
      if(command !== undefined)
        return await newCommandSpec(this.commandCaches, prefix, content, command, '', allContent)
    }

    // 2. fast path 2
    const oneWordName = content.slice(0, spaceIndex)
    const oneWordCommand = commands[oneWordName]
    if(oneWordCommand !== undefined)
      return await newCommandSpec(this.commandCaches, prefix, oneWordName, oneWordCommand, content.slice(spaceIndex + 1).trim(), allContent)

    // 3. slow path
    for(const name of Object.keys(commands)) {
      if(content.startsWith(name + ' '))
        return await newCommandSpec(this.commandCaches, prefix, name, commands[name], content.slice(name.length).trim(), allContent)
    }

    return null
  }
}



