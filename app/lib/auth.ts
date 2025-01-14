import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import pool from "@/app/lib/db";

// Check required environment variables
const requiredEnvVars = [
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
  'DB_HOST',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

console.log('Initializing auth configuration');

export const authOptions: NextAuthOptions = {
  debug: true,
  providers: [
    CredentialsProvider({
      id: "credentials",
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
          console.log('Database response received');
      
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
          console.log('Password check complete');
      
          if (!passwordMatch) {
            throw new Error("Incorrect password");
          }
      
          const userObject = {
            id: user.user_id.toString(),
            type: user.user_type,
            user_email: user.user_email,
            user_first_name: user.user_first_name,
            user_last_name: user.user_last_name,
            user_phone: user.user_phone,
          };

          console.log('Authorization successful');
          return userObject;
        } catch (error: any) {
          console.error("Authorization error:", {
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
          console.log('Session callback started');
          
          try {
            const [rows] = await pool.execute(
              "SELECT * FROM app_user WHERE user_id = ?",
              [token.id]
            );
            
            console.log('Session database query complete');
            
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
              console.warn('No fresh user data found, using token data');
              session.user = {
                id: token.id,
                type: token.type,
                firstName: token.firstName,
                lastName: token.lastName,
                phone: token.phone,
                email: token.email,
              };
            }
          } catch (dbError) {
            console.error("Database error in session callback:", dbError);
            // Fallback to token data
            session.user = {
              id: token.id,
              type: token.type,
              firstName: token.firstName,
              lastName: token.lastName,
              phone: token.phone,
              email: token.email,
            };
          }
        }
        return session;
      } catch (error) {
        console.error("Session callback error:", error);
        if (session.user && token) {
          session.user = {
            id: token.id,
            type: token.type,
            firstName: token.firstName,
            lastName: token.lastName,
            phone: token.phone,
            email: token.email,
          };
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
      console.log('Sign in event:', { userId: user.id, isNewUser });
    },
    signOut({ session, token }) {
      console.log('Sign out event:', { userId: token?.id });
    },
    createUser({ user }) {
      console.log('Create user event:', { userId: user.id });
    },
    linkAccount({ user, account, profile }) {
      console.log('Link account event:', { userId: user.id });
    },
    session({ session, token }) {
      console.log('Session event:', { userId: token?.id });
    }
  }
};

// Verify configuration
console.log('Auth configuration complete. Status:', {
  providersConfigured: authOptions.providers?.length > 0,
  callbacksConfigured: !!authOptions.callbacks,
  secretConfigured: !!authOptions.secret,
  pagesConfigured: !!authOptions.pages,
});