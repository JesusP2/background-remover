import { onMount } from "solid-js"
import { urlToImage } from "~/hooks/use-grabcut-canvas/utils"

export function MainPageCanvas() {
  onMount(async () => {
    const img = await urlToImage('/collage.png')
  })
  return (<canvas />)
}
