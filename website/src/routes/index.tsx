import { A, action, useAction } from '@solidjs/router';
import { DropZone } from '~/components/dropzone';
import { buttonVariants } from '~/components/ui/button';
import { uploadImage } from '~/lib/actions/init-image-process';
import { cn } from '~/lib/utils';

const uploadImageAction = action(uploadImage);
export default function Index() {
  const uploadImage = useAction(uploadImageAction);
  return (
    <div class="h-[3000px]">
      <header class="sticky z-10 top-0 bg-white h-16 border-b border-zinc-200 items-center flex px-4 justify-between">
        <A href="/" class="w-[210px]">
          <img src="/logo.png" alt="logo" width="40" />
        </A>
        <div>
          <A
            href="/pricing"
            class={cn(
              buttonVariants({ variant: 'ghost' }),
              'font-gabarito text-md text-zinc-600',
            )}
          >
            Pricing
          </A>
          <A
            href="/releases"
            class={cn(
              buttonVariants({ variant: 'ghost' }),
              'font-gabarito text-md text-zinc-600',
            )}
          >
            Releases
          </A>
          <A
            href="/github"
            class={cn(
              buttonVariants({ variant: 'ghost' }),
              'font-gabarito text-md text-zinc-600',
            )}
          >
            Github
          </A>
        </div>
        <div class="space-x-4">
          <A
            href="/auth/signin"
            class={cn(
              buttonVariants({ variant: 'ghost' }),
              'font-gabarito text-md text-zinc-600',
            )}
          >
            Sign in
          </A>
          <A
            href="/auth/signup"
            class={cn(
              buttonVariants({ variant: 'default' }),
              'font-gabarito text-md',
            )}
          >
            Get Started
          </A>
        </div>
      </header>
      <main class="grid place-items-center gap-y-10 mt-20">
        <h1 class="font-gabarito text-6xl font-semibold">
          Background Removal App
        </h1>
        <div class="w-[153px] group">
          <A href="/" class="relative bg-red-100">
            <div class="border-2 border-black bg-white rounded-lg w-36 h-12" />
            <div class="absolute top-[6px] left-[9px] bg-black rounded-lg w-36 h-12 text-white grid place-items-center font-gabarito text-lg group-hover:left-[6px] group-hover:top-[9px] duration-100">
              Get Started
            </div>
          </A>
        </div>
      </main>
      <div class="relative ml-10 w-[300px] h-[300px]">
        <div class="bg-black rounded-lg w-full h-full" />
        <div class="border-2 border-black absolute top-[-3px] left-[3px] bg-white rounded-lg w-full h-full">
          <img src="/logo.png" alt="logo" width={300} />
        </div>
      </div>
      <div class="relative ml-10 w-[300px] h-[300px]">
        <div class="bg-black rounded-lg w-full h-full" />
        <div class="border-2 border-black absolute top-[-3px] left-[3px] bg-white rounded-lg w-full h-full">
          <img src="/logo-with-background.gif" alt="logo" width={300} class="rounded-md" />
        </div>
      </div>
      <div class="relative ml-10 w-[600px] h-[262px]">
        <div class="bg-black rounded-lg w-full h-full" />
        <div class="border-2 border-black absolute top-[-3px] left-[3px] bg-white rounded-lg w-full h-full">
          <img src="/img-without-background-1.jpeg" alt="logo" width={600} class="rounded-md" />
        </div>
      </div>
      <p>Remoove background / Edit images</p>
      <DropZone onFileChange={(file) => uploadImage(file)} />
    </div>
  );
}
