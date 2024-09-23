import { useParams, useSubmission } from '@solidjs/router';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'solid-icons/ai';
import { createSignal } from 'solid-js';
import { FormInput, FormLabel } from '~/components/form';
import { Button } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { resetPasswordConfirmationAction } from '~/lib/actions/reset-password';

export default function ResetPasswordToken() {
  const params = useParams();
  const resetPasswordState = useSubmission(resetPasswordConfirmationAction);
  const [viewPass, setViewPass] = createSignal(false);
  return (
    <main class="grid place-items-center h-screen">
      <Card class="max-w-sm">
        <CardHeader>
          <CardTitle class="text-2xl text-center">Password reset</CardTitle>
          <CardDescription class="text-center">Change password</CardDescription>
        </CardHeader>
        <CardContent class="pt-6 grid place-items-center">
          <form method="post" action={resetPasswordConfirmationAction}>
            <div class="grid gap-2">
              <div class="flex items-center gap-x-4">
                <FormLabel htmlFor="password">New password</FormLabel>
                <button
                  type="button"
                  onClick={() => setViewPass((prev) => !prev)}
                  class="hover:text-gray-600"
                >
                  {viewPass() ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
                </button>
              </div>
              <FormInput
                id="password"
                name="password"
                type={viewPass() ? 'text' : 'password'}
                required
                minLength={8}
              />
              <input hidden value={params.token} name="token" id="token" />
              <span class="text-sm text-red-500">
                {resetPasswordState.result?.fieldErrors?.password}
              </span>
            </div>
            <Button class="w-full mt-4">Change password</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
