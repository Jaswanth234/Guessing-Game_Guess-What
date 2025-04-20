import { Link } from 'wouter';
import { Brain } from 'lucide-react';
import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Link href="/">
              <div className="flex items-center mb-4 cursor-pointer">
                <div className="bg-white p-2 rounded-lg mr-2">
                  <Brain className="h-5 w-5 text-primary" />
                </div>
                <span className="text-xl font-bold font-sans">QuizMaster</span>
              </div>
            </Link>
            <p className="text-gray-400 mb-4">Create interactive quiz games that engage your audience in real-time.</p>
            <div className="flex space-x-4">
              <div className="text-gray-400 hover:text-white transition cursor-pointer">
                <FaFacebookF />
              </div>
              <div className="text-gray-400 hover:text-white transition cursor-pointer">
                <FaTwitter />
              </div>
              <div className="text-gray-400 hover:text-white transition cursor-pointer">
                <FaInstagram />
              </div>
              <div className="text-gray-400 hover:text-white transition cursor-pointer">
                <FaLinkedinIn />
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/">
                  <div className="text-gray-400 hover:text-white transition cursor-pointer">Home</div>
                </Link>
              </li>
              <li>
                <Link href="/#features">
                  <div className="text-gray-400 hover:text-white transition cursor-pointer">Features</div>
                </Link>
              </li>
              <li>
                <Link href="/auth">
                  <div className="text-gray-400 hover:text-white transition cursor-pointer">Sign In</div>
                </Link>
              </li>
              <li>
                <Link href="/auth?register=true">
                  <div className="text-gray-400 hover:text-white transition cursor-pointer">Register</div>
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <div className="text-gray-400 hover:text-white transition cursor-pointer">Documentation</div>
              </li>
              <li>
                <div className="text-gray-400 hover:text-white transition cursor-pointer">Tutorials</div>
              </li>
              <li>
                <div className="text-gray-400 hover:text-white transition cursor-pointer">Support Center</div>
              </li>
              <li>
                <div className="text-gray-400 hover:text-white transition cursor-pointer">FAQ</div>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4">Contact Us</h3>
            <ul className="space-y-2">
              <li className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <div className="text-gray-400 hover:text-white transition cursor-pointer">support@quizmaster.com</div>
              </li>
              <li className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <div className="text-gray-400 hover:text-white transition cursor-pointer">+1 (800) 123-4567</div>
              </li>
              <li className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-gray-400">123 Quiz St, San Francisco, CA 94107</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 mb-4 md:mb-0">© {new Date().getFullYear()} QuizMaster. All rights reserved.</p>
          <div className="flex space-x-4">
            <div className="text-gray-400 hover:text-white transition cursor-pointer">Privacy Policy</div>
            <div className="text-gray-400 hover:text-white transition cursor-pointer">Terms of Service</div>
            <div className="text-gray-400 hover:text-white transition cursor-pointer">Cookie Policy</div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
