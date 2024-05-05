import { cn } from "~/lib/utils";
import { PerfectArrow } from "./perfect-arrow";

export function Image4(props: { class?: string }) {
  return (
    <div class={cn('relative ml-10', props.class)}>
        <div class="relative ml-10 w-[300px] h-[300px] lg:w-[200px] lg:h-[200px] 2xl:w-[300px] 2xl:h-[300px]">
          <div class="bg-black rounded-lg w-full h-full" />
          <div class="border-2 border-black absolute top-[-3px] left-[3px] bg-white rounded-lg w-full h-full">
            <img src="/img-without-bg-4.png" alt="logo" width={300} />
          </div>
        </div>
        <div class="relative ml-10 md:w-[150px] md:h-[150px] 2xl:w-[150px] 2xl:h-[150px] lg:w-[100px] lg:h-[100px] top-[-60px] 2xl:top-[-110px] left-[-90px] lg:left-[-60px] 2xl:left-[-80px]">
          <div class="bg-black rounded-lg w-full h-full" />
          <div class="border-2 border-black absolute top-[-3px] left-[3px] bg-white rounded-lg w-full h-full">
            <img
              src="/img-with-bg-4.png"
              alt="logo"
              width={150}
              class="rounded-md"
            />
          </div>
        </div>
        <div class="w-24 absolute top-44 lg:top-20 2xl:top-32 left-[6px] 2xl:left-4">
          <PerfectArrow p1={{ x: 10, y: 70 }} p2={{ x: 69, y: 10 }} />
        </div>
      </div>
  )
}
