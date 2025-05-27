/*import React, { useContext } from "react";
import { Button } from "../ui/button.jsx";
import { LogInContext } from "@/Context/LogInContext/Login.jsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogInIcon, LogOutIcon, Plane, Plus, User, List } from "lucide-react"; // Ensure List is imported
import { Link } from "react-router-dom";
import ThemeToggle from "../constants/ThemeToggle.jsx";

function Header({ headerRef }) {
  const { user, isAuthenticated, logout, loginWithPopup } = useContext(LogInContext);

  return (
    <header
      ref={headerRef}
      className="w-full flex items-center justify-between shadow-md p-4 md:px-20 border-b bg-white dark:bg-gray-900"
      style={{ height: "80px", minHeight: "80px" }}
    >
   
      <Link to="/" className="flex items-center">
        <div className="logo-container">
          <img
            src="/logo2.png"
            alt="Aurora Go Logo"
            className="logo-image object-contain transition-transform duration-300 hover:scale-110"
          />
        </div>
        <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-blue-400 to-blue-700 bg-clip-text text-transparent">
          Aurora Go
        </h1>
      </Link>

      <div className="flex items-center gap-4">
        <ThemeToggle />

        {isAuthenticated ? (
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 cursor-pointer">
              <h2 className="hidden sm:block text-lg md:text-xl font-semibold capitalize bg-gradient-to-b from-primary/90 to-primary/60 bg-clip-text text-transparent">
                Hi, {user.given_name || user.nickname}
              </h2>
              <div className="h-10 w-10 rounded-full overflow-hidden border border-gray-300 dark:border-gray-600">
                {user.picture ? (
                  <img src={user.picture} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="h-full w-full p-2 text-gray-500" />
                )}
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 text-center sm:text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg">
              <DropdownMenuLabel className="text-lg font-semibold flex items-center gap-2 p-3">
                <User className="h-5 w-5" /> My Account
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              <Link to="/all-trips">
                <DropdownMenuItem className="flex items-center gap-2 text-lg p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                  <Plane className="h-5 w-5" /> My Trips
                </DropdownMenuItem>
              </Link>

              <Link to="/plan-a-trip">
                <DropdownMenuItem className="flex items-center gap-2 text-lg p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                  <Plus className="h-5 w-5" /> Create Trip
                </DropdownMenuItem>
              </Link>


              <Link to="/checklist">
                <DropdownMenuItem className="flex items-center gap-2 text-lg p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                  <List className="h-5 w-5" /> Checklist
                </DropdownMenuItem>
              </Link>

              <DropdownMenuSeparator />

              <div className="p-3">
                <Button
                  variant="destructive"
                  className="w-full flex items-center justify-center gap-2"
                  onClick={logout}
                >
                  Log Out <LogOutIcon className="h-5 w-5" />
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button onClick={loginWithPopup} className="flex items-center gap-2">
            Sign In <LogInIcon className="h-5 w-5" />
          </Button>
        )}
      </div>
    </header>
  );
}

export default Header;
*/

import { LogInContext } from "@/Context/LogInContext/Login.jsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BusFront, List, LogInIcon, LogOutIcon, Plane, Plus, User } from "lucide-react";
import { useContext } from "react";
import { Link } from "react-router-dom";
import ThemeToggle from "../constants/ThemeToggle.jsx";
import { Button } from "../ui/button.jsx";

function Header({ headerRef }) {
  const { user, isAuthenticated, logout, loginWithPopup } = useContext(LogInContext);

  return (
    <header
      ref={headerRef}
      className="w-full flex items-center justify-between shadow-md p-4 md:px-20 border-b bg-white dark:bg-gray-900"
      style={{ height: "80px", minHeight: "80px" }}
    >
      {/* Logo Section */}
      <Link to="/" className="flex items-center">
        <div className="logo-container">
          <img
            src="/logo2.png"
            alt="Aurora Go Logo"
            className="logo-image object-contain transition-transform duration-300 hover:scale-110"
          />
        </div>
        <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-blue-400 to-blue-700 bg-clip-text text-transparent">
          Aurora Go
        </h1>
      </Link>

      {/* Right Section: Theme Toggle & User Menu */}
      <div className="flex items-center gap-4">
        <ThemeToggle />

        {isAuthenticated ? (
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 cursor-pointer">
              <h2 className="hidden sm:block text-lg md:text-xl font-semibold capitalize bg-gradient-to-b from-primary/90 to-primary/60 bg-clip-text text-transparent">
                Hi, {user.given_name || user.nickname}
              </h2>
              <div className="h-10 w-10 rounded-full overflow-hidden border border-gray-300 dark:border-gray-600">
                {user.picture ? (
                  <img src={user.picture} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <User  className="h-full w-full p-2 text-gray-500" />
                )}
              </div>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-56 text-center sm:text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg">
              <DropdownMenuLabel className="text-lg font-semibold flex items-center gap-2 p-3">
                <User  className="h-5 w-5" /> My Account
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              <Link to="/all-trips">
                <DropdownMenuItem className="flex items-center gap-2 text-lg p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                  <Plane className="h-5 w-5" /> My Trips
                </DropdownMenuItem>
              </Link>

              <Link to="/plan-a-trip">
                <DropdownMenuItem className="flex items-center gap-2 text-lg p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                  <Plus className="h-5 w-5" /> Create Trip
                </DropdownMenuItem>
              </Link>

              <Link to="/checklist">
                <DropdownMenuItem className="flex items-center gap-2 text-lg p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                  <List className="h-5 w-5" /> Checklist
                </DropdownMenuItem>
              </Link>

              {/* 🚍 Transportation Details Link */}
              <Link to="/transportation">
                <DropdownMenuItem className="flex items-center gap-2 text-lg p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                  <BusFront className="h-5 w-5" /> Transportation
                </DropdownMenuItem>
              </Link>

              <DropdownMenuSeparator />

              <div className="p-3">
                <Button
                  variant="destructive"
                  className="w-full flex items-center justify-center gap-2"
                  onClick={logout}
                >
                  Log Out <LogOutIcon className="h-5 w-5" />
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button onClick={loginWithPopup} className="flex items-center gap-2">
            Sign In <LogInIcon className="h-5 w-5" />
          </Button>
        )}
      </div>
    </header>
  );
}

export default Header;
