'use client'
import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'react-toastify';
import { RootState } from '@/store/store';
import { showToast } from '@/services/showToast';
import './style.css'
import Image from 'next/image';
import { ICONS } from '@/assets';
import { useDispatch, useSelector } from "react-redux";
import { loadCountryCodeFromLocalStorage } from '@/store/countryCodeSlice';

interface Domain {
    name: string;
    status: string;
    price?: { registerPrice: number }[];
}

interface PlanModalProps {
    isOpen: boolean;
    currentStep: number;
    handleNextStep: () => void;
    setIsModalOpen: (isOpen: boolean) => void;
    showInputForm: boolean;
    setShowInputForm: (show: boolean) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    domains: Domain[];
    refetch: () => void;
    isFetching: boolean;
    index: number;
    planPrice: number;
}

const gsuitePlans = async (countryCode:string) => {
    const response = await axios.get(`https://liveserver.nowdigitaleasy.com:5000/product//Gsuite?country_code=${countryCode}`);
    if (!response) {
        throw new Error('Network response was not ok');
    }
    return response.data;
};

const PlanModal: React.FC<PlanModalProps> = ({
    isOpen,
    currentStep,
    handleNextStep,
    setIsModalOpen,
    showInputForm,
    setShowInputForm,
    searchQuery,
    setSearchQuery,
    domains,
    refetch,
    isFetching,
    index,
    planPrice
}) => {
    const dispatch = useDispatch();
  const countryCode = useSelector((state: RootState) => state.countryCode.countryCode);
  useEffect(() => {
    dispatch(loadCountryCodeFromLocalStorage());
  }, [dispatch]);


    const queryClient = useQueryClient();
    const { isAuthenticated } = useSelector((state: RootState) => state.auth);
    const [selectedPeriod, setSelectedPeriod] = useState('Annual-Monthly');
    const [price, setPrice] = useState<number>(planPrice);
    const [selectedDomains, setSelectedDomains] = useState<Domain[]>([]);
    const [quantity, setQuantity] = useState(1);
    const { data, isError, isLoading } = useQuery({ queryKey: ['Gsuite'], queryFn: () => gsuitePlans(countryCode) });

    const [selectedYears, setSelectedYears] = useState<{ [key: string]: number }>({});

    useEffect(() => {
        if (data && data.product && data.product.length > 0) {
            const initialPrice = data.product[index].price.find((p: { period: string; }) => p.period === selectedPeriod);
            setPrice(initialPrice ? initialPrice.amount : 0);
        }
    }, [data, selectedPeriod]);

    // Sync cart from local storage or API
    useEffect(() => {   // different
        if (data) {
            const currentProduct = data.products[index]._id;
            const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
            const productCartItems = existingCart.filter((item: any) => item.productId === currentProduct);
            const domainsInCart = domains.filter(domain =>
                productCartItems.some((item: any) => item.domainName === domain.name)
            );
            setSelectedDomains(domainsInCart);
        }
    }, [data, index, domains]);


    const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>, domainName: string) => {
        const selected = Number(e.target.value);
        setSelectedYears((prevYears) => ({
          ...prevYears,
          [domainName]: selected,
        }));
      };
        

    const handleDurationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selected = e.target.value;
        setSelectedPeriod(selected);

        if (data && data.products && data.products[index]) {
            const selectedPrice = data.products[index].price.find((p: { period: string }) => p.period === selected);
            setPrice(selectedPrice ? selectedPrice.offerPrice : 0);
        }
    };


    
    const addCartToAPI = async (cartData: any) => {
        try {
            const response = await axios.post(
                'https://liveserver.nowdigitaleasy.com:5000/cart',
                { data: cartData },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                }
            );
            queryClient.invalidateQueries({ queryKey: ['cartData'] });
            return response.data;
        } catch (error) {
            throw new Error('Failed to add cart to API');
        }
    };

    const syncCartToAPI = () => {
        const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
        const cartData = existingCart.map((item: any) => {
            const { price, status, ...rest } = item;
            return rest;
        });

       

        if (isAuthenticated && existingCart.length > 0) {
            const toastIdForSuccess = `1`;
            const toastIdForError = `2`;
            addCartToAPI(cartData)
                .then(() => {
                    // showToast('success', `Cart synced successfully`, toastIdForSuccess);
                    queryClient.invalidateQueries({ queryKey: ['Gsuite'] });
                })
                .catch((error) => {
                    // showToast('error', `Failed to sync cart`, toastIdForError);
                    console.error(error);
                });
        }
    };

    const toggleDomainSelection = (domain: Domain) => {
        const selectedYear = selectedYears[domain.name] || 1;
        setSelectedDomains((prevSelected) => {
            const isSelected = prevSelected.some((d) => d.name === domain.name);
            let updatedSelectedDomains;
    
            const toastId = `toast-${domain.name}`;
    
            if (isSelected) {
                // showToast('success', `${domain.name} removed from cart`, toastId);
                updatedSelectedDomains = prevSelected.filter((d) => d.name !== domain.name);
            } else {
                // showToast('success', `${domain.name} added to cart`, toastId);
                updatedSelectedDomains = [...prevSelected, domain];
            }
    
            if (data) {
                const currentProduct = data.products[index]._id;
                const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
    
                const newCartItems = updatedSelectedDomains.map((domain) => ({
                    product: 'gsuite',
                    productId: currentProduct,
                    domainName: domain.name,
                    period: selectedPeriod,
                    type: 'new',
                    quantity,
                    duration : 1,
                    price: domain.price ? domain.price[0].registerPrice * selectedYear : 0,
                }));
    
                const updatedCart = existingCart.filter(
                    (item: any) => !newCartItems.some((newItem) => newItem.domainName === item.domainName)
                );
    
                localStorage.setItem('cart', JSON.stringify([...updatedCart, ...newCartItems]));
                if (isAuthenticated) {
                    syncCartToAPI();
                }
            }
    
            return updatedSelectedDomains;
        });
    };
    
      
    
    
    

    const DomainItem = ({ domain }: { domain: Domain }) => {
        const year = selectedYears[domain.name] || 1;
        return (
            <div className="flex justify-between bg-white items-center content-center my-3 w-full">
            <div className="flex flex-col mx-4 max-md:mx-1 p-3 max-md:p-1 domainPlansFlex">
            <span className="md:font-900 font-700 text-lg max-lg:text-md max-md:text-xs">
                {domain.name}
            </span>
                <div>
                    <span className={`text-[14px] w-[30px] max-md:text-xs ${domain.status === 'Available' ? 'text-green-500' :
                        domain.status === 'Added' ? 'text-yellow-600' :
                            domain.status === 'Unavailable' ? 'text-red-500' :
                                'text-gray-500'
                        }`}>
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
                     {domain.status}
                     </span>
                </div>
            </div>
            <div className="flex content-center items-center md:gap-8 gap-2 ">
                <select 
                value={year}
                onChange={(e) => handleYearChange(e, domain.name)}
                className="border rounded-md p-1 hide-700" disabled={domain.status !== 'Available'}>
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
                  ? `${countryCode === "IN" ? "₹" : countryCode === "US" ? "$" : "$"}${domain.price[0].registerPrice * year}`
                  : "N/A"}
              </span>
            <div className="">
              <span className="text-[14px] text-center max-lg:text-xs bottomPrice">
                {domain.price && domain.price.length > 0
                  ? `then ${countryCode === "IN" ? "₹" : countryCode === "US" ? "$" : "$"}${(domain.price[0].registerPrice + 200) * year}/Year`
                  : ""}
              </span>
            </div>
                 </div>
                <button
                    className={`text-white w-[110px] max-md:w-[80px] max-md:mx-1 max-md:text-xs max-md:p-1 p-2 mx-3 rounded-md domainModalButton  ${selectedDomains.some(d => d.name === domain.name) ? 'bg-home-primary' :
                        domain.status === 'Available'
                            ? 'bg-blue-500 availableCart'
                            : domain.status === 'Added'
                                ? 'bg-red-500 removeCart'
                                : domain.status === 'Unavailable'
                                    ? 'bg-gray-400 unavailableCart'
                                    : 'bg-gray-500 unavailableCart'
                        }`}
                    disabled={domain.status !== 'Available'}
                    onClick={() => toggleDomainSelection(domain)}
                >   
                <div className="hide-470">
                   {selectedDomains.some(d => d.name === domain.name)?
                   "Remove" : domain.status === 'Available' ? "Add to Cart" : domain.status === 'Added' ? "Remove" : "Unavailable"}
                </div>
                
                <div className="show-470">
                    {selectedDomains.some(d => d.name === domain.name)
                        ? <Image src={ICONS.trashRed} alt='cart' className="inline-block w-4 h-4 mr-2" />
                        : domain.status === 'Available'
                            ? <Image src={ICONS.cartBlue} alt='cart' className="inline-block w-4 h-4 mr-2" />
                            : domain.status === 'Added'
                                ? <Image src={ICONS.trashRed} alt='cart' className="inline-block w-4 h-4 mr-2" />
                                : <Image src={ICONS.cartGrey} alt='cart' className="inline-block w-4 h-4 mr-2" />
                    }
                </div>

                </button>
            </div>
            </div>
        )
    };

    if (!isOpen) return null;

    if (isLoading) return <div>Loading...</div>;
    if (isError) return <div>Error loading plans</div>;

    const currentProduct = data?.products[index];

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
            <div className="relative  w-[80vw] md:w-[90vw] max-xl:w-[92vw] rounded-lg border border-black shadow-lg mb-8 bg-background-Gsuite-banner">
                <div className="p-4 max-lg:p-1 relative">
                    {currentStep === 0 && currentProduct && (
                        <div className='planModal'>
                            <div className="wrapperFlex flex justify-between items-center max-md:text-center py-10 md:mx-4 sm:mx-2">
                                <div className='flex flex-col gap-2 max-md:text-center'>
                                    <h4 className=' text-home-heading planName'>Plan Name</h4>
                                    <p className='font-400 font-roboto-serif text-left'>{currentProduct.name}</p>
                                </div>
                                <div className='secFlex flex items-center justify-center max-md:pt-4 lg:gap-10 sm:gap-4'>
                                    <div className='flex flex-col gap-2'>
                                        <h4 className=' text-home-heading'>Quantity</h4>
                                        <input
                                            type="number"
                                            name="quantity"
                                            id="quantity"
                                            className='p-3 rounded-xl'
                                            min={1}
                                            max={5000}
                                            defaultValue={1}
                                            onChange={(e) => setQuantity(Number(e.target.value))}
                                        />

                                    </div>

                                    <div className='flex flex-col gap-2 items-center'>
                                        <h4 className=' text-home-heading'>Duration</h4>

                                        <select
                                            name="duration"
                                            id="duration"
                                            className='p-3 rounded-lg'
                                            value={selectedPeriod}
                                            onChange={handleDurationChange}
                                        >
                                            {currentProduct.price.map((p: any) => (
                                                <option key={p.period} value={p.period}>
                                                    {p.period.charAt(0).toUpperCase() + p.period.slice(1)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className='flex flex-col gap-1 items-start justify-between'>
                                        <h4 className=' text-home-heading'>Total</h4>
                                        <span className='price font-roboto-serif'>{countryCode === "IN" ? "₹" : countryCode === "US" ? "$" : "$"}{price}/-</span>
                                    </div>

                                    <button
                                        className='bg-home-primary  text-white py-4 px-4 rounded-2xl'
                                        onClick={handleNextStep}
                                    >
                                        Buy Now
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    {currentStep === 1 && (
                        <div className='planModalSecond flex flex-col items-start px-10 max-md:px-0'>
                            <div className='flex items-center  max-md:justify-center max-md:items-start gap-16 max-md:gap-0  mx-3 max-md:mx-0 '>
                                <div className='flex items-center gap-4 max-md:gap-1'>
                                    <input
                                        type="radio"
                                        name="domainOption"
                                        id="newDomain"
                                        onChange={() => setShowInputForm(true)}
                                    />
                                    <span className='inputsPlanModalSecond font-roboto-serif text-3xl max-md:text-xs '>
                                        Register a New Domain
                                    </span>
                                </div>
                                <div className='flex items-center gap-4 max-md:gap-1'>
                                    <input
                                        type="radio"
                                        name="domainOption"
                                        id="existingDomain"
                                        onChange={() => setShowInputForm(false)}
                                    />
                                    <span className='inputsPlanModalSecond font-roboto-serif text-3xl max-md:text-xs '>
                                        I already have a Domain Name
                                    </span>
                                </div>
                            </div>
                            <div className="flex w-full pb-6 max-md:pb-0">
                                {showInputForm ? (
                                    <div className='w-[98%]'>
                                        <div className="flex m-3 rounded-xl w-full">
                                            <input
                                                className="availInpt w-[75%] max-md:text-md max-md:p-2 p-6 border rounded-l-xl max-md:placeholder:text-[10px]"
                                                placeholder="Find and purchase a domain name"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                autoFocus
                                            />
                                            <button
                                                className={`buttonCheck bg-home-primary w-[25%] text-white text-xl max-md:text-[10px] max-md:px-1 max-md:p-0 font-roboto font-700 px-6 p-2 rounded-r-xl ${isFetching ? "cursor-wait" : ""
                                                    }`}
                                                onClick={async () => {
                                                    await refetch();
                                                    setIsModalOpen(true);
                                                }} disabled={isFetching}
                                            >
                                                {isFetching ? "Searching..." : "Check Availability "}
                                            </button>
                                        </div>
                                        <div className="p-2 h-[300px] overflow-y-scroll hide-scrollbar w-full">
                                            <div>
                                                {domains.map((domain, index) => (
                                                    <DomainItem key={index} domain={domain} />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex m-3 rounded-xl">
                                        <input
                                            className="w-[60vw] p-6 border rounded-l-xl max-md:placeholder:text-[10px]"
                                            placeholder="Enter your domain name"
                                        />
                                        <button
                                            className="bg-domain-primary text-xl max-md:text-sm text-white px-8 max-md:px-2 rounded-r-xl"
                                        >
                                            <span className="font-roboto font-700">Add to Cart</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                <button
                    onClick={() => setIsModalOpen(false)}
                    className="absolute top-[-15px] right-[-12px] w-[40px] h-[40px] max-md:text-lg max-md:w-[30px] max-md:h-[30px] text-2xl bg-gray-300 rounded-full font-900"
                >
                    <span>✖</span>
                </button>
            </div>
        </div>
    );
};

export default PlanModal;
