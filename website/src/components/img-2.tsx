import { cn } from '~/lib/utils';
import { PerfectArrow } from './perfect-arrow';

export function Image2(props: { class?: string }) {
  return (
    <div class={cn('relative ml-10', props.class)}>
      <div class="relative ml-10 w-[200px] h-[352px] 2xl:w-[300px] 2xl:h-[530px]">
        <div class="bg-black rounded-lg w-full h-full" />
        <div class="border-2 border-black absolute top-[-3px] left-[3px] bg-white rounded-lg w-full h-full">
          <img
            src="/img-without-bg-2.png"
            class="rounded-md"
            alt="logo"
            width={300}
          />
        </div>
      </div>
      <div class="relative ml-10 w-[100px] 2xl:w-[150px] h-[174px] 2xl:h-[263px] top-[-100px] 2xl:top-[-140px] left-[-60px] 2xl:left-[-80px]">
        <div class="bg-black rounded-lg w-full h-full" />
        <div class="border-2 border-black absolute top-[-3px] left-[3px] bg-white rounded-lg w-full h-full">
          <img
            src="/img-without-bg-2.jpeg"
            alt="logo"
            width={150}
            class="rounded-md"
          />
        </div>
      </div>
      <div class="w-24 absolute top-48 2xl:top-80 left-[6px] 2xl:left-4">
        <PerfectArrow p1={{ x: 10, y: 70 }} p2={{ x: 69, y: 10 }} />
      </div>
    </div>
  );
}
