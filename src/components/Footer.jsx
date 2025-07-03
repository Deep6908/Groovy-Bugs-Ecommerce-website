import React from "react";

const Footer = () => (
  <footer className="bg-[#1a0c23] text-white pt-12 pb-6 mt-8">
    <div className="max-w-7xl mx-auto px-4 sm:px-8">
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-start gap-12 md:gap-0">
        {/* About Us */}
        <div className="flex-1 flex flex-col items-center md:items-start justify-start">
          <h3 className="font-display text-2xl font-bold uppercase mb-4 tracking-wider">
            About Us
          </h3>
          <p className="font-mono text-lg text-center md:text-left text-white max-w-md">
            We're working on creating the sexiest aestheticism store. All about
            New-age
            <br />
            and Vintage room-decor.
          </p>
        </div>
        {/* More */}
        <div className="flex-1 flex flex-col items-center md:items-center justify-start">
          <h3 className="font-display text-2xl font-bold uppercase mb-4 tracking-wider">
            More
          </h3>
          <ul className="font-mono text-lg text-white space-y-1 mb-4 text-center">
            <li>TRACK MY ORDER</li>
            <li>SUPPORT</li>
            <li>SHIPPING POLICY</li>
            <li>B2B ENQUIRIES</li>
            <li>RETURNS AND REFUNDS</li>
            <li>TERMS AND CONDITIONS</li>
            <li>PRIVACY POLICY</li>
          </ul>
          <div className="flex space-x-4 mt-2">
            <a
              href="#"
              className="bg-[#23102e] p-2 rounded hover:scale-110 transition-transform duration-200"
            >
              <img
                src="/images/facebook-logo.jpg"
                alt="Facebook"
                className="w-6 h-6"
              />
            </a>
            <a
              href="https://www.instagram.com/groovy.bugz/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#23102e] p-2 rounded hover:scale-110 transition-transform duration-200"
            >
              <img
                src="/images/instagram-logo.jpg"
                alt="Instagram"
                className="w-6 h-6"
              />
            </a>
            <a
              href="#"
              className="bg-[#23102e] p-2 rounded hover:scale-110 transition-transform duration-200"
            >
              <img
                src="/images/pinterest-logo.jpg"
                alt="Pinterest"
                className="w-6 h-6"
              />
            </a>
          </div>
        </div>
        {/* Logo */}
        <div className="flex-1 flex flex-col items-center md:items-end justify-start">
          <img
            src="/images/logo.jpg"
            alt="Groovy Bugs Logo"
            className="w-48 h-auto object-contain mb-2"
          />
        </div>
      </div>
      <div className="mt-10 text-center">
        <span className="font-mono text-lg text-white tracking-widest">
          © 2025, Groovy Bugs
        </span>
      </div>
    </div>
  </footer>
);

export default Footer;
