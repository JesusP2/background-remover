import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';

export default function SignIn() {
  return (
    <div class="font-geist rounded-lg border bg-card text-card-foreground shadow-sm mx-auto max-w-sm">
      <div class="lex flex-col space-y-1.5 p-6">
        <h3 class="font-semibold tracking-tight text-2xl">Login</h3>
        <p class="text-sm text-muted-foreground">
          Enter your email below to login to your account
        </p>
      </div>
      <div class="p-6 pt-0">
        <div class="grid w-full max-w-sm items-center gap-1.5">
          <Label for="email">Email</Label>
          <Input type="email" id="email" placeholder="Email" />
        </div>
      </div>
    </div>
  );
}
