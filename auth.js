import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        await dbConnect();

        // 1. Find user by username
        const user = await User.findOne({ username: credentials.username });
        if (!user) throw new Error("User not found");

        // 2. Check password
        const isPasswordCorrect = await bcrypt.compare(
          credentials.password,
          user.password,
        );
        if (!isPasswordCorrect) throw new Error("Invalid password");

        // 3. Return user data to be stored in the session
        return {
          id: user._id,
          name: user.fullname,
          username: user.username,
          office: user.office,
          unit: user.unit,
        };
      },
    }),
  ],
  callbacks: {
    // Add extra data (office, unit) to the session object
    async jwt({ token, user }) {
      if (user) {
        token.office = user.office;
        token.unit = user.unit;
        token.username = user.username;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.office = token.office;
        session.user.unit = token.unit;
        session.user.username = token.username;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
});
