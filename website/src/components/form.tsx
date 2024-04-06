import { ComponentProps, splitProps } from 'solid-js';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { cn } from '~/lib/utils';

interface FormLabelProps extends ComponentProps<'label'> {
  error?: boolean;
}
export function FormLabel(props: FormLabelProps) {
  const [, rest] = splitProps(props, ['class']);
  return (
    <Label
      class={cn(props.error ? 'text-destructive' : '', props.class)}
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
      class={cn(
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
      class={cn(props.error ? 'text-destructive' : '', props.class, 'text-sm')}
      {...rest}
    />
  );
}
