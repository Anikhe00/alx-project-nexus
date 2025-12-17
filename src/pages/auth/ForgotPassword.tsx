import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/api/supabaseClient";
import { toast } from "sonner";
import Logo from "@/components/ui/Logo";
import { Link } from "react-router-dom";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormControl,
} from "@/components/ui/form";

import { ArrowLeft, CheckCircle2 } from "lucide-react";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [emailSent, setEmailSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof forgotPasswordSchema>) => {
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        values.email,
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (error) throw error;

      setEmailSent(true);
      toast.success("Password reset email sent!");
    } catch (error: any) {
      console.error("Error sending reset email:", error);
      toast.error(error.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="w-full h-dvh flex flex-col">
        <div
          className="w-full px-6 py-4 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <Logo />
        </div>
        <main className="flex-1 w-full flex items-start justify-center px-6 py-20 lg:py-30 md:p-10">
          <div className="max-w-lg w-full flex flex-col items-center justify-center gap-7">
            <div className="w-full flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-teal-100 border border-teal-200 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-teal-600" />
              </div>

              <div className="text-center">
                <h1 className="text-3xl lg:text-4xl font-grotesk font-semibold text-neutral-800 mb-2">
                  Check Your Email
                </h1>
                <p className="text-sm font-grotesk text-neutral-500">
                  <span>We've sent a password reset link to</span>{" "}
                  <span className="text-neutral-800">
                    {form.getValues("email")}
                  </span>
                </p>
              </div>
            </div>

            <div className="w-full bg-teal-50 border border-teal-200 rounded-lg p-4">
              <p className="text-sm text-teal-900 font-grotesk">
                <strong>Note:</strong> The link will expire in 1 hour. If you
                don't see the email, check your spam folder.
              </p>
            </div>

            <div className="w-full flex flex-col gap-3">
              <Button
                onClick={() => navigate("/login")}
                className="w-full bg-teal-600 hover:bg-teal-500 text-white cursor-pointer font-grotesk"
                size="lg"
              >
                Back to Login
              </Button>

              <button
                onClick={() => setEmailSent(false)}
                className="group text-sm gap-1 flex items-center justify-center text-neutral-600 hover:text-neutral-800 font-grotesk"
              >
                Didn't receive the email?
                <span className="text-teal-600 font-medium group-hover:text-teal-700 cursor-pointer">
                  Try again
                </span>
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="w-full h-dvh flex flex-col">
      <div
        className="w-full px-6 py-4 cursor-pointer"
        onClick={() => navigate("/")}
      >
        <Logo />
      </div>
      <main className="flex-1 w-full flex items-start justify-center px-6 py-20 lg:py-30 md:p-10">
        <div className="max-w-lg w-full flex flex-col items-start justify-center gap-7">
          <div className="w-full flex flex-col gap-1">
            <button
              onClick={() => navigate("/login")}
              className="flex group hover:text-teal-500 cursor-pointer items-center gap-2 text-sm text-neutral-600  mb-4 font-grotesk"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to login
            </button>

            <h1 className="text-3xl lg:text-4xl font-grotesk font-semibold text-neutral-800">
              Forgot Password?
            </h1>
            <p className="text-sm font-grotesk text-neutral-500 mt-2">
              No worries! Enter your email address and we'll send you a link to
              reset your password.
            </p>
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="w-full flex flex-col gap-5"
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel className="font-grotesk text-neutral-800">
                      Email Address
                    </FormLabel>
                    <FormControl>
                      <Input
                        className="h-10 focus-visible:border-teal-200 focus-visible:ring-teal-100/50 caret-teal-800 font-grotesk text-sm text-neutral-700 placeholder:text-neutral-300"
                        type="email"
                        placeholder="you@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={loading}
                className="w-full text-white bg-teal-600 hover:bg-teal-500 cursor-pointer font-grotesk"
                size="lg"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
          </Form>

          <div className="text-center">
            <p className="text-sm font-grotesk text-neutral-600">
              Remember your password?{" "}
              <Link
                to="/login"
                className="font-medium text-teal-600 hover:text-teal-500"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
