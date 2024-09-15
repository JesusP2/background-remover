import { cn } from '~/lib/utils';
import { PerfectArrow } from './perfect-arrow';

export function Image3(props: { class?: string }) {
  return (
    <div class={cn('relative ml-10', props.class)}>
      <div class="relative ml-10 w-[300px] h-[375px] md:w-[200px] md:h-[250px] 2xl:w-[300px] 2xl:h-[375px]">
        <div class="bg-black rounded-lg w-full h-full" />
        <div class="border-2 border-black absolute top-[-3px] left-[3px] bg-white rounded-lg w-full h-full">
          <img src="/img-without-bg-3.png" alt="logo" width={300} />
        </div>
      </div>
      <div class="relative ml-10 w-[150px] h-[187px] md:w-[100px] md:h-[123px] 2xl:w-[150px] 2xl:h-[187px] top-[-100px] md:top-[-60px] 2xl:top-[-110px] left-[-60px] 2xl:left-[-80px]">
        <div class="bg-black rounded-lg w-full h-full" />
        <div class="border-2 border-black absolute top-[-3px] left-[3px] bg-white rounded-lg w-full h-full">
          <img
            src="/img-without-bg-3.jpg"
            alt="logo"
            width={150}
            class="rounded-lg"
          />
        </div>
      </div>
      <div class="w-24 absolute top-[215px] md:top-32 2xl:top-52 left-[6px] 2xl:left-4">
        <PerfectArrow p1={{ x: 10, y: 70 }} p2={{ x: 69, y: 10 }} />
      </div>
    </div>
  );
}
