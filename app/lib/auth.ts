import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import pool from "@/app/lib/db";

export const authOptions: NextAuthOptions = {
  debug: true,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log('Starting authorize function');
        
        if (!credentials?.email || !credentials?.password) {
          console.log('Missing credentials');
          throw new Error("Please enter both email and password");
        }
      
        try {
          console.log('Attempting database query');
          const [rows] = await pool.execute(
            "SELECT * FROM app_user WHERE user_email = ?",
            [credentials.email]
          );
          console.log('Database response:', rows);
      
          const user = (rows as any[])[0];
          if (!user) {
            console.log('No user found for email:', credentials.email);
            throw new Error("No account found with this email");
          }
      
          console.log('Found user, checking password');
          const passwordMatch = await compare(
            credentials.password,
            user.password
          );
          console.log('Password match result:', passwordMatch);
      
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
          console.error("Detailed authorization error:", {
            error,
            message: error.message,
            stack: error.stack
          });
          
          if (error.message === "No account found with this email" ||
              error.message === "Incorrect password" ||
              error.message === "Please enter both email and password") {
            throw error;
          }
          throw new Error("An error occurred during authentication");
        }
      },
    }),
  ],
  pages: {
    signIn: "/",
    error: "/auth/error",
  },
  callbacks: {
    async jwt({ token, user }) {
      try {
        if (user) {
          token.id = user.id;
          token.type = user.type;
          token.firstName = user.user_first_name;
          token.lastName = user.user_last_name;
          token.phone = user.user_phone;
          token.email = user.user_email;
        }
        return token;
      } catch (error) {
        console.error("JWT callback error:", error);
        return token;
      }
    },
    async session({ session, token }) {
      try {
        if (session.user) {
          console.log('Session callback started', { token });
          
          const [rows] = await pool.execute(
            "SELECT * FROM app_user WHERE user_id = ?",
            [token.id]
          );
          
          console.log('Session database query result:', rows);
          
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
          } else {
            console.warn('No fresh user data found for token:', token);
            // Fallback to token data
            session.user.id = token.id;
            session.user.type = token.type;
            session.user.firstName = token.firstName;
            session.user.lastName = token.lastName;
            session.user.phone = token.phone;
            session.user.email = token.email;
          }
        }
        return session;
      } catch (error) {
        console.error("Detailed session error:", {
          error,
          token,
          sessionUser: session.user
        });
        // Fallback to token data instead of failing
        if (session.user) {
          session.user.id = token.id;
          session.user.type = token.type;
          session.user.firstName = token.firstName;
          session.user.lastName = token.lastName;
          session.user.phone = token.phone;
          session.user.email = token.email;
        }
        return session;
      }
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  events: {
    signIn({ user, account, profile, isNewUser }) {
      console.log('Successful sign in:', { user, account, isNewUser });
    },
    signOut({ session, token }) {
      console.log('Sign out:', { session, token });
    },
    createUser({ user }) {
      console.log('User created:', { user });
    },
    linkAccount({ user, account, profile }) {
      console.log('Account linked:', { user, account, profile });
    },
    session({ session, token }) {
      console.log('Session created/updated:', { session, token });
    }
  }
};