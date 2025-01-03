'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Terminal, Home, Bookmark, Menu, X, Send } from 'lucide-react';

interface NavLinkProps {
  icon: React.ElementType;
  text: string;
  href: string;
  activeNav: string;
  setActiveNav: (id: string) => void;
}

const NavLink = ({ icon: Icon, text, href, activeNav, setActiveNav }: NavLinkProps) => (
  <Link href={href}>
    <button
      onClick={() => setActiveNav(href)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
        activeNav === href
          ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white'
          : 'text-gray-400 hover:text-white'
      }`}
    >
      <Icon className={`h-5 w-5 transition-transform duration-300 ${activeNav === href ? 'scale-110' : ''}`} />
      <span className="hidden md:block">{text}</span>
    </button>
  </Link>
);

const Navbar = () => {
  const pathname = usePathname(); // Get the current pathname
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('/');

  useEffect(() => {
    // Set the activeNav to the current pathname
    setActiveNav(pathname);
  }, [pathname]);

  return (
    <nav className="fixed top-0 w-full bg-slate-900/90 backdrop-blur-lg border-b border-slate-700 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <Terminal className="h-6 w-6 text-purple-400" />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text">
                Code Gems
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-4">
            <NavLink icon={Home} text="Home" href="/" activeNav={activeNav} setActiveNav={setActiveNav} />
            <NavLink icon={Bookmark} text="Saved" href="/saved" activeNav={activeNav} setActiveNav={setActiveNav} />
            <NavLink icon={Send} text="Project Request" href="/request" activeNav={activeNav} setActiveNav={setActiveNav} />
            {/* <NavLink icon={Github} text="Profile" href="/profile" activeNav={activeNav} setActiveNav={setActiveNav} /> */}
          </div>

          <button
            className="md:hidden p-2 text-gray-400 hover:text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      <div
        className={`md:hidden transition-all duration-300 ${
          isMenuOpen ? 'max-h-48 opacity-100 border-b border-slate-700' : 'max-h-0 opacity-0 overflow-hidden'
        }`}
      >
        <div className="px-4 py-2 space-y-2">
          <NavLink icon={Home} text="Home" href="/" activeNav={activeNav} setActiveNav={setActiveNav} />
          <NavLink icon={Bookmark} text="Saved" href="/saved" activeNav={activeNav} setActiveNav={setActiveNav} />
          <NavLink icon={Send} text="Project Request" href="/request" activeNav={activeNav} setActiveNav={setActiveNav} />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
