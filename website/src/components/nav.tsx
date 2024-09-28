import { A, cache, createAsync } from '@solidjs/router';
import { Match, Switch, createSignal } from 'solid-js';
import { getRequestEvent } from 'solid-js/web';
import { rateLimit } from '~/lib/rate-limiter';
import { cn } from '~/lib/utils';
import { buttonVariants } from './ui/button';
import { UserDropdown } from './user-dropdown';

const getUserInfo = cache(async () => {
  'use server';
  const error = await rateLimit();
  if (error) {
    return error;
  }
  const req = getRequestEvent();
  if (!req?.locals.userId) return null;
  return {
    id: req.locals.user?.id,
    name: req.locals.user?.name,
  };
}, 'session');

export const route = {
  load: () => getUserInfo(),
};
export function Navbar(props: { route: string }) {
  const userInfo = createAsync(() => getUserInfo());
  const [isOpen, open] = createSignal(false);
  return (
    <header
      class={cn(
        'sticky z-20 top-0 bg-white border-b border-zinc-200 px-4 duration-200',
        isOpen() ? 'h-screen' : 'h-16',
      )}
    >
      <div class="justify-between mid:flex items-center max-w-7xl h-16 mx-auto hidden">
        <div class="mid:w-[210px]">
          <div class="w-[40px]">
            <A href="/">
              <img src="/logo.png" alt="logo" width="40" />
            </A>
          </div>
        </div>
        <div>
          <A
            href="/"
            class={cn(
              buttonVariants({ variant: 'ghost' }),
              'font-gabarito text-md text-zinc-600',
              props.route === '/' ? 'bg-accent text-accent-foreground' : '',
            )}
          >
            Home
          </A>
          <A
            href="/my-gallery"
            class={cn(
              buttonVariants({ variant: 'ghost' }),
              'font-gabarito text-md text-zinc-600',
              props.route === '/my-gallery'
                ? 'bg-accent text-accent-foreground'
                : '',
            )}
          >
            My Gallery
          </A>
          <A
            href="/one-shot"
            class={cn(
              buttonVariants({ variant: 'ghost' }),
              'font-gabarito text-md text-zinc-600',
              props.route === '/one-shot'
                ? 'bg-accent text-accent-foreground'
                : '',
            )}
          >
            One shot
          </A>
          <A
            href="/releases"
            class={cn(
              buttonVariants({ variant: 'ghost' }),
              'font-gabarito text-md text-zinc-600',
              props.route === '/releases'
                ? 'bg-accent text-accent-foreground'
                : '',
            )}
          >
            Releases
          </A>
          <A
            href="/github"
            class={cn(
              buttonVariants({ variant: 'ghost' }),
              'font-gabarito text-md text-zinc-600',
              props.route === '/github'
                ? 'bg-accent text-accent-foreground'
                : '',
            )}
          >
            Github
          </A>
        </div>
        <div class="space-x-4 flex w-[153px] justify-end">
          <Switch>
            <Match when={userInfo() === null}>
              <A
                href="/auth/signin"
                class={cn(
                  buttonVariants({ variant: 'ghost' }),
                  'font-gabarito text-md text-zinc-600',
                )}
              >
                Sign in
              </A>
            </Match>
            {/*@ts-expect-error idk*/}
            <Match when={userInfo() && ('id' in userInfo())}>
              {/*@ts-expect-error idk*/}
              <UserDropdown name={userInfo().name} />
            </Match>
          </Switch>
        </div>
      </div>
      <div class="mid:hidden flex justify-between items-center max-w-7xl mx-auto h-16">
        <div class="mid:w-[210px]">
          <div class="w-[40px]">
            <A href="/">
              <img src="/logo.png" alt="logo" width="40" />
            </A>
          </div>
        </div>
        <button onClick={() => open((prev) => !prev)}>x</button>
      </div>
      <div class={cn('flex flex-col gap-y-4', isOpen() ? '' : 'hidden')}>
        <A
          href="/"
          class={cn(
            buttonVariants({ variant: 'ghost' }),
            'font-gabarito text-md text-zinc-600',
            props.route === '/' ? 'bg-accent text-accent-foreground' : '',
          )}
        >
          Home
        </A>
        <A
          href="/my-gallery"
          class={cn(
            buttonVariants({ variant: 'ghost' }),
            'font-gabarito text-md text-zinc-600',
            props.route === '/my-gallery'
              ? 'bg-accent text-accent-foreground'
              : '',
          )}
        >
          My Gallery
        </A>
        <A
          href="/releases"
          class={cn(
            buttonVariants({ variant: 'ghost' }),
            'font-gabarito text-md text-zinc-600',
            props.route === '/releases'
              ? 'bg-accent text-accent-foreground'
              : '',
          )}
        >
          Releases
        </A>
        <A
          href="/github"
          class={cn(
            buttonVariants({ variant: 'ghost' }),
            'font-gabarito text-md text-zinc-600',
            props.route === '/github' ? 'bg-accent text-accent-foreground' : '',
          )}
        >
          Github
        </A>
      </div>
      <div
        class={cn(
          'space-x-4 flex justify-center mt-4',
          isOpen() ? '' : 'hidden',
        )}
      >
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
