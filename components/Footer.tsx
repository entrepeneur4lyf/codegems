'use client';

import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-slate-900/90 text-gray-400 border-t border-slate-700 py-4">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <p>
          © {new Date().getFullYear()} Code Gems. Built by Bebedi with ❤️ and <span className="text-purple-400">Next.js</span>.
        </p>
        <div className="mt-4">
          <a href="https://github.com/bebedi15/codegems" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white mx-2">
            GitHub
          </a>
          <a href="https://discord.gg/QtnFGDQj5S" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white mx-2">
            Discord
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
