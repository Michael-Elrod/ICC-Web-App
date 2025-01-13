import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import pool from "@/app/lib/db";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter both email and password");
        }
      
        try {
          const [rows] = await pool.execute(
            "SELECT * FROM app_user WHERE user_email = ?",
            [credentials.email]
          );
      
          const user = (rows as any[])[0];
          if (!user) {
            throw new Error("No account found with this email");
          }
      
          const passwordMatch = await compare(
            credentials.password,
            user.password
          );
      
          if (!passwordMatch) {
            throw new Error("Incorrect password");
          }
      
          return {
            id: user.user_id.toString(),
            type: user.user_type,
            user_email: user.user_email,
            user_first_name: user.user_first_name,
            user_last_name: user.user_last_name,
            user_phone: user.user_phone,
          };
        } catch (error: any) {
          // Pass through our custom error messages
          if (error.message === "No account found with this email" ||
              error.message === "Incorrect password" ||
              error.message === "Please enter both email and password") {
            throw error;
          }
          console.error("Auth error details:", error);
          throw new Error("An error occurred during authentication");
        }
      },
    }),
  ],
  pages: {
    signIn: "/",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.type = user.type;
        token.firstName = user.user_first_name;
        token.lastName = user.user_last_name;
        token.phone = user.user_phone;
        token.email = user.user_email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        try {
          // Fetch fresh user data from database
          const [rows] = await pool.execute(
            "SELECT * FROM app_user WHERE user_id = ?",
            [token.id]
          );
          
          const freshUserData = (rows as any[])[0];
          
          if (freshUserData) {
            session.user = {
              id: token.id,
              type: token.type,
              firstName: freshUserData.user_first_name,
              lastName: freshUserData.user_last_name,
              phone: freshUserData.user_phone,
              email: freshUserData.user_email,
            };
          }
        } catch (error) {
          console.error("Error refreshing session data:", error);
          // Fallback to token data if database fetch fails
          session.user.id = token.id;
          session.user.type = token.type;
          session.user.firstName = token.firstName;
          session.user.lastName = token.lastName;
          session.user.phone = token.phone;
          session.user.email = token.email;
        }
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };