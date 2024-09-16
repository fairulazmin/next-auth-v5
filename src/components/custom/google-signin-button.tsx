import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import { googleSignIn } from "@/app/auth/auth-actions";

export const GoogleSignIn = () => {
  return (
    <form action={googleSignIn}>
      <Button type="submit" variant="outline" className="w-full">
        <Icons.google className="h-4 w-4 mr-2" />
        Google
      </Button>
    </form>
  );
};
