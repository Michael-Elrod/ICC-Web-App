"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FaCirclePlus } from "react-icons/fa6";
import { FaBriefcase, FaCalendar, FaAddressBook, FaCog } from "react-icons/fa";
import { useSession } from "next-auth/react";

const SideBar = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const canCreateJobs =
    session?.user?.type === "Owner" || session?.user?.type === "Admin";

  return (
    <>
      {/* Desktop Sidebar */}
      <nav className="hidden md:flex fixed left-0 top-0 w-12 h-screen p-4 flex-col items-center justify-between bg-zinc-800 transition-colors duration-200">
        <div className="flex flex-col items-center space-y-8 pt-10">
          <ul className="space-y-8">
            <li>
              <Link href="/jobs" className="text-zinc-300 hover:text-white">
                <FaBriefcase size={28} />
              </Link>
            </li>
            <li>
              <Link href="/calendar" className="text-zinc-300 hover:text-white">
                <FaCalendar size={28} />
              </Link>
            </li>
            <li>
              <Link href="/contacts" className="text-zinc-300 hover:text-white">
                <FaAddressBook size={28} />
              </Link>
            </li>
            {canCreateJobs && (
              <li>
                <Link
                  href="/jobs/new"
                  className="text-zinc-300 hover:text-white"
                >
                  <FaCirclePlus size={28} />
                </Link>
              </li>
            )}
          </ul>
        </div>

        <div className="flex flex-col items-center mt-auto">
          <div className="w-8 h-px bg-white mb-4"></div>
          <ul className="space-y-4">
            <li>
              <button
                onClick={() => router.push("/settings")}
                className="text-zinc-300 hover:text-white"
              >
                <FaCog size={28} />
              </button>
            </li>
          </ul>
        </div>
      </nav>

      {/* Mobile Bottom Bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 w-full h-16 bg-zinc-800 flex items-center justify-around px-4 z-[9999]"
        style={{ position: "fixed", width: "100vw" }}
      >
        <Link href="/jobs" className="text-zinc-300 hover:text-white">
          <FaBriefcase size={24} />
        </Link>
        <Link href="/calendar" className="text-zinc-300 hover:text-white">
          <FaCalendar size={24} />
        </Link>
        <Link href="/contacts" className="text-zinc-300 hover:text-white">
          <FaAddressBook size={24} />
        </Link>
        <button
          onClick={() => router.push("/settings")}
          className="text-zinc-300 hover:text-white"
        >
          <FaCog size={24} />
        </button>
        {canCreateJobs && (
          <Link href="/jobs/new" className="text-zinc-300 hover:text-white">
            <FaCirclePlus size={24} />
          </Link>
        )}
      </nav>
    </>
  );
};

export default SideBar;