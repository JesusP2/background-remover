import { ComponentProps, splitProps } from 'solid-js';
import { Label } from './ui/label';
import clsx from 'clsx';
import { Input } from './ui/input';

interface FormLabelProps extends ComponentProps<'label'> {
  error?: boolean;
}
export function FormLabel(props: FormLabelProps) {
  const [, rest] = splitProps(props, ['class']);
  return (
    <Label
      class={clsx(props.error ? 'text-destructive' : '', props.class)}
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
    <Input
      class={clsx(
        props.error ? 'border-destructive focus-visible:ring-destructive' : '',
        props.class,
      )}
      {...rest}
    />
  );
}

interface FormMessageProps extends ComponentProps<'span'> {
  error?: boolean;
}
export function FormMessage(props: FormMessageProps) {
  const [, rest] = splitProps(props, ['class']);
  return (
    <span
      class={clsx(props.error ? 'text-destructive' : '', props.class, 'text-sm')}
      {...rest}
    />
  );
}
