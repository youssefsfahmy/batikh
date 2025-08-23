import NextHead from "next/head";
import React from "react";

type HeadProps = {
  title?: string;
  description?: string | null;
  image?: string;
  children?: React.ReactNode;
};

const Head: React.FC<HeadProps> = ({ children }) => {
  const defaultDescription =
    "Join us and our families as we celebrate our engagement with the people we love. All engagement details are in this link.";
  const defaultImg = `/open-graphs_optimized_300.png`;

  return (
    <NextHead>
      <title>{"Youssef and Sandra are getting engaged!"}</title>
      <meta property="og:type" content="website" />
      <meta
        property="og:title"
        content={"Youssef and Sandra are getting engaged!"}
      />
      <meta
        itemProp="name"
        content={"Youssef and Sandra are getting engaged!"}
      />
      <meta itemProp="description" content={defaultDescription} />
      <meta property="og:description" content={defaultDescription} />
      <meta itemProp="image" content={defaultImg} />
      <meta property="og:image" content={defaultImg} />
      <link rel="icon" href="/favicon.ico" />
      <meta
        property="og:title"
        content="Youssef and Sandra are getting engaged!"
      />
      {children}
    </NextHead>
  );
};

export default Head;
