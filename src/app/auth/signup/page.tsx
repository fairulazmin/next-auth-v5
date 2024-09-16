"use client";

import Link from "next/link";
import { redirect } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormItem,
  FormField,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { signUpSchema, SignUpValues } from "@/app/auth/auth-type";
import { company } from "@/lib/def";
import { createUser } from "../auth-actions";
import { GoogleSignIn } from "@/components/custom/google-signin-button";

const SignUpPage = () => {
  const [isLoading, startTransition] = useTransition();

  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: SignUpValues) => {
    startTransition(async () => {
      const login = await createUser(values);
      if (login.error) {
        toast({
          title: "Toast",
          description: login.error,
          variant: "destructive",
          duration: 2000,
        });
      }
      toast({
        title: "Toast",
        description: login.success,
        duration: 2000,
      });
      redirect("/");
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Register</CardTitle>
          <CardDescription>Enter your email below to register</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="grid gap-4"
                >
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input
                              className="pr-32"
                              placeholder="username"
                              disabled={isLoading}
                              {...field}
                            />
                          </FormControl>
                          <span className="absolute right-1 top-2 mr-2 text-muted-foreground">
                            @{company.email_domain}
                          </span>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            disabled={isLoading}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={isLoading} className="w-full">
                    Register
                    {isLoading && (
                      <Loader2 className="ml-2 w-4 h-4 animate-spin" />
                    )}
                  </Button>
                </form>
              </Form>
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>
            <GoogleSignIn />
          </div>
          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link href="/auth/signin" className="underline">
              Sign In
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignUpPage;
