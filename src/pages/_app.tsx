import "@/styles/globals.css";
import type { AppProps } from "next/app";
// import { Montserrat, Viaoda_Libre } from "next/font/google";

// Move the font loader to the module scope (outside the component)
// const montserrat = Montserrat({
//   subsets: ["latin"],
//   weight: ["100", "300", "400", "500", "600", "900"],
//   style: ["normal", "italic"], // If you need italic styles
//   variable: "--font-montserrat",
// });

// const viaodaLibre = Viaoda_Libre({
//   subsets: ["latin"],
//   weight: "400",
//   variable: "--font-viaoda",
// });

export default function App({ Component, pageProps }: AppProps) {
  return (
    <main
    // className={`${montserrat.className} ${viaodaLibre.className}`}
    >
      <Component {...pageProps} />
    </main>
  );
}
