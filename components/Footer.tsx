'use client';

import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-slate-900/90 text-gray-400 border-t border-slate-700 py-4">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <p>
          © {new Date().getFullYear()} Code Gems. Built with ❤️ and <span className="text-purple-400">Next.js</span>.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
