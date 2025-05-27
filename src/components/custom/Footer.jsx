import React from "react";
import { Button } from "../ui/button";
import { Link } from "react-router-dom";
import {
  AiFillGithub,
  AiFillInstagram,
  AiFillLinkedin,
  AiFillMail,
  AiFillTwitterCircle,
} from "react-icons/ai";

function Footer({ footerRef }) {
  const socialIcons = [
    {
      name: "Mail",
      icon: <AiFillMail />,
      link: "ruas21etcs@gmail.com",
    },
  ];
  return (
    <div
      ref={footerRef}
      className="footer w-full flex flex-col text-muted-foreground items-center justify-center md:p-4 py-2 border-t"
    >
      <p className="sm:font-semibold sm:text-lg  bg-gradient-to-b from-primary/90 to-primary/60 bg-clip-text text-transparent">
        Made by Group 22
      </p>
      <div className="logos flex items-center justify-center gap-5 w-full">
        {socialIcons.map((item, index) => {
          return (
            <Link
              key={index}
              to={item.link}
              target="_blank"
              rel="noopener noreferrer"
            >
              {item.icon}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default Footer;




