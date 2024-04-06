import { Button } from '~/components/ui/button';
import { action, useSubmission } from '@solidjs/router';
import { signupAction } from '~/lib/actions/signup';
import { FormInput, FormLabel, FormMessage } from '~/components/form';
import { AiOutlineLoading } from 'solid-icons/ai';

const _signup = action(signupAction);

export default function Signup() {
  const signupState = useSubmission(_signup);
  return (
    <div class="font-geist rounded-lg border bg-card text-card-foreground shadow-sm mx-auto max-w-sm">
      <div class="lex flex-col space-y-1.5 p-6">
        <h3 class="font-semibold tracking-tight text-2xl">Sign up</h3>
        <p class="text-sm text-muted-foreground">
          Enter your email below to create an account
        </p>
      </div>
      <div class="p-6 pt-0">
        <form class="grid gap-4" method="post" action={_signup}>
          <div class="grid gap-2">
            <FormLabel for="username" error={!!signupState.result?.username}>
              Username
            </FormLabel>
            <FormInput
              disabled={signupState.pending}
              error={!!signupState.result?.username}
              name="username"
              id="username"
            />
            <FormMessage error={!!signupState.result?.username}>
              {signupState.result?.username}
            </FormMessage>
          </div>
          <div class="grid gap-2">
            <FormLabel for="password" error={!!signupState.result?.password}>
              Password
            </FormLabel>
            <FormInput
              disabled={signupState.pending}
              error={!!signupState.result?.password}
              name="password"
              type="password"
              id="password"
            />
            <FormMessage error={!!signupState.result?.password}>
              {signupState.result?.password}
            </FormMessage>
          </div>
          <Button disabled={signupState.pending} class="w-full">
            {signupState.pending ? (
              <AiOutlineLoading
                class={
                  signupState.pending ? 'animate-spin w-5 h-5 ml-4' : 'hidden'
                }
              />
            ) : (
              'Sign up'
            )}
          </Button>
        </form>
        <div class="mt-4 text-center text-sm">
          Don you have an account?{' '}
          <a class="underline" href="/auth/signin">
            Login
          </a>
        </div>
      </div>
    </div>
  );
}
