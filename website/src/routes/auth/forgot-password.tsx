import { useSubmission } from '@solidjs/router';
import { createEffect, createSignal, Match, Switch } from 'solid-js';
import { FormInput, FormLabel } from '~/components/form';
import { Button } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { resetPasswordEmailAction } from '~/lib/actions/reset-password';
import { FaSolidCircleCheck } from 'solid-icons/fa';

export default function ForgotPassword() {
  const [isEmailSent, toggleEmailState] = createSignal(false);
  const resetPasswordState = useSubmission(resetPasswordEmailAction);
  createEffect(() => {
    if (resetPasswordState.result?.email) {
      toggleEmailState(true);
    }
  });
  return (
    <Switch>
      <Match when={isEmailSent()}>
        <Card class="max-w-sm">
          <CardHeader>
            <CardTitle class="text-2xl text-center">
              Email sent to {resetPasswordState.result?.email}
            </CardTitle>
          </CardHeader>
          <CardContent class="grid place-items-center">
            <FaSolidCircleCheck size={50} />
          </CardContent>
        </Card>
      </Match>
      <Match when={!isEmailSent()}>
        <Card class="max-w-sm">
          <CardHeader>
            <CardTitle class="text-2xl text-center">
              Email verification
            </CardTitle>
            <CardDescription class="text-center">
              Introduce an email to send a verification token
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form method="post" action={resetPasswordEmailAction}>
              <div class="grid gap-2 max-w-3xl mt-4">
                <FormLabel htmlFor="email" class="font-medium">
                  Email
                </FormLabel>
                <FormInput
                  id="email"
                  name="email"
                  type="email"
                  placeholder="example@app.com"
                />
                <span class="text-sm text-red-500">
                  {resetPasswordState.result?.fieldErrors?.email}
                </span>
              </div>
              <Button type="submit" class="w-full mt-8">
                Send email
              </Button>
            </form>
          </CardContent>
        </Card>
      </Match>
    </Switch>
  );
}
