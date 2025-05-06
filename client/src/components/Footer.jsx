import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Linkedin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-secondary py-16">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Logo and Description */}
          <div className="col-span-1 lg:col-span-1">
            <Link to="/" className="inline-block text-xl font-semibold mb-4">
              <span className="text-primary">Trailblazer Nation</span>
            </Link>
            <p className="text-foreground/70 mb-4">
              Empowering communities through intuitive management tools.
            </p>
          </div>
          
          {/* Quick Links */}
          <div>
            <h4 className="text-base font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-foreground/70 hover:text-primary transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-foreground/70 hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-foreground/70 hover:text-primary transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-foreground/70 hover:text-primary transition-colors">
                  Login
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Resources */}
          <div>
            <h4 className="text-base font-semibold mb-4">Resources</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/privacy" className="text-foreground/70 hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-foreground/70 hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-foreground/70 hover:text-primary transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Contact */}
          <div>
            <h4 className="text-base font-semibold mb-4">Contact</h4>
            <ul className="space-y-2">
              <li className="text-foreground/70">
                Email: info@trailblazernation.com
              </li>
              <li className="text-foreground/70">
                Phone: (123) 456-7890
              </li>
            </ul>
            
            {/* Social Media */}
            <div className="flex space-x-4 mt-4">
              <a href="#" className="text-foreground/70 hover:text-primary transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-foreground/70 hover:text-primary transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-foreground/70 hover:text-primary transition-colors">
                <Linkedin size={20} />
              </a>
            </div>
          </div>
        </div>
        
        {/* Copyright */}
        <div className="pt-8 border-t border-border">
          <p className="text-center text-foreground/70">
            © {new Date().getFullYear()} Trailblazer Nation. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;