import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Button } from '~/components/ui/button';

export default function Signin() {
  return (
    <div class="font-geist rounded-lg border bg-card text-card-foreground shadow-sm mx-auto max-w-sm">
      <div class="lex flex-col space-y-1.5 p-6">
        <h3 class="font-semibold tracking-tight text-2xl">Login</h3>
        <p class="text-sm text-muted-foreground">
          Enter your email below to login to your account
        </p>
      </div>
      <div class="p-6 pt-0">
        <form class="grid gap-4" method="post" action="/api/auth/signin">
          <div class="grid gap-2">
            <Label class="h-4" for="username">
              Username
            </Label>
            <Input name="username" id="username" placeholder="username" />
          </div>
          <div class="grid gap-2">
            <div class="flex items-center">
              <Label for="password">Password</Label>
              <a href="auth/reset-password" class="ml-auto inline-block text-sm underline">
                Forgot your password?
              </a>
            </div>
            <Input name="password" type="password" id="password" />
          </div>
          <Button class="w-full">Login</Button>
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
