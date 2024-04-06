export default function About() {
  return (
    <main class="text-center mx-auto text-gray-700 p-4">
      <form method="post" action="/api/auth/signin">
        <label>
          username
          <input name="username" value="lotuspixie" />
        </label>
        <label>
          passowrd
          <input name="password" type="password" value="password123" />
        </label>
        <button type="submit">create user</button>
      </form>
    </main>
  );
}
