import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import Logo from "@/components/ui/Logo";
import { supabase } from "@/api/supabaseClient";
import { toast } from "sonner";
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
import { Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

const ResetPassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordReset, setPasswordReset] = useState(false);
  const [validToken, setValidToken] = useState<boolean | null>(null);

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    // Check if we have a valid session from the reset link
    const checkSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error || !session) {
        setValidToken(false);
        toast.error("Invalid or expired reset link");
      } else {
        setValidToken(true);
      }
    };

    checkSession();
  }, []);

  const onSubmit = async (values: ResetPasswordFormData) => {
    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: values.password,
      });

      if (error) throw error;

      setPasswordReset(true);
      toast.success("Password updated successfully!");

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (error: any) {
      console.error("Error updating password:", error);
      toast.error(error.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  // Invalid token state
  if (validToken === false) {
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
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>

              <div className="text-center">
                <h1 className="text-3xl lg:text-4xl font-grotesk font-semibold text-neutral-800 mb-2">
                  Invalid Reset Link
                </h1>
                <p className="text-sm font-grotesk text-neutral-500">
                  This password reset link is invalid or has expired.
                </p>
              </div>
            </div>

            <div className="w-full bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-900 font-grotesk">
                Password reset links expire after 1 hour. Please request a new
                one.
              </p>
            </div>

            <Button
              onClick={() => navigate("/forgot-password")}
              className="w-full bg-teal-600 hover:bg-teal-500 text-white cursor-pointer font-grotesk"
              size="lg"
            >
              Request New Reset Link
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Success state
  if (passwordReset) {
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
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>

              <div className="text-center">
                <h1 className="text-3xl lg:text-4xl font-grotesk font-semibold text-neutral-800 mb-2">
                  Password Reset Successful!
                </h1>
                <p className="text-sm font-grotesk text-neutral-500">
                  Your password has been updated successfully.
                </p>
              </div>
            </div>

            <div className="w-full bg-teal-50 border border-teal-200 rounded-lg p-4">
              <p className="text-sm text-teal-900 font-grotesk text-center">
                Redirecting you to login page...
              </p>
            </div>

            <Button
              onClick={() => navigate("/login")}
              className="w-full bg-teal-600 hover:bg-teal-500 text-white cursor-pointer font-grotesk"
              size="lg"
            >
              Go to Login
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Loading state while checking token
  if (validToken === null) {
    return (
      <div className="w-full h-dvh flex flex-col">
        <div
          className="w-full px-6 py-4 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <Logo />
        </div>
        <main className="flex-1 w-full flex items-center justify-center px-6">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm font-grotesk text-neutral-500">
              Verifying reset link...
            </p>
          </div>
        </main>
      </div>
    );
  }

  // Main reset password form
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
          <div className="w-full flex flex-col gap-1">
            <h1 className="text-3xl lg:text-4xl font-grotesk font-semibold text-neutral-800">
              Set New Password
            </h1>
            <p className="text-sm font-grotesk text-neutral-500 mt-2">
              Please enter your new password. Make sure it's strong and secure.
            </p>
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="w-full flex flex-col gap-5"
            >
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel className="font-grotesk text-neutral-800">
                      New Password
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          className="h-10 pr-10 focus-visible:border-teal-200 focus-visible:ring-teal-100/50 caret-teal-800 font-grotesk text-sm text-neutral-700 placeholder:text-neutral-300"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter new password"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel className="font-grotesk text-neutral-800">
                      Confirm Password
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          className="h-10 pr-10 focus-visible:border-teal-200 focus-visible:ring-teal-100/50 caret-teal-800 font-grotesk text-sm text-neutral-700 placeholder:text-neutral-300"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm new password"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
                <p className="text-xs font-grotesk text-neutral-600 font-medium mb-2">
                  Password must contain:
                </p>
                <ul className="text-xs font-grotesk text-neutral-500 space-y-1">
                  <li>• At least 8 characters</li>
                  <li>• One uppercase letter</li>
                  <li>• One lowercase letter</li>
                  <li>• One number</li>
                </ul>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full text-white bg-teal-600 hover:bg-teal-500 cursor-pointer font-grotesk"
                size="lg"
              >
                {loading ? "Updating..." : "Reset Password"}
              </Button>
            </form>
          </Form>
        </div>
      </main>
    </div>
  );
};

export default ResetPassword;
