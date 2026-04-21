"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        username,
        password,
        redirect: false, 
      });

      if (res?.error) {
        setError("Invalid username or password");
        setLoading(false);
      } else {
        router.push("/chats/home");
        router.refresh();
      }
    } catch (err) {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-screen bg-gray-100">
      <div className="w-[1500px] h-full m-auto flex items-center">
        <div className="w-1/2">
          <h1 className="text-4xl font-bold mb-4">BFAR</h1>
          <p className="text-lg text-gray-700">
            BFAR Messaging System (BMS) is a web-based application designed to
            facilitate communication and information sharing within the Bureau
            of Fisheries and Aquatic Resources (BFAR).
          </p>
        </div>
        <div className="w-1/2 flex justify-center">
          <form onSubmit={handleLogin} className="w-full max-w-sm bg-white p-8 rounded-xl shadow-sm">
            <FieldSet>
              <h2 className="text-2xl font-bold mb-6">Login to BMS</h2>
              
              {error && (
                <p className="text-red-500 text-sm mb-4 bg-red-50 p-2 rounded border border-red-100">
                  {error}
                </p>
              )}

              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="username">Username</FieldLabel>
                  <Input 
                    id="username" 
                    type="text" 
                    placeholder="Enter username" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </Field>
              </FieldGroup>
              
              <Button type="submit" className="w-full mt-6" disabled={loading}>
                {loading ? "Verifying..." : "Login"}
              </Button>

              <p className="text-sm text-center mt-4 text-gray-600">
                Don't have an account? <a href="/register" className="text-blue-600 hover:underline">Register here</a>
              </p>
            </FieldSet>
          </form>
        </div>
      </div>
    </div>
  );
}