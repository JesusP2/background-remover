import { cn } from '~/lib/utils';
import { PerfectArrow } from './perfect-arrow';

export function Image5(props: { class?: string }) {
  return (
    <div class={cn('relative ml-10', props.class)}>
      <div class="relative ml-10 w-[300px] h-[199px] 2xl:w-[400px] 2xl:h-[267px]">
        <div class="bg-black rounded-lg w-full h-full" />
        <div class="border-2 border-black absolute top-[-3px] left-[3px] bg-white rounded-lg w-full h-full">
          <img
            src="/img-without-bg-5.png"
            alt="logo"
            width={400}
            class="rounded-md"
          />
        </div>
      </div>
      <div class="relative ml-10 w-[150px] 2xl:w-[200px] h-[99px] 2xl:h-[133px] top-[-60px] 2xl:top-[-70px] left-[-90px] 2xl:left-[-100px]">
        <div class="bg-black rounded-lg w-full h-full" />
        <div class="border-2 border-black absolute top-[-3px] left-[3px] bg-white rounded-lg w-full h-full">
          <img
            src="/img-with-bg-5.png"
            alt="logo"
            width={200}
            class="rounded-md"
          />
        </div>
      </div>
      <div class="w-24 absolute top-20 2xl:top-36 left-[-20px] 2xl:left-[-15px]">
        <PerfectArrow p1={{ x: 10, y: 70 }} p2={{ x: 69, y: 10 }} />
      </div>
    </div>
  );
}
