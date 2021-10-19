import { MessageActionRow, MessageButton } from 'discord.js'
import { command } from '../command'


export default command({
  items: {
    hi: {
      name: '안녕?',
      description: '안녕?을 듣고 싶으면 이 명령어를 쓰세요.'
    }
  },
  async handle(p) {
    const row = new MessageActionRow()
      .addComponents(
        new MessageButton()
          .setCustomId('hi')
          .setLabel('ㅇㅋ')
          .setStyle('PRIMARY')
      )
      .addComponents(
        new MessageButton()
          .setCustomId('hi2')
          .setLabel('?')
          .setStyle('SECONDARY')
      )
      .addComponents(
        new MessageButton()
          .setCustomId('hi3')
          .setLabel('ㄴㄴ')
          .setStyle('DANGER')
      )
      .addComponents(
        new MessageButton()
          .setLabel('링크')
          .setURL('https://github.com/lhwdev/my-test-bot')
          .setStyle('LINK')
      )
    await p.reply({ content: 'ㅎㅇㅎㅇ', components: [row] })
    
  }
})
