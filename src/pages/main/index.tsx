import Head from "@/components/head";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import Location from "./location";

type CustomLinkProps = {
  href: string;
  text: string;
  height?: string;
  width?: string;
  top?: string;
  fontSize?: string;

  icon?: boolean;
  target?: string;
  heightD?: string;
  widthD?: string;
  topD?: string;
  fontSizeD?: string;
  leftD?: string;
};

const CustomLink: React.FC<CustomLinkProps> = ({
  href,
  text,
  height = "3.6%",
  width = "62.5%",
  top = "40.3%",
  fontSize = "3.1vw",
  target = "_blank",
  icon,
  heightD = "3.6%",
  widthD = "62.5%",
  topD = "40.3%",
  leftD = "10%",
  fontSizeD = "3.1vw",
}) => {
  return (
    <>
      <Link
        className={`absolute sm:hidden font-montserrat rounded-full bg-[#b5c7a0] hover:bg-[#d6e0c6] text-black text-center font-medium sm:!text-[18.5px] flex justify-center items-center transition-all duration-300 ease-in-out
        border-[1px] border-[#aabc95] 
        gap-2
        `}
        style={{
          height,
          width,
          top,
          fontSize,
          boxShadow:
            "0 4px 6px -1px rgb(0 0 0 / 0.2), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        }}
        target={target}
        rel="noopener noreferrer"
        href={href}
      >
        {icon && <Location />}
        {text}
      </Link>
      <Link
        className={`absolute hidden sm:flex font-montserrat rounded-full bg-[#d6e0c6] hover:bg-[#ebf4d8] text-black text-center font-medium   justify-center items-center transition-all duration-300 ease-in-out
        border-[1px] border-[#c9d2bc] 
        gap-2
        `}
        style={{
          height: heightD,
          width: widthD,
          top: topD,
          fontSize: fontSizeD,
          left: leftD,
          boxShadow:
            "0 4px 6px -1px rgb(0 0 0 / 0.2), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        }}
        target={target}
        rel="noopener noreferrer"
        href={href}
      >
        {icon && <Location />}
        {text}
      </Link>
    </>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MapLink: React.FC<any> = ({
  href,
  text,
  top = "40.3%",
  left = "40.3%",
  fontSize = "3.1vw",
}) => {
  return (
    <Link
      className={`absolute font-montserrat rounded-full  text-black text-center font-medium sm:!text-[14.5px] flex justify-center items-center transition-all duration-300 ease-in-out
        `}
      style={{
        left,
        top,
        fontSize,
      }}
      target="_blank"
      rel="noopener noreferrer"
      href={href}
    >
      {text}
    </Link>
  );
};

export default function Main() {
  const handleScrollToSection = (id: string) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({
        behavior: "smooth",
        block: "center", // Ensures the section is centered in the viewport
      });
    }
  };
  return (
    <div className="bg-[#fefcf1] flex justify-center">
      <Head />

      <nav className="absolute top-0 left-0 w-full z-50 pb-4 font-montserrat">
        <ul className="max-w-xl flex justify-between py-4 px-4 mx-auto">
          <li>
            <button
              onClick={() => handleScrollToSection("invitation")}
              className="text-base md:text-lg text-gray-700 hover:text-gray-900"
            >
              Invitation
            </button>
          </li>
          <li>
            <button
              onClick={() => handleScrollToSection("map")}
              className="text-base md:text-lg text-gray-700 hover:text-gray-900"
            >
              Map
            </button>
          </li>
          <li>
            <button
              onClick={() => handleScrollToSection("dresscode")}
              className="text-base md:text-lg text-gray-700 hover:text-gray-900"
            >
              Dresscode
            </button>
          </li>
          <li>
            <button
              onClick={() => handleScrollToSection("registry")}
              className="text-base md:text-lg text-gray-700 hover:text-gray-900"
            >
              Registry
            </button>
          </li>
          <li>
            <button
              onClick={() => handleScrollToSection("rsvp")}
              className="text-base md:text-lg text-gray-700 hover:text-gray-900"
            >
              RSVP
            </button>
          </li>
        </ul>
      </nav>

      {/* Sections Container with Snap Scrolling */}
      <div className="w-full snap-y snap-mandatory  overflow-y-scroll scroll-smooth  justify-self-center">
        {/* Invitation Section */}
        <section
          id="invitation"
          className="w-full bg-[#fefcf1] flex items-center justify-center snap-start relative"
        >
          <Image
            src="/LaptopView1-Invite.jpg"
            alt="Next.js logo"
            layout="responsive"
            width={2358} // Original image width
            height={4154} // Original image height
            priority
            className="hidden sm:flex"
          />
          <Image
            src="/PhoneWebsiteInvitation.jpg"
            alt="Next.js logo"
            layout="responsive"
            width={2358}
            height={4154}
            priority
            className="sm:hidden"
          />
          <CustomLink
            href="https://maps.app.goo.gl/C4r3NYDLkb82ohb48"
            text="St. Mark Cathedral, Heliopolis"
            height="3.75%"
            width="63.5%"
            top="40.2%"
            fontSize="3.1vw"
            icon
            heightD="4.7%"
            widthD="31.7%"
            topD="69.3%"
            leftD="7.5%"
            fontSizeD="1.5vw"
          />
          <CustomLink
            href="https://maps.app.goo.gl/q1F8acgFPPhJjKWaA"
            text="Nūt Boutique Farm Lodge, Orabi"
            height="3.75%"
            width="63.5%"
            top="50.05%"
            fontSize="3.1vw"
            icon
            heightD="4.7%"
            widthD="33.7%"
            topD="85.1%"
            leftD="6.5%"
            fontSizeD="1.5vw"
          />
          <CustomLink
            href="/form"
            text="RSVP here"
            height="3.8%"
            width="28.5%"
            top="91.7%"
            fontSize="3.5vw"
            target=""
            heightD="7.1%"
            widthD="17.2%"
            topD="82.7%"
            leftD="63.5%"
            fontSizeD="2vw"
          />
        </section>
        {/* RSVP Section */}
        <section
          id="map"
          className=" bg-[#fefcf1] flex items-center justify-center snap-start relative"
        >
          <Image
            src="/PhoneWebsiteMap.jpg"
            alt="Next.js logo"
            layout="responsive"
            width={1000} // Original image width
            height={500} // Original image height
            className="sm:hidden"
          />
          <Image
            src="/LaptopView2-Map.jpg"
            alt="Next.js logo"
            layout="responsive"
            width={2358} // Original image width
            height={4154} // Original image height
            priority
            className="hidden sm:flex"
          />

          <MapLink
            href="https://maps.app.goo.gl/C4r3NYDLkb82ohb48"
            text="Church"
            top="79%"
            left="8%"
            fontSize="2.2vw"
          />
          <MapLink
            href="https://maps.app.goo.gl/q1F8acgFPPhJjKWaA"
            text="Venue"
            top="67.2%"
            left="73.5%"
            fontSize="2.2vw"
          />
          <CustomLink
            href="https://maps.app.goo.gl/C4r3NYDLkb82ohb48"
            text="Church Google Location"
            height="0%"
            width="0%"
            top="0%"
            fontSize="0vw"
            icon
            heightD="7.1%"
            widthD="24.5%"
            topD="71.8%"
            leftD="17.5%"
            fontSizeD="1.5vw"
          />
          <CustomLink
            href="https://maps.app.goo.gl/q1F8acgFPPhJjKWaA"
            text="Nūt Google Location"
            height="0%"
            width="0%"
            top="0%"
            fontSize="0vw"
            icon
            heightD="7.1%"
            widthD="21.1%"
            topD="53%"
            leftD="66.3%"
            fontSizeD="1.5vw"
          />
        </section>
        <section
          id="dresscode"
          className=" bg-[#fefcf1] flex items-center justify-center snap-start relative"
        >
          <Image
            src="/PhoneWebsiteDresscode.jpg"
            alt="Next.js logo"
            layout="responsive"
            width={1000} // Original image width
            height={500} // Original image height
            className="sm:hidden"
          />

          <Image
            src="/LaptopView3-Dresscode.jpg"
            alt="Next.js logo"
            layout="responsive"
            width={2358} // Original image width
            height={4154} // Original image height
            priority
            className="hidden sm:flex"
          />
        </section>
        {/* Dresscode Section */}
        <section
          id="registry"
          className=" bg-[#fefcf1] flex items-center justify-center snap-start relative"
        >
          <Image
            src="/PhoneWebsiteRegistry.jpg"
            alt="Next.js logo"
            layout="responsive"
            width={1000} // Original image width
            height={500} // Original image height
            className="sm:hidden"
          />
          <Image
            src="/LaptopView4-Gift.jpg"
            alt="Next.js logo"
            layout="responsive"
            width={2358} // Original image width
            height={4154} // Original image height
            priority
            className="hidden sm:flex"
          />
          <CustomLink
            href="https://www.amazon.com/wedding/share/karimari"
            text="Amazon USA"
            height="5.1%"
            width="36.5%"
            top="29.5%"
            fontSize="3.1vw"
            heightD="6.8%"
            widthD="32.6%"
            topD="37.9%"
            leftD="33.5%"
            fontSizeD="2vw"
          />
          <CustomLink
            href="https://efreshli.com/giftlists/116"
            text="Efreshli"
            height="5.1%"
            width="36.5%"
            top="66%"
            fontSize="3.1vw"
            heightD="6.8%"
            widthD="32.6%"
            topD="56.2%"
            leftD="33.5%"
            fontSizeD="2vw"
          />
        </section>
        {/* Registry Section */}
        <section
          id="rsvp"
          className="w-full bg-[#fefcf1] flex items-center justify-center snap-start relative"
        >
          <Image
            src="/PhoneWebsiteThank you note.jpg"
            alt="Next.js logo"
            layout="responsive"
            width={1000} // Original image width
            height={500} // Original image height
            priority
            className="sm:hidden"
          />
          <Image
            src="/LaptopView5-THankyou.jpg"
            alt="Next.js logo"
            layout="responsive"
            width={2358} // Original image width
            height={4154} // Original image height
            priority
            className="hidden sm:flex"
          />
          <CustomLink
            href="/form"
            text="RSVP here"
            height="3.65%"
            width="52%"
            top="37.2%"
            fontSize="3.5vw"
            target=""
            heightD="4.2%"
            widthD="28%"
            topD="33.9%"
            leftD="36%"
            fontSizeD="2vw"
          />
        </section>
      </div>
    </div>
  );
}
