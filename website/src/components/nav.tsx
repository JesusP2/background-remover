import { A } from '@solidjs/router';
import { cn } from '~/lib/utils';
import { buttonVariants } from './ui/button';

export function Navbar() {
  return (
    <header class="sticky z-10 top-0 bg-white h-16 border-b border-zinc-200 items-center flex px-4 justify-between">
      <div class="w-[210px]">
        <div class="w-[40px]">
          <A href="/">
            <img src="/logo.png" alt="logo" width="40" />
          </A>
        </div>
      </div>
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
          href="/my-gallery"
          class={cn(
            buttonVariants({ variant: 'ghost' }),
            'font-gabarito text-md text-zinc-600',
          )}
        >
          My Gallery
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
  );
}
