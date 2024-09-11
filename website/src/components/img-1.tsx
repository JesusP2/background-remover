import { cn } from '~/lib/utils';
import { PerfectArrow } from './perfect-arrow';

export function Image1(props: { class?: string }) {
  return (
    <div class={cn('relative ml-10', props.class)}>
      <div class="relative ml-10 w-[200px] h-[200px] 2xl:w-[300px] 2xl:h-[300px]">
        <div class="bg-black rounded-lg w-full h-full" />
        <div class="border-2 border-black absolute top-[-3px] left-[3px] bg-white rounded-lg w-full h-full">
          <img src="/logo.png" alt="logo" width={300} />
        </div>
      </div>
      <div class="relative ml-10 w-[100px] 2xl:w-[150px] h-[100px] 2xl:h-[150px] top-[-50px] left-[-60px] 2xl:left-[-80px]">
        <div class="bg-black rounded-lg w-full h-full" />
        <div class="border-2 border-black absolute top-[-3px] left-[3px] bg-white rounded-lg w-full h-full">
          <img
            src="/logo-with-background.gif"
            alt="logo"
            width={150}
            class="rounded-md"
          />
        </div>
      </div>
      <div class="w-24 absolute top-24 2xl:top-48 left-[6px] 2xl:left-4">
        <PerfectArrow p1={{ x: 10, y: 70 }} p2={{ x: 69, y: 10 }} />
      </div>
    </div>
  );
}
