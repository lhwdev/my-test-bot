import CommandParameter from "./command-parameter"

export type Command = {
  name?: string
  description?: string
  items: Record<string, CommandItem>

  handle: (parameter: CommandParameter) => Promise<void>
}

export type CommandItem = DirectCommandItem | AliasCommandItem

export type DirectCommandItem = {
  name: string
  description: string
  help: string
}

export type AliasCommandItem = {
  aliasTo: string
}


export function command(command: Command): Command { // only exists for linting
  return command
}
