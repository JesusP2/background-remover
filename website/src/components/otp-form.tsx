import {
  OTPField,
  OTPFieldGroup,
  OTPFieldInput,
  OTPFieldSeparator,
  OTPFieldSlot,
} from './ui/otp-field';
import { useSubmission } from '@solidjs/router';
import { Button } from './ui/button';
import { verifyEmailAction } from '~/lib/actions/verify-email';
import { createEffect } from 'solid-js';
import { AiOutlineLoading } from 'solid-icons/ai';

export const OTPForm = (props: { onSuccess: () => void }) => {
  const verifyEmailState = useSubmission(verifyEmailAction);
  createEffect(() => {
    if (verifyEmailState.result?.message === null) {
      props.onSuccess();
    }
  });
  return (
    <form method="post" action={verifyEmailAction}>
      <OTPField maxLength={6}>
        <OTPFieldInput name="code" />
        <OTPFieldGroup>
          <OTPFieldSlot index={0} />
          <OTPFieldSlot index={1} />
          <OTPFieldSlot index={2} />
        </OTPFieldGroup>
        <OTPFieldSeparator />
        <OTPFieldGroup>
          <OTPFieldSlot index={3} />
          <OTPFieldSlot index={4} />
          <OTPFieldSlot index={5} />
        </OTPFieldGroup>
      </OTPField>
      <span class="text-sm text-red-500">
        {verifyEmailState.result?.fieldErrors?.code.at(0) ||
          verifyEmailState.result?.fieldErrors?.form.at(0)}
      </span>
      <Button
        type="submit"
        disabled={verifyEmailState.pending}
        class="w-full mt-6"
      >
        {verifyEmailState.pending ? (
          <AiOutlineLoading
            class={
              verifyEmailState.pending ? 'animate-spin w-5 h-5 ml-4' : 'hidden'
            }
          />
        ) : (
          'Verify'
        )}
      </Button>
    </form>
  );
};
