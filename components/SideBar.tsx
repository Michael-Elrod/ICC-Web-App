// SideBar.tsx

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaCirclePlus } from "react-icons/fa6";
import {
  FaBriefcase,
  FaCalendar,
  FaAddressBook,
  FaCog,
  FaClipboardList,
} from "react-icons/fa";
import { useSession } from "next-auth/react";

const SideBar = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const canCreateJobs =
    session?.user?.type === "Owner" || session?.user?.type === "Admin";
  const [hovered, setHovered] = useState(false);

  return (
    <>
      {/* Desktop Sidebar */}
      <nav
        className={`hidden md:flex fixed left-0 top-0 ${hovered ? "w-40" : "w-12"} py-4 pb-6 flex-col bg-zinc-800 rounded-br-2xl transition-all duration-200 overflow-hidden z-50`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <ul className="space-y-8 pt-10">
          <li>
            <Link
              href="/jobs"
              className="flex items-center text-zinc-300 hover:text-white"
            >
              <div className="w-12 flex justify-center shrink-0">
                <FaBriefcase size={28} />
              </div>
              <span
                className={`whitespace-nowrap text-sm transition-opacity duration-200 ${hovered ? "opacity-100" : "opacity-0"}`}
              >
                Overview
              </span>
            </Link>
          </li>
          <li>
            <Link
              href="/calendar"
              className="flex items-center text-zinc-300 hover:text-white"
            >
              <div className="w-12 flex justify-center shrink-0">
                <FaCalendar size={28} />
              </div>
              <span
                className={`whitespace-nowrap text-sm transition-opacity duration-200 ${hovered ? "opacity-100" : "opacity-0"}`}
              >
                Calendar
              </span>
            </Link>
          </li>
          <li>
            <Link
              href="/contacts"
              className="flex items-center text-zinc-300 hover:text-white"
            >
              <div className="w-12 flex justify-center shrink-0">
                <FaAddressBook size={28} />
              </div>
              <span
                className={`whitespace-nowrap text-sm transition-opacity duration-200 ${hovered ? "opacity-100" : "opacity-0"}`}
              >
                Contacts
              </span>
            </Link>
          </li>
          {canCreateJobs && (
            <li>
              <Link
                href="/jobs/new"
                className="flex items-center text-zinc-300 hover:text-white"
              >
                <div className="w-12 flex justify-center shrink-0">
                  <FaCirclePlus size={28} />
                </div>
                <span
                  className={`whitespace-nowrap text-sm transition-opacity duration-200 ${hovered ? "opacity-100" : "opacity-0"}`}
                >
                  Create
                </span>
              </Link>
            </li>
          )}
          {canCreateJobs && (
            <li>
              <Link
                href="/templates"
                className="flex items-center text-zinc-300 hover:text-white"
              >
                <div className="w-12 flex justify-center shrink-0">
                  <FaClipboardList size={28} />
                </div>
                <span
                  className={`whitespace-nowrap text-sm transition-opacity duration-200 ${hovered ? "opacity-100" : "opacity-0"}`}
                >
                  Templates
                </span>
              </Link>
            </li>
          )}
          <li>
            <button
              onClick={() => router.push("/settings")}
              className="flex items-center text-zinc-300 hover:text-white"
            >
              <div className="w-12 flex justify-center shrink-0">
                <FaCog size={28} />
              </div>
              <span
                className={`whitespace-nowrap text-sm transition-opacity duration-200 ${hovered ? "opacity-100" : "opacity-0"}`}
              >
                Settings
              </span>
            </button>
          </li>
        </ul>
      </nav>

      {/* Mobile Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full h-16 bg-zinc-800 flex items-center justify-around px-4 z-[9999]">
        <Link href="/jobs" className="text-zinc-300 hover:text-white">
          <FaBriefcase size={24} />
        </Link>
        <Link href="/calendar" className="text-zinc-300 hover:text-white">
          <FaCalendar size={24} />
        </Link>
        <Link href="/contacts" className="text-zinc-300 hover:text-white">
          <FaAddressBook size={24} />
        </Link>
        {canCreateJobs && (
          <Link href="/jobs/new" className="text-zinc-300 hover:text-white">
            <FaCirclePlus size={24} />
          </Link>
        )}
        {canCreateJobs && (
          <Link href="/templates" className="text-zinc-300 hover:text-white">
            <FaClipboardList size={24} />
          </Link>
        )}
        <button
          onClick={() => router.push("/settings")}
          className="text-zinc-300 hover:text-white"
        >
          <FaCog size={24} />
        </button>
      </nav>
    </>
  );
};

export default SideBar;
