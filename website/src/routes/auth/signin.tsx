import { Button } from '~/components/ui/button';
import { SigninAction } from '~/lib/actions/signin';
import { action, useSubmission } from '@solidjs/router';
import { FormInput, FormLabel, FormMessage } from '~/components/form';
import {
  AiOutlineLoading,
  AiOutlineEye,
  AiOutlineEyeInvisible,
} from 'solid-icons/ai';
import { Match, Switch, createSignal } from 'solid-js';

const signin = action(SigninAction);
export default function Signin() {
  const signinState = useSubmission(signin);
  const [showPassword, setShowPassword] = createSignal(false);
  return (
    <div class="font-geist rounded-lg border bg-card text-card-foreground shadow-sm mx-auto max-w-sm">
      <div class="lex flex-col space-y-1.5 p-6">
        <h3 class="font-semibold tracking-tight text-2xl">Login</h3>
        <p class="text-sm text-muted-foreground">
          Enter your email below to login to your account
        </p>
      </div>
      <div class="p-6 pt-0">
        <form class="grid gap-4" method="post" action={signin}>
          <div class="grid gap-2">
            <FormLabel for="username" error={!!signinState.result?.username}>
              Username
            </FormLabel>
            <FormInput
              disabled={signinState.pending}
              error={!!signinState.result?.username}
              name="username"
              id="username"
            />
            <FormMessage error={!!signinState.result?.username}>
              {signinState.result?.username}
            </FormMessage>
          </div>
          <div class="grid gap-2">
            <div class="flex items-center gap-x-2">
              <FormLabel for="password" error={!!signinState.result?.password}>
                Password
              </FormLabel>
              <Switch>
                <Match when={showPassword()}>
                  <button onClick={() => setShowPassword(false)}>
                    <AiOutlineEyeInvisible />
                  </button>
                </Match>
                <Match when={!showPassword()}>
                  <button onClick={() => setShowPassword(true)}>
                    <AiOutlineEye />
                  </button>
                </Match>
              </Switch>
              <a
                href="auth/reset-password"
                class="ml-auto inline-block text-sm underline"
              >
                Forgot your password?
              </a>
            </div>
            <FormInput
              disabled={signinState.pending}
              error={!!signinState.result?.password}
              name="password"
              type="password"
              id="password"
            />
            <FormMessage error={!!signinState.result?.password}>
              {signinState.result?.password}
            </FormMessage>
          </div>
          <Button disabled={signinState.pending} class="w-full">
            {signinState.pending ? (
              <AiOutlineLoading
                class={
                  signinState.pending ? 'animate-spin w-5 h-5 ml-4' : 'hidden'
                }
              />
            ) : (
              'Login'
            )}
          </Button>
        </form>
        <div class="mt-4 text-center text-sm">
          Don't have an account?{' '}
          <a class="underline" href="/auth/signup">
            Sign up
          </a>
        </div>
      </div>
    </div>
  );
}
