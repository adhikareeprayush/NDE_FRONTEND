import Image, { StaticImageData } from 'next/image';
import { CART } from '@/assets';
import { useState, useEffect } from 'react';
import { Accordion, AccordionItem } from "@nextui-org/accordion";
import { useSelector } from 'react-redux';
import axios from '@/services/axios';
import { useQuery } from '@tanstack/react-query';
import './PaymentPage.css'
import { ICONS } from '@/assets';

interface CartItem {
    product: string;
    productId: string;
    domainName?: string; 
    period?: string; 
    name?: string; 
    status?: string; 
    price?: {
        productId: string;
        tld: string;
        year: number;
        registerPrice: number;
        _id: string;
    }[];
}

interface Product {
    name: string;
    link: string;
    img: StaticImageData;
    price: string;
    domainName?: string;
    period?: string;
}

const PaymentPage = () => {
    const [products, setProducts] = useState<Product[]>([]);
    console.log(products);
    const [loading, setLoading] = useState<boolean>(true);
    const [subtotal, setSubtotal] = useState<number>(0);
    const [tax, setTax] = useState<number>(0);
    const [total, setTotal] = useState<number>(0);

    const isAuthenticated = useSelector((state: any) => state.auth.isAuthenticated);
    const token = useSelector((state: any) => state.auth.token);

    const fetchCartFromAPI = async () => {
        const response = await axios.get('https://liveserver.nowdigitaleasy.com:5000/cart');
        return response.data;
    };

    const { data: apiCartData, isLoading: apiLoading } = useQuery({
        queryKey: ['cartData'],
        queryFn: fetchCartFromAPI,
        enabled: isAuthenticated,
    });

    useEffect(() => {
        const fetchCartItems = () => {
            try {
                if (!isAuthenticated) {
                    const savedCart = localStorage.getItem('cart');
                    const cartItems: CartItem[] = savedCart ? JSON.parse(savedCart) : [];

                    const formattedProducts: Product[] = cartItems.map((item) => {
                        if (item.product === "Hosting") {
                            return {
                                name: "Hosting",
                                link: item.domainName || "Unknown Hosting",
                                img: CART.database, 
                                price: `₹ ${item.price}/-`, 
                                domainName: item.domainName,
                                period: item.period,
                            };
                        } else if (item.product === "Gsuite") {
                            return {
                                name: "Gsuite",
                                link: item.domainName || "Unknown Gsuite Product",
                                img: CART.google, 
                                price: `₹ ${item.price}/-`, 
                                domainName: item.domainName,
                                period: item.period,
                            };
                        } else {
                            return {
                                name: "Domain",
                                link: item.name || "Unknown Product",
                                img: CART.www, 
                                price: item.price ? `₹${item.price[0].registerPrice}` : "N/A",
                            };
                        }
                    });

                    setProducts(formattedProducts);
                } else if (apiCartData) {
                    console.log(apiCartData)
                    const formattedProducts: Product[] = apiCartData.products.map((item: any) => {
                        let productImage = CART.www; // Default image for domains
                        if (item.product.toLowerCase() === 'hosting') {
                            productImage = CART.database;
                        } else if (item.product.toLowerCase() === 'gsuite') {
                            productImage = CART.google;
                        }

                        return {
                            name: item.product || 'Unknown Product',
                            link: item.domainName || 'Unknown Product',
                            img: productImage,
                            price: `₹ ${item.pleskPrice || item.gsuitePrice || item.domainprice || 0}/-`,
                            domainName: item.domainName,
                            period: item.period || `${item.year} Year` || 'Unknown Period',
                        };
                    });

                    setProducts(formattedProducts);

                    // Calculate subtotal, tax, and total
                    setSubtotal(apiCartData.subTotal || 0);
                    const cgstAmt = apiCartData.gst.cgst.Amt || 0;
                    const sgstAmt = apiCartData.gst.sgst.Amt || 0;
                    setTax(cgstAmt + sgstAmt);
                    setTotal(apiCartData.Total || 0);
                }
            } catch (error) {
                console.error('Error fetching cart items:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCartItems();
    }, [isAuthenticated, apiCartData]);

    if (loading || apiLoading) {
        return <div className="text-center">Loading...</div>;
    }

    return (
        <div className="payment w-full">
            <div className='divide-y divide-gray-200'>
                <Accordion className='divide-y divide-gray-200'>
                    <AccordionItem 
                        key="1" 
                        aria-label="Order Summary"
                        title={
                            <h3 className="flex justify-between items-center text-lg font-medium">
                                <span>Order Summary ({products.length})</span>
                            </h3>
                        }
                        className='divide-y divide-gray-200'
                    >
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {products.length > 0 ? (
                                        products.map((product, index) => (
                                            <tr key={index} className="flex flex-col sm:table-row">
                                                <td className="flex items-center px-2 py-3 sm:px-4 sm:py-4 text-sm text-gray-800">
                                                    <Image src={product.img} alt={product.name} className="w-8 h-8 sm:w-12 sm:h-12 mr-3" />
                                                    <div>
                                                        <h3 className="font-semibold text-sm sm:text-base text-left">{product.name}</h3>
                                                        <a href={product.link} className="text-blue-500 text-xs sm:text-sm break-all">{product.link}</a>
                                                    </div>
                                                </td>
                                                {/* <td className="text-xs sm:text-sm text-gray-800 px-2 py-1 sm:px-4 sm:py-4">
                                                    {product.domainName ? (
                                                        <div>
                                                            {product.period && <p>{product.period}</p>}
                                                        </div>
                                                    ) : "N/A"}
                                                </td> */}
                                                <td className="px-2 py-2 sm:px-4 sm:py-4 text-sm text-gray-800">
                                                    <div className='flex  items-center justify-end'>
                                                        <span className="font-semibold font-roboto">{product.price}</span>
                                                        {/* <button className="text-red-500 ml-2">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-trash" viewBox="0 0 16 16">
                                                                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z" />
                                                                <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z" />
                                                            </svg>
                                                        </button> */}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={3} className="text-center text-gray-500 py-4">No items in cart.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </AccordionItem>
                </Accordion>
            </div>
            
            <div className="w-full items-center justify-between mt-3">
                <div className='w-full flex items-start justify-between'>
                    <span className='text-[#0A41FC] font-bold'>Have a Coupon Code?</span>
                    <div className="flex flex-col items-end gap-2">
                        <span>Subtotal : ₹ {total}</span>
                        <span>Tax : ₹ {tax}</span>
                    </div>
                </div>
                <hr />
                <div className="w-full flex items-center justify-end">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-lg font-medium">Total</span>
                        <span className="text-lg font-bold">₹ {total + tax}</span>
                    </div>
                </div>
                <hr />
            </div>

            <div className="flex items-center justify-center mt-6">
                <button className="w-full sm:w-2/4 bg-blue-600 text-white text-sm sm:text-base py-3 rounded hover:bg-blue-700 transition-colors">
                    Pay ₹{total + tax}
                </button>
            </div>
        </div>
    );
};

export default PaymentPage;
