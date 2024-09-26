import { verifyEmailAction } from '~/lib/actions/update-profile';
import {
  OTPField,
  OTPFieldGroup,
  OTPFieldInput,
  OTPFieldSeparator,
  OTPFieldSlot,
} from './ui/otp-field';
import { useSubmission } from '@solidjs/router';
import { Button } from './ui/button';

export const OTPForm = () => {
  const verifyEmailState = useSubmission(verifyEmailAction);
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
        {verifyEmailState.result?.fieldErrors?.code[0] ||
          verifyEmailState.result?.fieldErrors?.form[0]}
      </span>
      <Button class="w-full mt-6">Verify</Button>
    </form>
  );
};
