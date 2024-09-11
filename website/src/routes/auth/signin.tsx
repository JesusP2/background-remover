import { useSubmission } from '@solidjs/router';
import {
  AiOutlineEye,
  AiOutlineEyeInvisible,
  AiOutlineLoading,
} from 'solid-icons/ai';
import { createSignal } from 'solid-js';
import { A } from '@solidjs/router';
import { FormInput, FormLabel } from '~/components/form';
import { Button, buttonVariants } from '~/components/ui/button';
import { signinAction } from '~/lib/actions/signin';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { cn } from '~/lib/utils';

export default function Signin() {
  const signinState = useSubmission(signinAction);
  const [showPassword, setShowPassword] = createSignal(false);
  return (
    <form method="post" action={signinAction}>
      <Card class="mx-auto max-w-sm">
        <CardHeader>
          <CardTitle class="text-3xl text-center">Sign in</CardTitle>
          <CardDescription class="text-center">
            Sign in to your account using one of the options below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <section class="mb-4 flex flex-col gap-y-4">
            <a
              href="/auth/google"
              class={cn(
                buttonVariants({ variant: 'secondary' }),
                'w-full flex gap-x-2',
              )}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                fill="currentColor"
                viewBox="0 0 256 256"
              >
                <title>google icon</title>
                <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,16a88,88,0,0,1,73.72,40H128a48.08,48.08,0,0,0-45.6,33l-23.08-40A87.89,87.89,0,0,1,128,40Zm32,88a32,32,0,1,1-32-32A32,32,0,0,1,160,128ZM40,128a87.44,87.44,0,0,1,9.56-39.86L86.43,152c.06.1.13.19.19.28A48,48,0,0,0,137.82,175l-23.1,40A88.14,88.14,0,0,1,40,128Zm92.69,87.87L169.57,152c.08-.14.14-.28.22-.42a47.88,47.88,0,0,0-6-55.58H210a88,88,0,0,1-77.29,119.87Z" />
              </svg>
              Sign in with Google
            </a>
            <a
              href="/auth/github"
              class={cn(
                buttonVariants({ variant: 'secondary' }),
                'w-full flex gap-x-2',
              )}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                fill="currentColor"
                viewBox="0 0 256 256"
              >
                <title>github icon</title>
                <path d="M208.31,75.68A59.78,59.78,0,0,0,202.93,28,8,8,0,0,0,196,24a59.75,59.75,0,0,0-48,24H124A59.75,59.75,0,0,0,76,24a8,8,0,0,0-6.93,4,59.78,59.78,0,0,0-5.38,47.68A58.14,58.14,0,0,0,56,104v8a56.06,56.06,0,0,0,48.44,55.47A39.8,39.8,0,0,0,96,192v8H72a24,24,0,0,1-24-24A40,40,0,0,0,8,136a8,8,0,0,0,0,16,24,24,0,0,1,24,24,40,40,0,0,0,40,40H96v16a8,8,0,0,0,16,0V192a24,24,0,0,1,48,0v40a8,8,0,0,0,16,0V192a39.8,39.8,0,0,0-8.44-24.53A56.06,56.06,0,0,0,216,112v-8A58.14,58.14,0,0,0,208.31,75.68ZM200,112a40,40,0,0,1-40,40H112a40,40,0,0,1-40-40v-8a41.74,41.74,0,0,1,6.9-22.48A8,8,0,0,0,80,73.83a43.81,43.81,0,0,1,.79-33.58,43.88,43.88,0,0,1,32.32,20.06A8,8,0,0,0,119.82,64h32.35a8,8,0,0,0,6.74-3.69,43.87,43.87,0,0,1,32.32-20.06A43.81,43.81,0,0,1,192,73.83a8.09,8.09,0,0,0,1,7.65A41.72,41.72,0,0,1,200,104Z" />
              </svg>
              Signin with Github
            </a>
          </section>
          <div class="relative py-4">
            <div class="absolute inset-0 flex items-center">
              <span class="w-full border-t" />
            </div>
            <div class="relative flex justify-center text-xs uppercase">
              <span class="bg-white px-2 text-gray-500 dark:bg-gray-950 dark:text-gray-400">
                Or sign in with email
              </span>
            </div>
          </div>
          <section class="grid gap-4">
            <div class="grid gap-2">
              <FormLabel
                error={!!signinState.result?.fieldErrors.username?.[0]}
                htmlFor="username"
              >
                Username
              </FormLabel>
              <FormInput
                id="username"
                name="username"
                placeholder="John Doe"
                type="text"
                required
                minLength={3}
              />
              <span class="text-sm text-red-500">
                {signinState.result?.fieldErrors.username?.[0]}
              </span>
            </div>
            <div class="grid gap-2">
              <div class="flex items-center">
                <div class="flex items-center gap-x-4">
                  <FormLabel
                    error={!!signinState.result?.fieldErrors.password?.[0]}
                    htmlFor="password"
                  >
                    Password
                  </FormLabel>
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    class="hover:text-gray-600"
                  >
                    {showPassword() ? (
                      <AiOutlineEyeInvisible />
                    ) : (
                      <AiOutlineEye />
                    )}
                  </button>
                </div>
                <A
                  href="/auth/forgot-password"
                  class="ml-auto inline-block text-sm underline"
                >
                  Forgot your password?
                </A>
              </div>
              <FormInput
                id="password"
                name="password"
                type={showPassword() ? 'text' : 'password'}
                required
                minLength={8}
              />
              <span class="text-sm text-red-500">
                {signinState.result?.fieldErrors.password?.[0]}
              </span>
            </div>
            <Button type="submit" disabled={signinState.pending} class="w-full">
              {signinState.pending ? (
                <AiOutlineLoading
                  class={
                    signinState.pending ? 'animate-spin w-5 h-5 ml-4' : 'hidden'
                  }
                />
              ) : (
                'Sign in'
              )}
            </Button>
            <A
              class={cn(buttonVariants({ variant: 'default' }), 'w-full')}
              href="/auth/magic-link"
            >
              Sign in with magic link
            </A>
          </section>
          <div class="mt-4 text-center text-sm">
            Don&apos;t have an account?{' '}
            <A href="/auth/signup" class="underline">
              Sign up
            </A>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
