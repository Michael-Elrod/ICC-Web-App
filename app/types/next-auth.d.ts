// next-auth.d.ts

import "next-auth";
import { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      type: string;
      firstName: string;
      lastName: string;
      phone: string | null;
      email: string;
      notificationPref: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    type: string;
    user_first_name: string;
    user_last_name: string;
    user_email: string;
    user_phone: string | null;
    notification_pref: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    type: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    email: string;
    notificationPref: string;
  }
}
