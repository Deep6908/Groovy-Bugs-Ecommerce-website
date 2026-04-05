import React, { useRef, useState } from "react";
// --- CHANGE 1: Import from the new, correct package ---
import emailjs from '@emailjs/browser'; 
import { toast } from 'react-toastify';
import { FaFacebookF, FaInstagram, FaPinterestP } from 'react-icons/fa';
import { IoSend } from 'react-icons/io5';

// A. THE SLEEK CONTACT FORM COMPONENT (Now using @emailjs/browser)
const ContactForm = () => {
  const form = useRef();
  const [status, setStatus] = useState('idle'); // 'idle', 'sending', 'success', 'error'
  
  const sendEmail = (e) => {
    e.preventDefault();
    setStatus('sending');

    // --- IMPORTANT: Replace with your actual Email.js IDs ---
    const serviceID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateID2 = import.meta.env.VITE_EMAILJS_TEMPLATE_ID2;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
    // ----------------------------------------------------

    // The sendForm method is still available in the new library and works perfectly.
    // The signature (serviceID, templateID, form, publicKey) is correct.
    emailjs.sendForm(serviceID, templateID2, form.current, publicKey)
      .then((result) => {
          console.log('SUCCESS!', result.text);
          toast.success("Thanks for your message! We'll be in touch soon.", { theme: 'dark' });
          setStatus('success');
          form.current.reset();
      }, (error) => {
          console.log('FAILED...', error.text);
          toast.error("Oops! Something went wrong. Please try again.", { theme: 'dark' });
          setStatus('error');
      });
  };

  return (
    <div className="border-t border-purple-900/50 mt-12 pt-10">
      <h3 className="font-display text-2xl text-center font-bold uppercase mb-6 tracking-wider text-white">
        Get In Touch
      </h3>
      <form
        ref={form}
        onSubmit={sendEmail}
        className="flex flex-col md:flex-row items-center gap-4 max-w-3xl mx-auto"
      >
        <input
          type="email"
          name="user_email" // This 'name' must match the variable in your EmailJS template, e.g., {{user_email}}
          placeholder="Your Email Address"
          required
          className="font-mono text-sm w-full flex-1 p-3 bg-[#23102e] border-2 border-transparent rounded-lg focus:outline-none focus:border-purple-600 transition-all"
        />
        <input
          type="text"
          name="message" // This 'name' must match the variable in your EmailJS template, e.g., {{message}}
          placeholder="Your Message..."
          required
          className="font-mono text-sm w-full flex-1 p-3 bg-[#23102e] border-2 border-transparent rounded-lg focus:outline-none focus:border-purple-600 transition-all"
        />
        <button
          type="submit"
          disabled={status === 'sending'}
          className="font-mono w-full md:w-auto flex justify-center items-center gap-2 px-6 py-3 bg-purple-600 rounded-lg font-bold hover:bg-purple-700 transition-all disabled:bg-purple-900 disabled:cursor-not-allowed"
        >
          {status === 'sending' ? 'Sending...' : <>Send <IoSend /></>}
        </button>
      </form>
    </div>
  );
};


// B. THE MAIN FOOTER COMPONENT (No changes needed here)
const Footer = () => {
  const moreLinks = [
    { name: 'TRACK MY ORDER', href: '/track-order' },
    { name: 'SUPPORT', href: '/support' },
    { name: 'SHIPPING POLICY', href: '/shipping-policy' },
    { name: 'B2B ENQUIRIES', href: '/b2b' },
    { name: 'RETURNS AND REFUNDS', href: '/returns' },
    { name: 'TERMS AND CONDITIONS', href: '/terms' },
    { name: 'PRIVACY POLICY', href: '/privacy' },
  ];

  const socialLinks = [
    { href: '#', icon: <FaFacebookF />, name: 'Facebook' },
    { href: 'https://www.instagram.com/groovy.bugz/', icon: <FaInstagram />, name: 'Instagram' },
    { href: '#', icon: <FaPinterestP />, name: 'Pinterest' },
  ];

  return (
    <footer className="bg-[#0c0513] text-white pt-16 pb-8 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Column 1: About Us */}
          <div className="text-center md:text-left">
            <h3 className="font-display text-2xl font-bold uppercase mb-4 tracking-wider">
              About Us
            </h3>
            <p className="font-mono text-base text-gray-300 max-w-sm mx-auto md:mx-0">
              We're working on creating the sexiest aestheticism store. All about
              New-age and Vintage room-decor.
            </p>
          </div>

          {/* Column 2: More Links & Socials */}
          <div className="text-center">
            <h3 className="font-display text-2xl font-bold uppercase mb-4 tracking-wider">
              More
            </h3>
            <ul className="font-mono text-sm text-gray-300 space-y-2">
              {moreLinks.map(link => (
                <li key={link.name}>
                  <a href={link.href} className="hover:text-purple-400 transition-colors duration-200">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
            <div className="flex justify-center space-x-4 mt-6">
              {socialLinks.map(link => (
                <a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.name}
                  className="bg-[#23102e] text-xl p-3 rounded-lg hover:bg-purple-600 hover:scale-110 transition-all duration-200"
                >
                  {link.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Column 3: Logo */}
          <div className="flex justify-center md:justify-end items-start">
            <img
              src="/images/logo.jpg"
              alt="Groovy Bugs Logo"
              className="w-40 h-auto object-contain"
            />
          </div>
        </div>
        
        {/* Contact Form Section */}
        <ContactForm />

        {/* Copyright Section */}
        <div className="mt-16 text-center">
          <span className="font-mono text-sm text-gray-500 tracking-widest">
            © 2025, Groovy Bugs
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;