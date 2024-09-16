import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";

const SettingsPage = async () => {
  const session = await auth();

  return (
    <div>
      <h1>Settings Page</h1>
      <pre>{JSON.stringify(session, null, 2)}</pre>
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/auth/signin" });
        }}
      >
        <Button type="submit">Sign out</Button>
      </form>
    </div>
  );
};

export default SettingsPage;
