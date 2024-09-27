import { A, useLocation } from '@solidjs/router';
import type { JSX } from 'solid-js';
import { selectedCss, unselectedCss } from '~/lib/constants';

export default function SettingsLayout(props: { children: JSX.Element }) {
  const location = useLocation();
  return (
    <>
      <header class="max-w-7xl mx-auto px-4">
        <h3 class="text-4xl font-gabarito font-semibold my-4">Settings</h3>
        <p class="text-muted-foreground mt-2">Manage your account settings</p>
        <div
          data-orientation="horizontal"
          class="shrink-0 bg-border h-[1px] w-full my-6"
        />
      </header>
      <div class="flex flex-col md:flex-row space-y-8 md:space-y-0 md:space-x-12 max-w-7xl mx-auto px-4">
        <aside class="md:w-1/5">
          <nav class="flex space-x-2 md:flex-col md:space-x-0 md:space-y-1">
            <A
              class={
                location.pathname === '/settings/profile'
                  ? selectedCss
                  : unselectedCss
              }
              href="/settings/profile"
            >
              Profile
            </A>
            <A class={unselectedCss} href="/">
              Go back
            </A>
          </nav>
        </aside>
        <div class="w-full">{props.children}</div>
      </div>
    </>
  );
}
// <A
//   class={
//     location.pathname === '/settings/account'
//       ? selectedCss
//       : unselectedCss
//   }
//   href="/settings/account"
// >
//   Account
// </A>
