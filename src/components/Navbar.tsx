"use client";

import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/store";
import Link from "next/link";
import Image from "next/image";
import { ICONS } from "@/assets";
import Cart from "./Cart";
import ProductDropDown from "./ProductDropDown";
import Login from "./Login";
import SignUpUser from "./SignUp";
import { logout } from "@/store/authSlice";
import { setIsSidebarOpen } from "@/store/sidebarSlice";
import HambugerDropdown from "./HambugerDropdown";
import axios from "@/services/axios";
import { useQuery } from "@tanstack/react-query";

interface NavbarProps {
  navbarBg?: string;
}

const Navbar: React.FC<NavbarProps> = ({ navbarBg }) => {
  const { isAuthenticated } = useSelector((state: any) => state.auth);
  const [cartItems, setCartItems] = useState<number>(0);

  const fetchCartFromAPI = async () => {
    const response = await axios.get(
      "https://liveserver.nowdigitaleasy.com:5000/cart"
    );
    return response.data;
  };

  const { data: apiCartData, isLoading: apiLoading } = useQuery({
    queryKey: ["cartData"],
    queryFn: fetchCartFromAPI,
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (isAuthenticated) {
      // When the user is authenticated, set cart items from API response
      if (apiCartData) {
        setCartItems(apiCartData?.products?.length || 0);
      }
    } else {
      // If not authenticated, get cart from localStorage
      const updateCartLength = () => {
        const storedCart = JSON.parse(localStorage.getItem("cart") || "[]");
        setCartItems(storedCart.length);
      };

      updateCartLength();

      // Listen for localStorage changes
      window.addEventListener("storage", updateCartLength);

      // Cleanup the event listener on component unmount
      return () => {
        window.removeEventListener("storage", updateCartLength);
      };
    }
  }, [isAuthenticated, apiCartData]);

  // This part listens for manual changes and updates the cart length
  useEffect(() => {
    const updateCartLength = () => {
      const storedCart = JSON.parse(localStorage.getItem("cart") || "[]");
      setCartItems(storedCart.length);
    };
  
    if (!isAuthenticated) {
      updateCartLength();
      window.addEventListener("storage", updateCartLength);
  
      const originalSetItem = localStorage.setItem;
  
      // Override setItem
      localStorage.setItem = function (key: string, value: string) {
        originalSetItem.call(this, key, value);
        if (key === "cart") updateCartLength();
      };
  
      return () => {
        window.removeEventListener("storage", updateCartLength);
        localStorage.setItem = originalSetItem;
      };
    }
  }, [isAuthenticated]);
  




  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const [isHambugerDropdownOpen, setIsHambugerDropdownOpen] = useState(false);
  const [activeModal, setActiveModal] = useState < "login" | "signup" | null > (
    null
  );
  const [fullName, setFullName] = useState < string > ("User");
  const [mounted, setMounted] = useState(false); // Track if component has mounted

  const dispatch = useDispatch();
  const { isSidebarOpen } = useSelector((state: RootState) => state.sidebar);

  useEffect(() => {
    setMounted(true); // Set to true after component mounts
    const storedName = localStorage.getItem("userData") || "User";
    setFullName(storedName);
  }, []);

  const toggleProductDropdown = () => {
    setIsProductDropdownOpen(!isProductDropdownOpen);
  };

  const toggleSignUp = () => {
    setActiveModal(activeModal === "signup" ? null : "signup");
  };

  const toggleLogin = () => {
    setActiveModal(activeModal === "login" ? null : "login");
  };

  const handleLogin = () => {
    setActiveModal("login");
  };

  const handleSignUp = () => {
    setActiveModal("signup");
  };

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem("token");
    localStorage.removeItem("userData");
    // Instead of reloading, you might want to redirect or update the state
    // For example:
    // router.push('/login');
    // However, if you prefer to reload:
    window.location.reload();
  };

  const handleHamburgerClick = () => {
    setIsHambugerDropdownOpen(!isHambugerDropdownOpen)
  };

  // If not mounted, render the server-side HTML without client-specific parts
  if (!mounted) {
    return (
      <div
        className={`z-40 fixed w-full top-0 left-0 right-0 transition-colors duration-500 ${navbarBg}`}
      >
        <nav className="relative items-center justify-between h-[30px] xl:h-[55px]">
          <div className="flex items-center h-full w-full">
            <div className="bg-white bg-opacity-50 lg:w-[99px] md:w-[57px] sm:w-[24.28px] w-[24.28px] h-full rounded-br-2xl"></div>
            <Link href="/" className="px-3 max-md:px-0 h-full">
              <Image
                src={ICONS.logo}
                alt="logo"
                className="w-[117px] h-full max-sm:w-[100px]"
              />
            </Link>
            <div className="bg-white bg-opacity-50 flex-grow justify-between px-10 max-md:px-4 h-full rounded-b-lg flex items-center">
              <div className="hidden lg:flex items-center gap-[52px] max-xl:gap-4 max-xl:ml-20 ml-36 text-[15px] text-[#000334] font-roboto font-bold">
                <div className="relative">
                  <div className="flex items-center gap-2 cursor-pointer" onClick={toggleProductDropdown}>
                    <span>Products</span>
                    <Image src={ICONS.drop} alt="dropdown icon" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span>Resources</span>
                  <Image src={ICONS.drop} alt="dropdown icon" />
                </div>
                <div>
                  <span>Demo</span>
                </div>
                <div>
                  <span>Contact</span>
                </div>
              </div>
              <div className="flex justify-end gap-10 ml-auto">
                <div className="hidden md:flex gap-4 sm:hidden">
                  {/* Render a placeholder or default state when not mounted */}
                  <div className="flex justify-center items-center gap-4">
                    <span className="bg-[#0055FF] text-white rounded-full text-[15px] text-xl px-4 py-2">
                      U
                    </span>
                    <button
                      className="bg-white border-[2px] border-[#0055FF] text-[#0055FF] px-4 py-2 rounded-[4px] text-[15px] font-bold"
                      onClick={handleLogout}
                    >
                      Log out
                    </button>
                  </div>
                </div>

                <div className="flex gap-4 max-sm:gap-2 items-center">
                  <Image
                    src={ICONS.chart}
                    alt="Chart Icon"
                    className="block w-[25px] cursor-pointer"
                    onClick={() => {
                      dispatch(setIsSidebarOpen(!isSidebarOpen));
                    }}
                  />
                  {isSidebarOpen && (
                    <div className="z-40">
                      <Cart />
                    </div>
                  )}
                  <Image
                    src={ICONS.menu}
                    alt="menu"
                    className="w-[25px] lg:hidden"
                    onClick={handleHamburgerClick}
                  />
                </div>
              </div>
            </div>
          </div>
        </nav>
        {isProductDropdownOpen && <ProductDropDown />}
        {/* Do not render modals when not mounted */}
      </div>
    );
  }

  return (
    <div
      className={`z-40 fixed w-full top-0 left-0 right-0 transition-colors duration-500 ${navbarBg}`}
    >
      <nav className="relative items-center justify-between h-[60px] xl:h-[55px]">
        <div className="flex items-center h-full w-full">
          <div className="bg-white bg-opacity-50 lg:w-[99px] md:w-[57px] sm:w-[24.28px] w-[24.28px] h-full rounded-br-2xl"></div>
          <Link href="/" className="px-3 h-full">
            <Image
              src={ICONS.logo}
              alt="logo"
              className="w-[117px] h-full max-sm:w-[100px]"
            />
          </Link>
          <div className="bg-white bg-opacity-50 flex-grow justify-between px-10 max-md:px-4 h-full rounded-b-lg flex items-center">
            <div className="hidden lg:flex items-center lg:gap-[30px] ml-14 text-[15px] text-[#000334] font-roboto font-bold">
              <div className="relative">
                <div
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={toggleProductDropdown}
                >
                  <span>Products</span>
                  <Image src={ICONS.drop} alt="dropdown icon" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span>Resources</span>
                <Image src={ICONS.drop} alt="dropdown icon" />
              </div>
              <div>
                <span>Demo</span>
              </div>
              <div>
                <span>Contact</span>
              </div>
            </div>
            <div className="flex justify-end gap-10 ml-auto">
              <div className="hidden md:flex gap-4 sm:hidden">
                {isAuthenticated ? (
                  <div className="flex justify-center items-center gap-4">
                    <span className="bg-[#0055FF] text-white rounded-full text-[15px] text-xl px-4 py-2">
                      {fullName.charAt(0)} {/* Display the user's first initial */}
                    </span>
                    <button
                      className="bg-white border-[2px] border-[#0055FF] text-[#0055FF] px-4 py-2 rounded-[4px] text-[15px] font-bold"
                      onClick={handleLogout}
                    >
                      Log out
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      className="bg-white border-[2px] max-lg:hidden border-[#0055FF] text-[#0055FF] px-4 py-2 rounded-[4px] text-[15px] font-bold"
                      onClick={handleLogin}
                    >
                      Log in
                    </button>
                    <button
                      className="bg-[#0055FF] text-white max-lg:hidden px-4 py-2 rounded-[4px] text-[15px] font-bold"
                      onClick={handleSignUp}
                    >
                      Sign Up
                    </button>
                  </>
                )}
              </div>




              <div className="flex gap-4 max-sm:gap-2 items-center">
                <div className="relative w-fit">
                  {/* Cart Icon */}
                <Image
                  src={ICONS.chart}
                  alt="Chart Icon"
                  className="block w-[25px] max-md:w-[20px] cursor-pointer"
                  onClick={() => {
                    dispatch(setIsSidebarOpen(!isSidebarOpen));
                  }}
                />
                {/* Cart Item Length Label */}
                <span className="absolute -right-2 -top-2 flex size-4 items-center justify-center rounded-full bg-red-500 text-center text-[10px] text-white">
                  {cartItems}
                </span>


                {isSidebarOpen && (
                  <div className="z-40">
                    <Cart />
                  </div>
                )}
                </div>
                <Image
                  src={ICONS.menu}
                  alt="menu"
                  className="w-[20px] lg:hidden"
                  onClick={handleHamburgerClick}
                />
              </div>
            </div>
          </div>
        </div>
      </nav>
      {isProductDropdownOpen && <ProductDropDown />}
      {activeModal === "login" && (
        <Login
          onClose={() => setActiveModal(null)}
          isOpen={activeModal === "login"}
        />
      )}
      {activeModal === "signup" && (
        <SignUpUser
          onClose={() => setActiveModal(null)}
          isOpen={activeModal === "signup"}
        />
      )}
      {isHambugerDropdownOpen && (
        <div className=" z-40 ">
          <HambugerDropdown onClose={handleHamburgerClick} isOpen={isHambugerDropdownOpen}/>
        </div>
      )}
    </div>
  );
};

export default Navbar;
