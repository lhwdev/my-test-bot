import fetch from 'node-fetch'
import { youtubeApiKey } from '../../secrets.json'


export async function searchVideo(query: string) {
  const result = await fetch(`https://www.googleapis.com/youtube/v3/search?part=id&type=video&q=${encodeURIComponent(query)}&key=${youtubeApiKey}`)
  const data = await result.json() as any
  if(data.items.length == 0) return null
  return data.items[0].id.videoId
}

export async function getVideoInfo(id: string) {
  const result = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${id}&key=${youtubeApiKey}`)
  const data = await result.json() as any
  return data.items[0].snippet
}


export function linkFor(id: string) {
  return `https://www.youtube.com/watch?v=${id}`
}
