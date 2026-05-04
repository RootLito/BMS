import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { auth } from "@/auth"; 


export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findById(session.user.id).select("-password");

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    await dbConnect();
    
    const body = await req.json();
    const { section, ...data } = body;

    let updateData = {};

    switch (section) {
      case "personal":
        updateData = {
          fullname: data.fullname,
          gender: data.gender,
          birthday: data.birthday,
          civilStatus: data.civilStatus,
          address: data.address,
        };
        break;

      case "office":
        updateData = {
          office: data.office,
          unit: data.unit,
        };
        break;

      case "security":
        if (data.username) {
          updateData.username = data.username;
        }
        
        if (data.newPassword) {
          const user = await User.findById(userId);
          
          const isMatch = await bcrypt.compare(data.currentPassword, user.password);
          if (!isMatch) {
            return NextResponse.json(
              { message: "Current password is incorrect" },
              { status: 400 }
            );
          }

          const salt = await bcrypt.genSalt(10);
          updateData.password = await bcrypt.hash(data.newPassword, salt);
        }
        break;

      default:
        return NextResponse.json({ message: "Invalid section" }, { status: 400 });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Update successful", user: updatedUser },
      { status: 200 }
    );

  } catch (error) {
    console.error("Update Error:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}