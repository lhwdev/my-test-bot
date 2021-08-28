import CommandParameter from "./command-parameter"

export type Command = {
  name?: string,
  description?: string,
  items: Record<string, CommandItem>,

  handle: (parameter: CommandParameter) => Promise<void> | void
}

export type CommandItem = DirectCommandItem | AliasCommandItem

export type DirectCommandItem = {
  name: string,
  description: string,
  help?: string,
  indexed?: boolean
}

export type AliasCommandItem = {
  aliasTo: string
}


export function command(command: Command): Command { // only exists for linting
  return command
}
