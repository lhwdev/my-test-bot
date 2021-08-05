import { command } from "../command-handler";



export default command({
  name: '',
  async handle(p) {
    await p.reply('와')
  }
})
