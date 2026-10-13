import { Daybook } from "./_daybook/daybook";

/* The whole app runs in the browser: tasks live in this device's storage,
   so the server sends the same shell to everyone. */
export default function Home() {
  return <Daybook />;
}
