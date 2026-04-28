"use client";

import React, { useState } from "react";
import {
  Pencil,
  FileText,
  Briefcase,
  ShieldCheck,
  CalendarIcon,
  Lock,
  UserCircle,
} from "lucide-react";
import { format } from "date-fns";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";

export default function SettingsPage() {
  const [date, setDate] = useState(new Date(2002, 1, 9));

  return (
    <div className="flex-1 bg-gray-50/50 overflow-y-auto font-sans antialiased">
      <div className="max-w-[750px] mx-auto flex flex-col p-8">
        <div className="mb-10">
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-xs text-muted-foreground mt-2">
            Update your BFAR profile and manage account security.
          </p>
        </div>

        <Card className="mb-6 border-gray-200">
          <CardHeader className="border-b pb-4 mb-5 flex flex-row items-center justify-between space-y-0 bg-white rounded-t-lg">
            <div className="space-y-1">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Personal Information
              </CardTitle>
              <CardDescription className="text-xs">
                Your official employee identification records.
              </CardDescription>
            </div>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 h-9 px-3">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px] p-0 gap-0 overflow-hidden border-none shadow-2xl">
                <DialogHeader className="p-6 border-b bg-gray-50/80 text-left">
                  <DialogTitle className="text-xl font-bold">
                    Edit Personal Details
                  </DialogTitle>
                  <DialogDescription>
                    Submit changes to your personal records.
                  </DialogDescription>
                </DialogHeader>
                <div className="p-6 grid gap-5">
                  <ModalInput label="Full Name" defaultValue="Juan Dela Cruz" />
                  <ModalInput label="Gender" defaultValue="Male" />
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Birthday
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="col-span-3 justify-start font-normal h-10"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 text-blue-600" />
                          {date ? (
                            format(date, "PPP")
                          ) : (
                            <span>Select date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={(d) => d && setDate(d)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <ModalInput label="Status" defaultValue="Active" />
                  <ModalInput label="Address" defaultValue="123 Fishery St." />
                </div>
                <DialogFooter className="p-6 border-t bg-gray-50/80">
                  <Button
                    type="submit"
                    className="w-full sm:w-auto px-8 bg-blue-600 hover:bg-blue-700"
                  >
                    Save Changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>

          <CardContent className="grid grid-cols-2 gap-x-12 gap-y-6 px-6 pb-6">
            <InfoDisplay label="Full Name" value="Angelito Sentillas Jr." />
            <InfoDisplay label="Gender" value="Male" />
            <InfoDisplay label="Birthday" value={format(date, "PPP")} />
            <InfoDisplay label="Civil Status" value="Married" />
            <div className="col-span-2">
              <InfoDisplay
                label="Current Address"
                value="Yñiquez-Subdivision, Ma-a, Davao City"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6 border-gray-200">
          <CardHeader className="border-b pb-4 mb-5 flex flex-row items-center justify-between space-y-0 bg-white rounded-t-lg">
            <div className="space-y-1">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-blue-600" /> Office
                Information
              </CardTitle>
              <CardDescription className="text-xs">
                Your current bureau assignment and unit.
              </CardDescription>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 h-9 px-3">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] p-0 gap-0 overflow-hidden border-none shadow-2xl">
                <DialogHeader className="p-6 border-b bg-gray-50/80 text-left">
                  <DialogTitle className="text-xl font-bold">
                    Edit Office Info
                  </DialogTitle>
                  <DialogDescription>
                    Submit changes to your office records.
                  </DialogDescription>
                </DialogHeader>
                <div className="p-6 grid gap-5">
                  <ModalInput
                    label="Bureau"
                    defaultValue="BFAR Central Office"
                  />
                  <ModalInput
                    label="Unit"
                    defaultValue="Information Technology Section"
                  />
                </div>
                <DialogFooter className="p-6 border-t bg-gray-50/80">
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Save Changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-x-12 px-6 pb-6">
            <InfoDisplay
              label="Office / Designation"
              value="Office of the   Regional Director"
            />
            <InfoDisplay
              label="Unit / Section / Division"
              value="Regional Information Management Unit"
            />
          </CardContent>
        </Card>

        {/* 3. SECURITY CARD */}
        <Card className=" border-gray-200">
          <CardHeader className="border-b pb-4 mb-5 bg-white rounded-t-lg">
            <div className="space-y-1">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-red-600" /> Security &
                Access
              </CardTitle>
              <CardDescription className="text-xs">
                Manage your credentials and login methods.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 px-6 pb-6 text-left">
            <SecurityItem
              title="Username"
              desc="Current: juandelacruz_bfar"
              btnText="Update"
              modalTitle="Change Username"
              modalDesc="This name will be visible to other members."
            >
              <ModalInput label="Username" placeholder="New username" />
            </SecurityItem>

            <SecurityItem
              title="Account Password"
              desc="Change your password regularly to stay secure."
              btnText="Change Password"
              isPrimary
              modalTitle="Change Password"
              modalDesc="Ensure your new password is at least 8 characters long."
            >
              <div className="space-y-4 w-full">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground">
                    Current Password
                  </Label>
                  <Input type="password" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground">
                    New Password
                  </Label>
                  <Input type="password" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground">
                    Confirm Password
                  </Label>
                  <Input type="password" />
                </div>
              </div>
            </SecurityItem>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InfoDisplay({ label, value, statusColor = "text-gray-900" }) {
  return (
    <div className="space-y-1.5 text-left">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
        {label}
      </p>
      <p className={cn("text-sm font-semibold", statusColor)}>{value}</p>
    </div>
  );
}

function ModalInput({ label, defaultValue, placeholder }) {
  return (
    <div className="grid grid-cols-4 items-center gap-4 text-left">
      <Label className="text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      <Input
        defaultValue={defaultValue}
        placeholder={placeholder}
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
  modalDesc,
  children,
}) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-xl bg-white hover:border-blue-200 transition-all text-left">
      <div className="space-y-1">
        <p className="text-sm font-bold text-gray-900">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant={isPrimary ? "default" : "outline"}
            size="sm"
            className={cn(
              "text-xs font-bold",
              isPrimary && "bg-blue-600 hover:bg-blue-700",
            )}
          >
            {btnText}
          </Button>
        </DialogTrigger>
        <DialogContent className="p-0 gap-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-6 border-b bg-gray-50/80 text-left">
            <DialogTitle className="text-xl font-bold">
              {modalTitle}
            </DialogTitle>
            <DialogDescription>{modalDesc}</DialogDescription>
          </DialogHeader>
          <div className="p-6">{children}</div>
          <DialogFooter className="p-6 border-t bg-gray-50/80">
            <Button
              type="submit"
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
            >
              Update Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
