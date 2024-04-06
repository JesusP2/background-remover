import { JSX } from "solid-js";

export default function AuthLayout({ children }: { children: JSX.Element }) {
  return (
  <div class="grid place-items-center">{children}</div>
  )
}
