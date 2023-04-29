import { Client, Events, GatewayIntentBits } from "discord.js";
import {
  StreamType,
  createAudioPlayer,
  createAudioResource,
  joinVoiceChannel,
} from "@discordjs/voice";
import ytdl from "ytdl-core-discord";
import * as yaml from "yaml";
import * as fs from "node:fs";
// import fetch from "node-fetch"

const secret = yaml.parse(fs.readFileSync("./config/secrets.yaml", "utf-8"));

const client = new Client({
  intents:
    GatewayIntentBits.DirectMessages |
    GatewayIntentBits.DirectMessageReactions |
    GatewayIntentBits.Guilds |
    GatewayIntentBits.GuildMessages |
    GatewayIntentBits.MessageContent |
    GatewayIntentBits.GuildVoiceStates,
});

client.on(Events.MessageCreate, async message => {
  if (
    message.author.id !== client.user!.id &&
    message.mentions.has(client.user!)
  ) {
    const prefix = `<@${client.user!.id}>`;
    if (!message.content.startsWith(prefix)) return;
    const content = message.content.slice(prefix.length).trim();
    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("q", content);
    url.searchParams.set(
      "key",
      secret["my-test-bot"]["youtube"]["data-v3-token"],
    );

    const result = await (await fetch(url)).json();
    console.log(result);
    const video = result.items[0];
    const channel = message.member!.voice.channel!;
    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guildId,
      adapterCreator: channel.guild.voiceAdapterCreator,
    });
    const player = createAudioPlayer();
    const link = `https://youtube.com/watch?v=${video.id.videoId}`;
    console.log(link);
    const resource = createAudioResource(
      await ytdl(link, {
        filter: "audioonly",
        highWaterMark: 256,
      }),
      {
        inputType: StreamType.Opus,
      },
    );
    player.play(resource);
    connection.subscribe(player);
  }
});

await client.login(secret["my-test-bot"]["discord"]["botToken"]);
