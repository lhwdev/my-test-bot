import { Channel, Client, DMChannel, Guild, Message, NewsChannel, TextChannel, User } from 'discord.js'
import config from './config'
import yaml from 'yaml'
import fs from 'fs'
import watch from 'node-watch'
import chalk from 'chalk'
import { logError } from './log'
import { resolve } from 'path'
import { inspect } from 'util'
import CommandParameter, { BotCommandError, resolveItemAlias } from './command-parameter'
import { Command, CommandItem } from './command'


const sCommandsYaml = './commands/commands.yml'


let commands = yaml.parse(fs.readFileSync(sCommandsYaml, 'utf-8'))
let commandMapCache: Record<string, Record<string, string>>

function createCommandMapCache() {
  try {
    const cache = {}
    const map = commands.commands
    for(const prefix of Object.keys(map)) {
      const prefixData = map[prefix]
      const prefixMap = {}
      for(const fileName of Object.keys(prefixData)) {
        const names = prefixData[fileName]
        for(const name of names) {
          prefixMap[name] = fileName
        }

      }

      cache[prefix] = prefixMap
    }
    commandMapCache = cache
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


function loadCommandFile(caches: Record<string, any>, jsName: string, name: string): any {
  let js = caches[name]
  if(js === undefined) {
    js = require(`./commands/${jsName}`)
    caches[name] = js
  }
  return js
}


async function newCommandSpec(prefix: string, name: string, jsName: string, content: string, allContent: string) {
    const js = loadCommandFile(caches, jsName, name)
    const command = js.default

    return js.default
}


export class CommandSpec {
  jsExport: any
  command: Command

  constructor(c) {}


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
        let content = `⚠ 잘못된 명령이에요. ${e.message}`
        if(config().detailedUserErrorToDiscord) {
          content += `\n> \`${this.name}\`: 찾을 수 없는 명령어(비슷한 명령어: )`
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


const sCommandsPath = 'commands'


export class CommandHandler {
  private commandCaches: Record<string, any> = {}
  private watcher = watch(sCommandsPath, { recursive: true }, (_type, path) => {
    if(path === undefined) return

    if(path.endsWith('.js') || path.endsWith('.ts')) {
      console.log('file cache removed: ' + path)
      delete this.commandCaches[path.slice(sCommandsPath.length + 1)] // commands/name.js
      delete require.cache[resolve(path)]
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
        const command = loadCommandFile(this.commandCaches, map[name], name).default
        result.push([prefix, name, command.items[name]])
      }

    }

    return result
  }


  async handleMessage(message: Message): Promise<boolean> {
    try {

      if(config().noRecurse && message.author == message.client.user) {
        return false
      }

      if(message.content == '!dump') {
        await message.channel.send(inspect(commands, false, 5))
        return true
      }

      const spec = await this.commandSpec(message.content)
      if(spec == false) {
        message.channel.send('⚠ 알 수 없는 명령어입니다. `!help -l`를 입력해서 가능한 명령어들을 확인하세요.')
        return true
      }

      if(spec != null) {
        await spec.run(this, message)
        return true
      }

      return false
    } catch(e) {
      console.log(chalk`{red handleMessage: error: ${e}}`)
      if(e?.stack) console.log(chalk`{red ${e.stack}}`)
      return true
    }
  }

  async commandSpec(content: string): Promise<CommandSpec | false | null> {
    for(const prefix of Object.keys(commandMapCache)) {
      if(content.startsWith(prefix)) {
        const command = this.commandSpecForPrefix(content, prefix, commandMapCache[prefix])
        if(command != null) {
          await command.load(this.commandCaches)
          return command
        } else return false
      }
    }

    return null
  }

  commandSpecForPrefix(allContent: string, prefix: string, commands: Record<string, string>): CommandSpec | null {
    // commands: name -> js name
    const content = allContent.slice(prefix.length).trim()
    const spaceIndex = content.indexOf(' ')

    // 1. fast path 1
    if(spaceIndex == -1) {
      const command = commands[content]
      if(command !== undefined) return new CommandSpec(prefix, content, command, '', allContent)
    }

    // 2. fast path 2
    const oneWordName = content.slice(0, spaceIndex)
    const oneWordCommand = commands[oneWordName]
    if(oneWordCommand !== undefined) return new CommandSpec(prefix, oneWordName, oneWordCommand, content.slice(spaceIndex + 1).trim(), allContent)

    // 3. slow path
    for(const name of Object.keys(commands)) {
      if(content.startsWith(name)) return new CommandSpec(prefix, name, commands[name], content.slice(name.length).trim(), allContent)
    }

    return null
  }
}


