import { ICONS, IMAGES } from "@/assets";
import Image from "next/image";
import './style.css'


const Hero = () => {
  return (
    <div className="hero home-hero relative bg-gradient-light">
      <div className="absolute inset-0 z-0">
        <Image 
          src={IMAGES.home} 
          alt="home banner" 
          layout="fill" 
          objectFit="cover" 
          quality={100}
        />
      </div>
      <div className="relative hero-content z-10">
        <div className="w-100 hero-flex flex md:flex-row justify-between items-center gap-10 max-2xl:gap-10 ">
          <div className="flex flex-col gap-[40px] lg:items-start text-center lg:text-left items-center md:items-start sm:items-center xl:min-w-[40vw] hero-left">
            {/* Heading */}
           <div className="flex flex-col sm:w-full w-full gap-[30px] hero-text">
           <h1 className="text-center md:text-left lg:text-left 2xl:text-left hidden sm:block text-home-heading">
              Hey Business Owners
              <br/>
             <span className="text-[#0011FF]">Go Digital</span> Effortlessly
            </h1> 
           <h4 className="text-center sm:hidden block text-home-heading">
              Hey Business Owners
              <br/>
             <span className="text-[#0011FF]">Go Digital</span> Effortlessly
            </h4> 
            <p className="md:text-left text-center">
              Stop being static! Scale your business by going digital, the easy
              way, with NDE. We’re technology-enabled and structured for speed and
              efficiency to meet the ever-changing needs of today’s business.
            </p>
           </div>
            <button className="bg-gradient-button px-6 md:px-8 lg:px-10 py-2 md:py-3 text-white text-base md:text-lg lg:text-xl font-500 rounded-[8px] shadow-[0px_2px_2px_0px_#00000040]">
              <div className="flex gap-[12px] items-start sm:items-center">
                <p className="font-medium text-[17px] font-roboto-serif lg:hidden block">Get Started</p>
                <h5 className="font-black text-[24px] font-roboto hidden lg:block">TRY FOR FREE</h5>
                <Image src={IMAGES.arrow} alt="arrow" />
              </div>
            </button>
          </div>
          {/* Video Placeholder */}
          <div className="aspect-[1.6/1] bg-[#FEF3E3] rounded-[34px] border-[10px] lg:border-[15px] md:border-[15px] w-[100%] xl:max-w-[52vw] min-w-[45vw] border-black"></div>
        </div>
      </div>
      <span className="flex text-center text-2xl max-2xl:text-xl max-lg:text-lg font-bold pt-[80px] md:pt-[100px] lg:pt-[120px] pb-[14px] leading-[20.4px] text-home-body justify-center font-roboto-serif">
        12,000+ global businesses trust us to transform & grow digitally
      </span>
      <div className="flex justify-center items-center gap-4 md:gap-8 lg:gap-16 pb-6 overflow-hidden ">
        <Image src={IMAGES.brand2} alt="" className="w-[60px] md:w-[80px] lg:w-[100px] h-[60px] md:h-[80px] lg:h-[100px]" />
        <Image src={IMAGES.brand3} alt="" className="w-[60px] md:w-[80px] lg:w-[100px] h-[60px] md:h-[80px] lg:h-[100px]" />
        <Image src={IMAGES.brand6} alt="" className="w-[60px] md:w-[80px] lg:w-[100px] h-[60px] md:h-[80px] lg:h-[100px]" />
        <Image src={IMAGES.brand4} alt="" className="w-[60px] md:w-[80px] lg:w-[100px] h-[60px] md:h-[80px] lg:h-[100px]" />
        <Image src={IMAGES.brand5} alt="" className="w-[60px] md:w-[80px] lg:w-[100px] h-[60px] md:h-[80px] lg:h-[100px]" />
        <Image src={IMAGES.brand1} alt="" className="w-[60px] md:w-[80px] lg:w-[100px] h-[60px] md:h-[80px] lg:h-[100px]" />
        <Image src={IMAGES.brand7} alt="" className="w-[60px] md:w-[80px] lg:w-[100px] h-[60px] md:h-[80px] lg:h-[100px]" />
        <Image src={ICONS.gol}     alt="" className="w-[60px] md:w-[80px] lg:w-[100px] h-[60px] md:h-[80px] lg:h-[100px]" />
        <Image src={IMAGES.brand1} alt="" className="w-[60px] md:w-[80px] lg:w-[100px] h-[60px] md:h-[80px] lg:h-[100px]" />
        <Image src={IMAGES.brand7} alt="" className="w-[60px] md:w-[80px] lg:w-[100px] h-[60px] md:h-[80px] lg:h-[100px]" />
        <Image src={ICONS.gol}     alt="" className="w-[60px] md:w-[80px] lg:w-[100px] h-[60px] md:h-[80px] lg:h-[100px]" />
      </div>
    </div>
  );
};

export default Hero;
