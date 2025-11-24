import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AuthSchema } from "@/lib/validations/auth";
import { z } from "zod";
import { Link } from "react-router-dom";
import Logo from "@/components/ui/Logo";

import { useNavigate } from "react-router-dom";
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

import { Eye, EyeOff } from "lucide-react";

const Register = () => {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof AuthSchema>>({
    resolver: zodResolver(AuthSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof AuthSchema>) => {
    setLoading(true);

    const { email, password } = values;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Account created! Check your email to confirm.");
    navigate("/login");
  };

  return (
    <div className="w-full h-dvh flex flex-col">
      <div className="w-full px-6 py-4" onClick={() => navigate("/")}>
        <Logo />
      </div>
      <main className="flex-1 w-full flex items-start justify-center px-6 py-20 lg:py-30 md:p-10">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="max-w-lg w-full flex flex-col items-center justify-center gap-7"
          >
            <div className="w-full flex flex-col gap-1">
              <h1 className="text-3xl lg:text-4xl font-grotesk font-semibold text-neutral-800">
                Welcome to PollUp
              </h1>
              <p className="text-sm font-grotesk text-neutral-500">
                Create an account to get started.
              </p>
            </div>

            <div className="w-full flex flex-col gap-5">
              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel className="font-grotesk text-neutral-800">
                      Email
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

              {/* Password */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel className="font-grotesk text-neutral-800">
                      Password
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          className="h-10 focus-visible:border-teal-200 focus-visible:ring-teal-100/50 caret-teal-800 font-grotesk text-sm text-neutral-700 placeholder:text-neutral-300"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter passsword here"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        >
                          {showPassword ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Confirm Password */}
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
                          className="h-10 focus-visible:border-teal-200 focus-visible:ring-teal-100/50 caret-teal-800 font-grotesk text-sm text-neutral-700 placeholder:text-neutral-300"
                          placeholder="Enter password again"
                          type={showConfirm ? "text" : "password"}
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm(!showConfirm)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        >
                          {showConfirm ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="w-full flex flex-col gap-2">
              <Button
                type="submit"
                disabled={loading}
                className="w-full text-white bg-teal-600 hover:bg-teal-500 cursor-pointer font-grotesk"
                size="lg"
              >
                {loading ? "Creating account..." : "Register"}
              </Button>

              <p className="mt-4 font-grotesk text-sm text-neutral-600">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-medium text-teal-600 hover:text-teal-500"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </Form>
      </main>
    </div>
  );
};

export default Register;
