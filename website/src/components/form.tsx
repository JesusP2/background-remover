import { PolymorphicProps } from '@kobalte/core/polymorphic';
import { type ComponentProps, splitProps, ValidComponent } from 'solid-js';
import {
  TextField,
  textFieldInputProps,
  TextFieldRoot,
} from '~/components/ui/textfield';
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

export function FormInput<T extends ValidComponent = 'input'>(
  props: PolymorphicProps<T, textFieldInputProps<T>>,
) {
  const [, rest] = splitProps(props, ['class']);
  return (
    <TextFieldRoot>
      {/*@ts-ignore idk*/}
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
