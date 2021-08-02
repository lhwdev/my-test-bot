import { Message } from "discord.js";


export function checkCommand(message: Message) {
  const content = message.content.trim()
  if(content.startsWith('!')) return content.slice(1)
  else null
}
