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

        const user = await User.findOne({ username: credentials.username });
        if (!user) throw new Error("User not found");

        const isPasswordCorrect = await bcrypt.compare(
          credentials.password,
          user.password,
        );
        if (!isPasswordCorrect) throw new Error("Invalid password");

        return {
          id: user._id.toString(),
          fullname: user.fullname,
          username: user.username,
          office: user.office,
          unit: user.unit,
          profile: user.profile, 
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.fullname = user.fullname;
        token.office = user.office;
        token.unit = user.unit;
        token.username = user.username;
        token.profile = user.profile; 
      }
      if (trigger === "update" && session?.profile) {
        token.profile = session.profile;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.fullname = token.fullname;
        session.user.office = token.office;
        session.user.unit = token.unit;
        session.user.username = token.username;
        session.user.profile = token.profile; 
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
});