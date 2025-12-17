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

import { Eye, EyeOff } from "lucide-react";

const LoginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof LoginSchema>) => {
    setLoading(true);

    const { email, password } = values;

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Login successful!");
    navigate("/dashboard");
  };

  return (
    <div className="relative w-full h-dvh flex flex-col">
      <div className="w-full px-6 py-4" onClick={() => navigate("/")}>
        <Logo />
      </div>
      <main className="flex-1 w-full flex items-start justify-center px-6 py-20 md:p-10 lg:py-30">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="max-w-lg w-full flex flex-col items-center justify-center gap-7"
          >
            <div className="w-full flex flex-col gap-1">
              <h1 className="text-3xl lg:text-4xl font-grotesk font-semibold text-neutral-800">
                Welcome Back
              </h1>
              <p className="text-sm font-grotesk text-neutral-500">
                Log in to continue.
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
                          placeholder="Enter password"
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
            </div>

            <div className="w-full flex flex-col gap-2">
              <Button
                type="submit"
                disabled={loading}
                className="w-full text-white bg-teal-600 hover:bg-teal-500 cursor-pointer font-grotesk"
                size="lg"
              >
                {loading ? "Logging in..." : "Login"}
              </Button>

              <div className="flex flex-col gap-0.5">
                <p className="mt-4 font-grotesk text-sm text-neutral-600">
                  Don't have an account?{" "}
                  <Link
                    to="/register"
                    className="font-medium text-teal-600 hover:text-teal-500"
                  >
                    Sign up
                  </Link>
                </p>

                <p className="mt-4 font-grotesk text-sm text-neutral-600">
                  Forgot Password?{" "}
                  <Link
                    to="/forgot-password"
                    className="font-medium text-teal-600 hover:text-teal-500"
                  >
                    Reset it
                  </Link>
                </p>
              </div>
            </div>
          </form>
        </Form>
      </main>
    </div>
  );
}
