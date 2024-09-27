import type { DropdownMenuSubTriggerProps } from '@kobalte/core/dropdown-menu';
import { Button, buttonVariants } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuGroupLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { signOutAction } from '~/lib/actions/signout';
import { A } from '@solidjs/router';
import { cn } from '~/lib/utils';
import { Avatar, AvatarFallback } from './ui/avatar';

export const UserDropdown = (props: { name: string }) => {
  return (
    <DropdownMenu placement="bottom">
      <DropdownMenuTrigger
        as={(dropdownProps: DropdownMenuSubTriggerProps) => (
          <Avatar {...dropdownProps}>
            <AvatarFallback>{props.name.slice(0, 1)}</AvatarFallback>
          </Avatar>
        )}
      />
      <DropdownMenuContent class="w-56">
        <DropdownMenuGroup>
          <DropdownMenuGroupLabel>My Account</DropdownMenuGroupLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            // biome-ignore lint/suspicious/noExplicitAny: <explanation>
            as={(props: any) => (
              <A
                {...props}
                class={cn(props.class, 'pl-4')}
                href="/settings/profile"
              >
                <span>Profile</span>
                <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
              </A>
            )}
          />
          <DropdownMenuItem
            // biome-ignore lint/suspicious/noExplicitAny: <explanation>
            as={(props: any) => (
              <A
                {...props}
                class={cn(props.class, 'pl-4')}
                href="/settings/account"
              >
                <span>Account</span>
                <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
              </A>
            )}
          />
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          // biome-ignore lint/suspicious/noExplicitAny: <explanation>
          as={(props: any) => (
            <form method="post" action={signOutAction}>
              <Button
                {...props}
                type="submit"
                variant="ghost"
                class="flex justify-start w-full h-[32px]"
              >
                Sign out
              </Button>
            </form>
          )}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
