"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast, Toaster } from "sonner"; // Using Sonner instead

export default function Register() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullname: "",
    username: "",
    password: "",
    office: "",
    unit: ""
  });
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        // Sonner syntax is much cleaner:
        toast.success("Successfully Registered!", {
          description: `Account for ${formData.fullname} is now ready.`,
        });

        // Clear the inputs
        setFormData({
          fullname: "",
          username: "",
          password: "",
          office: "",
          unit: ""
        });
      } else {
        const data = await res.json();
        setError(data.message || "Registration failed");
        toast.error(data.message || "Registration failed");
      }
    } catch (err) {
      setError("Server connection failed.");
      toast.error("Connection error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      {/* Sonner Toaster component stays here just for this page */}
      <Toaster richColors position="top-center" />

      <form onSubmit={handleSubmit} className="p-8 bg-white shadow-lg rounded-xl w-full max-w-md space-y-4">
        <h2 className="text-3xl font-bold text-center text-gray-800">Register</h2>
        <p className="text-center text-gray-500 mb-6">Regional Fisheries Unit Access</p>
        
        {error && <p className="bg-red-100 text-red-600 p-2 rounded text-sm text-center">{error}</p>}
        
        <Input 
          placeholder="Full Name" 
          value={formData.fullname}
          onChange={(e) => setFormData({...formData, fullname: e.target.value})} 
          required 
        />
        <Input 
          placeholder="Username" 
          value={formData.username}
          onChange={(e) => setFormData({...formData, username: e.target.value})} 
          required 
        />
        <Input 
          placeholder="Office (e.g., Central Office)" 
          value={formData.office}
          onChange={(e) => setFormData({...formData, office: e.target.value})} 
          required 
        />
        <Input 
          placeholder="Unit (e.g., IT Section)" 
          value={formData.unit}
          onChange={(e) => setFormData({...formData, unit: e.target.value})} 
          required 
        />
        <Input 
          type="password" 
          placeholder="Password" 
          value={formData.password}
          onChange={(e) => setFormData({...formData, password: e.target.value})} 
          required 
        />
        
        <Button type="submit" className="w-full py-6 text-lg" disabled={loading}>
          {loading ? "Registering..." : "Create Account"}
        </Button>
        
        <p className="text-sm text-center text-gray-600">
          Already registered? <a href="/" className="text-blue-600 font-semibold hover:underline">Sign In</a>
        </p>
      </form>
    </div>
  );
}