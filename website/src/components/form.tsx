import { type ComponentProps, splitProps } from 'solid-js';
import { TextField, TextFieldRoot } from '~/components/ui/textfield';
import { cn } from '~/lib/utils';

interface FormLabelProps extends ComponentProps<'label'> {
  error?: boolean;
  htmlFor?: string;
}
export function FormLabel(props: FormLabelProps) {
  const [, rest] = splitProps(props, ['class']);
  return (
    <label
      class={cn(
        props.error ? 'text-destructive text-sm' : 'text-sm',
        props.class,
      )}
      {...rest}
    />
  );
}

interface FormInputProps extends ComponentProps<'input'> {
  error?: boolean;
}
export function FormInput(props: FormInputProps) {
  const [, rest] = splitProps(props, ['class']);
  return (
    <TextFieldRoot>
      <TextField
        class={cn(
          props.error
            ? 'border-destructive focus-visible:ring-destructive'
            : '',
          props.class,
        )}
        {...rest}
      />
    </TextFieldRoot>
  );
}

interface FormMessageProps extends ComponentProps<'span'> {
  error?: boolean;
}
export function FormMessage(props: FormMessageProps) {
  const [, rest] = splitProps(props, ['class']);
  return (
    <span
      class={cn(props.error ? 'text-destructive' : '', props.class, 'text-sm')}
      {...rest}
    />
  );
}
