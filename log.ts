import chalk from "chalk"
import { Channel, DMChannel, NewsChannel, TextChannel } from "discord.js"
import config from "./config"

export default function log(...content: any[]) {
  console.log(...content)
}

export function logError(e: any, name: string, channel?: TextChannel | DMChannel | NewsChannel) {
  channel?.send(`⚠ 명령어 처리 중 오류가 발생했어요. (${e})`)
  log(chalk`{red ERROR ${name}: ${e}}`)
  if(e && e.stack) {
    log(chalk`{red ${e.stack}}`)
    if(config().detailedLogToDiscord) {
      const stack = e.stack.toString()
      const prefixed = stack.split('\n').map(s => `> ${s}`).join('\n')
      channel?.send(`> **stacktrace**\n${prefixed}`)
    }
  }
}
