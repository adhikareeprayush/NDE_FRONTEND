"use client";
import { ICONS, IMAGES } from "@/assets";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import TextTransition, { presets } from "react-text-transition";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { setIsSidebarOpen } from "@/store/sidebarSlice";
import {
  handleAddAItemToCartService,
  handleGetAllCartItemsService,
} from "@/services/cart";
import { toast } from 'react-toastify';
import { RootState } from "@/store/store";
import { showToast } from "@/services/showToast";
import './style.css'
import { loadCountryCodeFromLocalStorage } from "@/store/countryCodeSlice";

interface Domain {
  name: string;
  status: string;
  price?: {
    productId: string;
    tld: string;
    year: number;
    registerPrice: number;
    _id: string;
  }[];
}
type CartItem = {
  name: string;
  status: string;
  product: string;
  productId: string;
  domainName: string;
  type: string;
  year: number;
  price: number;
};


const words = ["education", "travel", "fun", "online"];
const fetchDomainAvailability = async (domain: string, countryCode:string) => {
  const response = await axios.post(
    `https://liveserver.nowdigitaleasy.com:5000/product/domain_availability?country_code=${countryCode}`,
    { domain }
  );
  return response?.data?.response?.map((item: any) => ({
    name: item?.domain,
    status:
      item?.status === "available"
        ? "Available"
        : item?.status === "unavailable"
        ? "Unavailable"
        : "Unknown",
    price: item?.price && item?.price?.length > 0 ? item?.price : undefined,
  }));
};

const Hero = () => {
  const dispatch = useDispatch();
  const countryCode = useSelector((state: RootState) => state.countryCode.countryCode);
  console.log(countryCode)
  useEffect(() => {
    dispatch(loadCountryCodeFromLocalStorage());
  }, [dispatch]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isSidebarOpen } = useSelector((state: any) => state.sidebar);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window !== "undefined") {
      const savedCart = localStorage.getItem("cart");
      return savedCart ? JSON.parse(savedCart) : [];
    }
    return [];
  });

  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  // const [countryCode, setCountryCode] = useState("IN");

  // useEffect(() => {
  //   if (typeof window !== "undefined") {
  //     const storedCountryCode = localStorage.getItem("countryCode");
  //     if (storedCountryCode) {
  //       setCountryCode(storedCountryCode);
  //     }
  //   }
  // }, []);

  const {
    data: domains = [],
    refetch,
    isFetching,
  } = useQuery<Domain[]>({
    queryKey: ["domainAvailability", searchQuery],
    queryFn: () => fetchDomainAvailability(searchQuery, countryCode),
    enabled: false,
  });


  const { isLoading, isError, data } = useQuery({
    queryKey: ["cart"],
    queryFn: () => handleGetAllCartItemsService("INR"),
    enabled: isAuthenticated,
  });

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentWordIndex((prevIndex) => (prevIndex + 1) % words.length);
    }, 3000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    // Save the cart to local storage whenever it changes
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const handleSearchClick = () => {
    refetch().then(() => {
      setIsModalOpen(true);
    });
  };

  const { mutate, isPending: isAddToCartPending } = useMutation({
    mutationFn: (data: any) => {
      return handleAddAItemToCartService(data);
    },
    onError: (error: any) => {
      toast.error(error?.message || "An error occurred");
    },
    onSuccess: () => {
      // toast.success("Domain added to cart");
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  const handleCloseModal = () => setIsModalOpen(false);
  const addCartToAPI = async (cartData: any) => {
    try {
      const response = await axios.post(
        "https://liveserver.nowdigitaleasy.com:5000/cart",
        { data: cartData },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      queryClient.invalidateQueries({ queryKey: ['cartData'] });
      return response.data;
    } catch (error) {
      throw new Error("Failed to add cart to API");
    }
  };

  // Different
  const syncCartToAPI = () => {
    const existingCart = JSON.parse(localStorage.getItem("cart") || "[]");
    const cartData = existingCart.map((item: any) => {
      const { price, ...rest } = item;
      return rest;
  });

    if (isAuthenticated && existingCart.length > 0) {
      const toastIdForSuccess = `1`;
      const toastIdForError = `2`;
      addCartToAPI(cartData)
        .then(() => {
          // showToast('success', `Cart synced successfully`, toastIdForSuccess);
          queryClient.invalidateQueries({ queryKey: ['domain'] });
        })
        .catch((error) => {
          // showToast('error', `Failed to sync cart`, toastIdForError);
          console.error(error);
        });
    }
  };

  const [selectedYears, setSelectedYears] = useState<{ [key: string]: number }>({});

  const handleAddToCart = (domain: Domain) => {
    const selectedYear = selectedYears[domain.name] || 1;
    setCart((prevCart) => {
      const isSelected = prevCart.some(
        (item) => item.domainName === domain.name
      );
      let updatedCart;
      const toastId = `toast-${domain.name}`;

      // If the domain is already in the cart, remove it
      if (isSelected) {
        // showToast('success', `${domain.name} removed from cart`, toastId);
        updatedCart = prevCart.filter(
          (item) => item.domainName !== domain.name
        );
      } else {
        // If the domain is not in the cart, add it
        // showToast('success', `${domain.name} added to cart`, toastId);
        const newCartItems =
          domain?.price?.map((price) => ({
            name: domain?.name,
            status: domain?.status,
            product: "domain",
            productId: price?.productId,
            domainName: domain?.name,
            type: "new",
            year: selectedYear,
            price: domain.price ? price.registerPrice * selectedYear : 0,
          })) || [];

        updatedCart = [...prevCart, ...newCartItems];
      }

      // Save the updated cart to localStorage
      localStorage.setItem("cart", JSON.stringify(updatedCart));

      // If authenticated, sync the cart to the API
      if (isAuthenticated) {
        syncCartToAPI();
      }

      return updatedCart;
    });

    // Update the domain availability query if needed
    // queryClient.setQueryData<Domain[]>(["domainAvailability", searchQuery], (oldDomains = []) =>
    //   oldDomains?.map((d) => (d?.name === domain?.name ? { ...d, status: isSelected ? "Available" : "Added" } : d))
    // );
  };

  const handleYearChange = (domainName: string, newYear: number) => {
    setSelectedYears((prev) => ({ ...prev, [domainName]: newYear }));
  };


  const handleRemoveFromCart = (domain: Domain) => {
    setCart((prevCart) => {
      // Use 'name' instead of 'domainName' since 'name' is a property of the 'Domain' type
      const newCart = prevCart.filter((item) => item.name !== domain.name);
      localStorage.setItem("cart", JSON.stringify(newCart));
      return newCart;
    });

    queryClient.setQueryData<Domain[]>(
      ["domainAvailability", searchQuery],
      (oldDomains = []) =>
        oldDomains?.map((d) =>
          d?.name === domain?.name ? { ...d, status: "Available" } : d
        )
    );
  };

  const getTextColor = (word: string) => {
    switch (word) {
      case "education":
        return "blue";
      case "travel":
        return "green";
      case "fun":
        return "orange";
      case "online":
        return "purple";
      default:
        return "black";
    }
  };

  const isInCart = (domain: Domain) =>
    cart?.some((item) => item?.name === domain?.name);

  const DomainItem = ({ domain }: { domain: Domain }) => {
    const selectedYear = selectedYears[domain.name] || 1;
  
    return (
      <div className="flex justify-between bg-white items-center content-center m-3">
        <div className="flex flex-col mx-4 max-md:mx-1 p-3 max-md:p-1 domainPlansFlex">
          <span className="md:font-900 font-700 text-lg max-lg:text-md max-md:text-xs">
            {domain.name}
          </span>
          <div>
            <span className={`flex items-center text-[14px] w-[30px] max-md:text-xs ${domain.status === 'Available' ? 'text-green-500' : domain.status === 'Added' ? 'text-yellow-600' : 'text-red-500'}`}>
              <Image 
                src={
                  domain.status === 'Available' 
                  ? ICONS.charmCircleTick 
                  : domain.status === 'Added' 
                  ? ICONS.cartIcon 
                  : ICONS.xCircle
                } 
                alt={domain.status} 
                className="inline-block w-4 h-4 mr-2"
              />  
              <span>{domain.status}</span>
            </span>
          </div>
        </div>
        <div className="flex content-center items-center md:gap-8 gap-2 ">
          <select
            className="border rounded-md p-1 hide-700"
            disabled={domain.status !== 'Available'}
            value={selectedYears[domain.name] || 1}
            onChange={(e) => handleYearChange(domain.name, Number(e.target.value))}
          >
            {[1, 2, 3, 5].map((year) => (
              <option key={year} value={year}>
                {year} year{year > 1 ? 's' : ''}
              </option>
            ))}
          </select>
          <div className="domainPriceContainer flex flex-col items-start">
                  <span className="font-900  text-start text-2xl max-lg:text-sm leading-tight mainPrice">
                {/* Multiply price by the selected year */}
                {domain.price && domain.price.length > 0
                  ? `${countryCode === "IN" ? "₹" : countryCode === "US" ? "$" : "$"}${domain.price[0].registerPrice * selectedYear}`
                  : "N/A"}
              </span>
            <div className="">
              <span className="text-[14px] text-center max-lg:text-xs bottomPrice">
                {domain.price && domain.price.length > 0
                  ? `then ${countryCode === "IN" ? "₹" : countryCode === "US" ? "$" : "$"}${(domain.price[0].registerPrice + 200) * selectedYear}/Year`
                  : ""}
              </span>
            </div>
          </div>
          <button
            className={`text-white w-[120px] max-md:w-[80px] max-md:mx-1 max-md:text-xs max-md:p-1 p-2 mx-3 rounded-md domainModalButton ${
              isInCart(domain)
                ? "bg-red-500 removeCart"
                : domain.status === "Available"
                ? "bg-home-primary availableCart"
                : "bg-gray-400 unavailableCart"
            }`}
            onClick={() => {
              if (domain.status === "Available") {
                handleAddToCart(domain);
              } else if (isInCart(domain)) {
                handleRemoveFromCart(domain);
              }
            }}
            // Enable the button if the domain is in the cart, even if it's unavailable
            disabled={domain.status !== "Available" && !isInCart(domain)}
          >
           <div className="hide-470">
            {domain.status === "Available" && !isInCart(domain)
                ? "Add to cart"
                : isInCart(domain)
                ? "Remove"
                : "Unavailable"}
           </div>
           <div className="show-470">
            {domain.status === "Available" && !isInCart(domain)
                ? <Image src={ICONS.cartBlue} alt="Add to cart" className="w-4 h-4" />
                : isInCart(domain)
                ? <Image src={ICONS.trashRed} alt="Remove" className="w-4 h-4" />
                : <Image src={ICONS.cartGrey} alt="Unavailable" className="w-4 h-4" />}
           </div>
          </button>
        </div>
      </div>
    );
  };
  

  return (
    <div  className="hero pt-[180px] max-md:pt-28 max-lg:pt-36 w-full flex flex-col max-lg:gap-2 max-md:gap-2 bg-gradient-domain-hero relative z-20">
      <Image
        src={IMAGES.domain}
        alt="domain"
        className="absolute top-0 right-0 w-90 z-0"
        style={{ zIndex: "-1" }}
      />
      <Image
        src={IMAGES.domain2}
        alt="domain"
        className="absolute bottom-0 left-0 w-30 z-0"
        style={{ zIndex: "-1" }}
      />
      <div className="flex flex-col justify-center items-center z-10 ">
        <div className="font-900 text-[16px] md:text-[33px] xl:text-[46px] 2xl:text-[56px] 3xl:text-[78px] leading-[30px] md:leading-[46px] xl:leading-[67px] text-primary-500 flex gap-[5px] w-fit justify-center items-center mx-auto ">
          <h1 className="w-auto text-center text-[#000659]">Expand your horizons with .</h1>
          <h1 className="w-[100px] max-md:w-[120px]">  
          
            <TextTransition
              direction="down"
              springConfig={presets.gentle}
              delay={0}
              style={{
                color: getTextColor(words[currentWordIndex % words.length]),
              }}
            >
              <span className="w-auto text-center">{words[currentWordIndex % words.length]}</span>
            </TextTransition>
          </h1>
        </div>

        <h4 className="text-center text-[#000659] tracking-tight font-roboto hidden sm:block">
          Get started with the perfect domain.
        </h4>
        <p className="text-center text-[#000659] sm:hidden block">
          Get started with the perfect domain.
        </p>
      </div>
      <div className="flex justify-center w-full pb-10 max-lg:pb-4 max-md:pb-2 z-10">
        <div className="inpContainer flex mt-[41px] md:mt-[33.87px] 3xl:mt-[40.87px] rounded-xl px-4 sm:px-0">

          <input
            className="w-full sm:w-[328px] md:w-[581px] xl:w-[736px] 3xl:w-[1028px] p-4 border rounded-l-lg max-md:placeholder:text-[12px] focus:outline-none focus:border-0"
            placeholder="Find and purchase a domain name"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <button
            className={`bg-home-primary text-white flex items-center gap-2 text-[17px] font-roboto font-500 px-[18px] max-md:text-sm p-4 rounded-r-lg ${
              isFetching ? "cursor-wait" : ""
            }`}
            onClick={handleSearchClick}
            disabled={isFetching}
          >
            <Image src={ICONS.searchBarIcon} width={17} height={18} alt="Search Icon"/>
            <span className="hidden md:block">{isFetching ? "Searching..." : "Search "}</span>
          </button>
        </div>
      </div>
      <span className="text-center text-[17px] 2xl:text-[24px] leading-[20.4px] font-900 3xl:font-900 sm:pt-[100px] pt-[10px] max-lg:pt-10 md:pt-[150px] lg:pt-[120px] text-home-body justify-center font-roboto z-10 pb-[20px] md:pb-[10px] lg:pb-[40px] px-[4px] max-w-[301px] md:max-w-full mx-auto">
        12,000+ global businesses trust us to transform & grow digitally
      </span>
      <div className="flex justify-center items-center gap-7 sm:gap-8 md:gap-10 lg:gap-16 pb-6 overflow-hidden z-10">
        {[
          IMAGES.brand2,
          IMAGES.brand3,
          IMAGES.brand6,
          IMAGES.brand4,
          IMAGES.brand5,
          IMAGES.brand1,
          IMAGES.brand7,
          ICONS.gol,
          IMAGES.brand1,
          IMAGES.brand7,
          ICONS.gol,
        ].map((src, index) => (
          <Image key={index} src={src} alt="" className="w-[110px]" />
        ))}
      </div>
      {isModalOpen && (
        <div onClick={() => setIsModalOpen(false)} className=" w-[95%] mx-auto fixed inset-0 flex items-center justify-center max-md:justify-normal pt-24 max-md:pt-16 max-md:block z-[20000] ">
          <div onClick={(e_) => e_.stopPropagation()} className="relative bg-gradient-domain-hero p-5 max-md:p-3 rounded-xl shadow-xl pb-10 max-lg:pb-4 ">
            {/* <button
              className="absolute  z-20 top-[-8px] right-[-10px] text-xl bg-white rounded-full border flex items-center justify-center"
              onClick={handleCloseModal}
            > */}
              <Image onClick={() => setIsModalOpen(false)} src={ICONS.close} alt="close" className="cursor-pointer absolute z-[1000] top-0 right-[-10px]" />
            {/* </button> */}
  
            <div className="flex justify-center w-full pb-6 max-md:pb-0">
              <div className="flex m-3 rounded-xl">
                <input
                  className="w-[80vw] max-md:w-[70vw] p-5 max-lg:p-3 max-md:p-2 border rounded-l-xl max-md:placeholder:text-[10px]"
                  placeholder="Find and purchase a domain name"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button
                  className={`bg-home-primary text-white text-[22px] font-roboto font-700 px-10 max-lg:px-2 max-md:text-sm p-2  rounded-r-xl ${
                    isFetching ? "cursor-wait" : ""
                  }`}
                  onClick={handleSearchClick}
                  disabled={isFetching} // Disable button while loading
                >
                  {isFetching ? "Searching..." : "Search "}
                </button>
              </div>
            </div>

            {/* {Adding one span between serach input and result div} */}
            <span className="z-50  block"><h5 className="font-900 pb-2.5 sm:pb-1 pl-5 text-[20px] sm:text-[22px]" style={{ color: "#000659" }}>Search Results</h5></span>

            <div className="p-2 h-[300px] overflow-y-scroll hide-scrollbar">
              <div>
                {domains.map((domain, index) => (
                  <DomainItem key={index} domain={domain} />
                ))}
              </div>
            </div>
            {cart.length > 0 && (
              <div className="flex items-center justify-between my-4 font-roboto font-700 bg-home-body px-10 max-md:px-2 max-md:mx-4 mx-5 py-3 max-md:py-1">
                <span className="text-2xl text-white max-lg:text-sm">
                  {cart.length} item{cart.length > 1 ? "s" : ""} added to your
                  cart
                </span>
                <button
                  onClick={() => {
                    dispatch(setIsSidebarOpen(!isSidebarOpen));
                    setIsModalOpen(false);
                  }}
                  className="text-2xl text-black bg-home-secondary mx-4 px-10 py-2 rounded-md max-md:mx-0 max-md:px-2 max-md:text-sm max-md:py-1"
                >
                  View Cart
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Hero;