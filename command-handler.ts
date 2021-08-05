import { Channel, Client, DMChannel, Guild, Message, NewsChannel, TextChannel, User } from 'discord.js'
import config from './config'
import yaml from 'yaml'
import fs from 'fs'
import watch from 'node-watch'
import chalk from 'chalk'
import { logError } from './log'
import { resolve } from 'path'
import { inspect } from 'util'


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



type Command = {
  name?: string
  handle: (parameter: CommandParameter) => Promise<void>
}


export function command(command: Command): Command { // only exists for linting
  return command
}


export class CommandSpec {
  jsExport?: any
  command?: Command

  constructor(public name: string, public jsName: string, public content: string, public allContent: string) {}

  async load(caches: Record<string, any>) {
    let js = caches[this.name]
    if(js === undefined) {
      js = require(`./commands/${this.jsName}`)
    }

    this.jsExport = js
    this.command = js.default
  }

  async run(message: Message) {
    if(!this.command) throw Error('command was not loaded. Load with CommandSpec.load(caches)')
    try {
      const parameter = new CommandParameter(message, this.name, this.content, this.allContent)
      await this.command.handle(parameter)

      const delOrder = config().deleteCommand

      if(delOrder && !parameter.deletedOriginal) {
        message.delete()
      }
    } catch(e) {
      logError(e, `command ${this.name}.run(${message})`, message.channel)
      console.error('command:')
      console.dir(this.command)
    }
  }
}


const sCommandsPath = 'commands'

export class CommandHandler {
  private commandCaches: Record<string, any> = {}
  private watcher = watch(sCommandsPath, { recursive: true }, (_type, path) => {
    if(path === undefined) return

    if(path.endsWith('.js')) {
      delete this.commandCaches[path.slice(sCommandsPath.length + 1)] // commands/name.js
      try {
      delete require.cache[resolve(path)]
      } catch(e) { logError(e, 'require.resolve')}
    }
  })


  constructor(public client: Client) {}

  dispose() {
    this.watcher.close()
  }


  async handleMessage(message: Message): Promise<boolean> {
    try {
      const content = message.content

      if(content == '!dump') {
        await message.channel.send(inspect(commands, false, 5))
        return true
      }

      for(const prefix of Object.keys(commandMapCache)) {
        if(content.startsWith(prefix)) {
          const command = this.handleForPrefix(message, prefix, commandMapCache[prefix])
          if(command != null) {
            await command.load(this.commandCaches)
            await command.run(message)
            return true
          }
        }
      }

      return false
    } catch(e) {
      console.log(chalk`{red handleMessage: error: ${e}}`)
      if(e?.stack) console.log(chalk`{red ${e.stack}}`)
      return false
    }
  }

  handleForPrefix(message: Message, prefix: string, commands: Record<string, string>): CommandSpec | null {
    // commands: name -> js name
    const allContent = message.content
    const content = allContent.slice(prefix.length).trim()
    const spaceIndex = content.indexOf(' ')

    // 1. fast path 1
    if(spaceIndex == -1) {
      const command = commands[content]
      if(command !== undefined) return new CommandSpec(content, command, '', allContent)
    }

    // 2. fast path 2
    const oneWordName = content.slice(0, spaceIndex)
    const oneWordCommand = commands[oneWordName]
    if(oneWordCommand !== undefined) return new CommandSpec(oneWordName, oneWordCommand, content.slice(spaceIndex + 1).trim(), allContent)

    // 3. slow path
    for(const name of Object.keys(commands)) {
      if(content.startsWith(name)) return new CommandSpec(name, commands[name], content.slice(name.length).trim(), allContent)
    }

    message.channel.send('⚠ 알 수 없는 명령어입니다.')
    return null
  }
}


export class CommandParameter {
  public deletedOriginal = false


  constructor(public message: Message, public name: string, public content: string, public allContent: string) {}

  get author(): User {
    return this.message.author
  }

  get channel(): TextChannel | DMChannel | NewsChannel {
    return this.message.channel
  }

  get guild(): Guild | null {
    return this.message.guild
  }


  async reply(content: any): Promise<Message> {
    return await this.channel.send(content)
  }


  async deleteOriginal() {
    if(config().deleteOriginal) {
      await this.message.delete()
      this.deletedOriginal = true
    }
  }
}
