import { signOut } from "@/auth";

export const Logout = () => {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/auth/signin" });
      }}
    >
      <button type="submit">Logout</button>
    </form>
  );
};
