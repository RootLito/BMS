"use client";

import React, { useState, useEffect } from "react";
import {
  Pencil,
  FileText,
  Briefcase,
  ShieldCheck,
  CalendarIcon,
} from "lucide-react";
import { format } from "date-fns";
import { toast, Toaster } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";

export default function SettingsPage() {
  const [formData, setFormData] = useState({
    fullname: "",
    gender: "",
    birthday: null,
    civilStatus: "",
    address: "",
    office: "",
    unit: "",
    username: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch("/api/users/info");
        if (response.ok) {
          const data = await response.json();
          setFormData((prev) => ({
            ...prev,
            ...data,
            birthday: data.birthday ? new Date(data.birthday) : null,
          }));
        }
      } catch (error) {
        toast.error("Failed to load user profile");
      } finally {
        setFetching(false);
      }
    };
    fetchUserData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async (section) => {
    setLoading(true);
    try {
      if (section === "security" && formData.newPassword) {
        if (formData.newPassword !== formData.confirmPassword) {
          toast.error("New passwords do not match!");
          setLoading(false);
          return;
        }
      }

      const response = await fetch("/api/users/info", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, ...formData }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(
          `${section.charAt(0).toUpperCase() + section.slice(1)} updated successfully`,
        );
      } else {
        toast.error(result.message || "Update failed");
      }
    } catch (error) {
      toast.error("A server error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (fetching)
    return (
      <div className="flex h-screen items-center justify-center animate-pulse">
        Loading Profile...
      </div>
    );

  return (
    <div className="flex-1 bg-gray-50/50 overflow-y-auto font-sans antialiased">
      <Toaster position="bottom-right" richColors />

      <div className="max-w-[750px] mx-auto flex flex-col p-8">
        <div className="mb-10 text-left">
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-xs text-muted-foreground mt-2">
            Manage your BFAR profile and security.
          </p>
        </div>

        {/* PERSONAL INFORMATION */}
        <Card className="mb-6 border-gray-200">
          <CardHeader className="border-b pb-4 mb-5 flex flex-row items-center justify-between space-y-0 bg-white rounded-t-lg">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" /> Personal
              Information
            </CardTitle>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 h-9 px-3">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden border-none shadow-2xl">
                <DialogHeader className="p-6 border-b bg-gray-50/80 text-left">
                  <DialogTitle className="text-xl font-bold">
                    Edit Personal Details
                  </DialogTitle>
                </DialogHeader>
                <div className="p-6 grid gap-5">
                  <ModalInput
                    label="Full Name"
                    name="fullname"
                    value={formData.fullname}
                    onChange={handleChange}
                  />

                  {/* GENDER SELECT */}
                  <div className="grid grid-cols-4 items-center gap-4 text-left">
                    <Label className="text-right text-[11px] font-bold uppercase text-muted-foreground">
                      Gender
                    </Label>
                    <Select
                      onValueChange={(v) =>
                        setFormData({ ...formData, gender: v })
                      }
                      value={formData.gender}
                    >
                      <SelectTrigger className="col-span-3 h-10">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* BIRTHDAY PICKER */}
                  <div className="grid grid-cols-4 items-center gap-4 text-left">
                    <Label className="text-right text-[11px] font-bold uppercase text-muted-foreground">
                      Birthday
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="col-span-3 justify-start font-normal h-10"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 text-blue-600" />
                          {formData.birthday ? (
                            format(formData.birthday, "PPP")
                          ) : (
                            <span>Select date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          captionLayout="dropdown"
                          selected={formData.birthday}
                          onSelect={(d) =>
                            setFormData({ ...formData, birthday: d })
                          }
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* CIVIL STATUS SELECT */}
                  <div className="grid grid-cols-4 items-center gap-4 text-left">
                    <Label className="text-right text-[11px] font-bold uppercase text-muted-foreground">
                      Status
                    </Label>
                    <Select
                      onValueChange={(v) =>
                        setFormData({ ...formData, civilStatus: v })
                      }
                      value={formData.civilStatus}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Single">Single</SelectItem>
                        <SelectItem value="Married">Married</SelectItem>
                        <SelectItem value="Divorced">Divorced</SelectItem>
                        <SelectItem value="Widowed">Widowed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <ModalInput
                    label="Address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                  />
                </div>
                <DialogFooter className="p-6 border-t bg-gray-50/80">
                  <Button
                    onClick={() => handleUpdate("personal")}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {loading ? "Saving..." : "Save Changes"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>

          <CardContent className="grid grid-cols-2 gap-x-12 gap-y-6 px-6 pb-6 text-left">
            <InfoDisplay label="Full Name" value={formData.fullname} />
            <InfoDisplay label="Gender" value={formData.gender} />
            <InfoDisplay
              label="Birthday"
              value={
                formData.birthday ? format(formData.birthday, "PPP") : "Not Set"
              }
            />
            <InfoDisplay label="Civil Status" value={formData.civilStatus} />
            <div className="col-span-2">
              <InfoDisplay label="Current Address" value={formData.address} />
            </div>
          </CardContent>
        </Card>

        {/* OFFICE INFORMATION */}
        <Card className="mb-6 border-gray-200">
          <CardHeader className="border-b pb-4 mb-5 flex flex-row items-center justify-between space-y-0 bg-white rounded-t-lg">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-blue-600" /> Office Information
            </CardTitle>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 h-9 px-3">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl">
                <DialogHeader className="p-6 border-b bg-gray-50/80 text-left">
                  <DialogTitle className="text-xl font-bold">
                    Edit Office Info
                  </DialogTitle>
                </DialogHeader>
                <div className="p-6 grid gap-5">
                  <ModalInput
                    label="Bureau"
                    name="office"
                    value={formData.office}
                    onChange={handleChange}
                  />
                  <ModalInput
                    label="Unit"
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                  />
                </div>
                <DialogFooter className="p-6 border-t bg-gray-50/80">
                  <Button
                    onClick={() => handleUpdate("office")}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {loading ? "Saving..." : "Save Changes"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-x-12 px-6 pb-6 text-left">
            <InfoDisplay label="Office" value={formData.office} />
            <InfoDisplay label="Unit" value={formData.unit} />
          </CardContent>
        </Card>

        {/* SECURITY */}
        <Card className="border-gray-200">
          <CardHeader className="border-b pb-4 mb-5 bg-white rounded-t-lg text-left">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-red-600" /> Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-6 pb-6 text-left">
            <SecurityItem
              title="Username"
              desc={`Current: ${formData.username}`}
              btnText="Update"
              modalTitle="Change Username"
              onAction={() => handleUpdate("security")}
              loading={loading}
            >
              <ModalInput
                label="Username"
                name="username"
                value={formData.username}
                onChange={handleChange}
              />
            </SecurityItem>

            <SecurityItem
              title="Password"
              desc="Change your account password."
              btnText="Change"
              isPrimary
              modalTitle="Change Password"
              onAction={() => handleUpdate("security")}
              loading={loading}
            >
              <div className="space-y-4 w-full">
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                    Current Password
                  </Label>
                  <Input
                    type="password"
                    name="currentPassword"
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                    New Password
                  </Label>
                  <Input
                    type="password"
                    name="newPassword"
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                    Confirm Password
                  </Label>
                  <Input
                    type="password"
                    name="confirmPassword"
                    onChange={handleChange}
                  />
                </div>
              </div>
            </SecurityItem>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InfoDisplay({ label, value }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="text-sm font-semibold text-gray-900">{value || "---"}</p>
    </div>
  );
}

function ModalInput({ label, value, name, onChange }) {
  return (
    <div className="grid grid-cols-4 items-center gap-4 text-left">
      <Label className="text-right text-[11px] font-bold uppercase text-muted-foreground">
        {label}
      </Label>
      <Input
        name={name}
        value={value}
        onChange={onChange}
        className="col-span-3 h-10"
      />
    </div>
  );
}

function SecurityItem({
  title,
  desc,
  btnText,
  isPrimary,
  modalTitle,
  children,
  onAction,
  loading,
}) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-xl bg-white hover:border-blue-100 transition-all">
      <div className="space-y-1">
        <p className="text-sm font-bold text-gray-900">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant={isPrimary ? "default" : "outline"}
            size="sm"
            className={cn(isPrimary && "bg-blue-600 hover:bg-blue-700")}
          >
            {btnText}
          </Button>
        </DialogTrigger>
        <DialogContent className="p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-6 border-b bg-gray-50/80 text-left">
            <DialogTitle className="text-xl font-bold">
              {modalTitle}
            </DialogTitle>
          </DialogHeader>
          <div className="p-6">{children}</div>
          <DialogFooter className="p-6 border-t bg-gray-50/80">
            <Button
              onClick={onAction}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? "Updating..." : "Update Now"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
