import { useSubmission } from '@solidjs/router';
import {
  AiOutlineEye,
  AiOutlineEyeInvisible,
  AiOutlineLoading,
} from 'solid-icons/ai';
import { A } from '@solidjs/router';
import { createSignal } from 'solid-js';
import { FormInput, FormLabel } from '~/components/form';
import { Button } from '~/components/ui/button';
import { signupAction } from '~/lib/actions/signup';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';

export default function Signup() {
  const signupState = useSubmission(signupAction);
  const [showPassword, setShowPassword] = createSignal(false);
  return (
    <form method="post" action={signupAction} class="w-full max-w-sm">
      <Card class="w-full max-w-sm">
        <CardHeader>
          <CardTitle class="text-2xl text-center">Sign up</CardTitle>
          <CardDescription class="text-center">Get started by creating an account</CardDescription>
        </CardHeader>
        <CardContent class="grid gap-4">
          <div class="grid gap-2">
            <FormLabel
              error={!!signupState.result?.fieldErrors.username?.[0]}
              htmlFor="username"
            >
              Username
            </FormLabel>
            <FormInput id="username" name="username" placeholder="John Doe" />
            <span class="text-sm text-red-500">
              {signupState.result?.fieldErrors.username?.[0]}
            </span>
          </div>
          <div class="grid gap-2">
            <div class="flex items-center gap-x-4">
              <FormLabel
                error={!!signupState.result?.fieldErrors.password?.[0]}
                htmlFor="password"
              >
                Password
              </FormLabel>
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                class="hover:text-gray-600"
              >
                {showPassword() ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
              </button>
            </div>
            <FormInput
              id="password"
              name="password"
              type={showPassword() ? 'text' : 'password'}
              required
              minLength={8}
            />
            <span class="text-sm text-red-500">
              {signupState.result?.fieldErrors.password?.[0]}
            </span>
          </div>
          <Button type="submit" disabled={signupState.pending} class="w-full">
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
          <div class="text-center text-sm">
            Don&apos;t have an account?{' '}
            <A href="/auth/signin" class="underline">
              Sign in
            </A>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
