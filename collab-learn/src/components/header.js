import { FiUser, FiChevronDown } from 'react-icons/fi';
import { FaBook, FaEthereum } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useState } from 'react';

const Header = ({ account, ethBalance, eduBalance, network, connectWallet }) => {
  const [isHovering, setIsHovering] = useState(false);

  const shortenAddress = (addr) => {
    return addr ? `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}` : '';
  };

  return (
    <header className="bg-gradient-to-r from-blue-600 to-purple-700 text-white p-4 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/">
          <div className="flex items-center space-x-2">
            <FaBook className="text-2xl" />
            <div className="text-2xl font-bold">CollabLearn</div>
          </div> 
        </Link>

        <div className="relative">
          {!account ? (
            <button
              onClick={connectWallet}
              className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full transition-all"
            >
              <FiUser className="text-lg" />
              <span>Connect Wallet</span>
            </button>
          ) : (
            <div 
              onClick={() => setIsHovering(!isHovering)}
              className="group relative cursor-pointer"
            >
              <div className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full">
                <FiUser className="text-lg" />
                <span>{shortenAddress(account)}</span>
                <FiChevronDown className="text-sm" />
              </div>

              {isHovering && (
                <div className="absolute right-0 mt-2 w-64 bg-white text-gray-800 rounded-xl shadow-xl z-50 border border-gray-100">
                  <div className="p-4 space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <FaEthereum className="text-blue-600 text-xl" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {network?.name === 'holesky' ? 'Holesky Testnet' : network?.name || 'Unknown Network'}
                        </p>
                        <p className="text-xs text-gray-500">Connected</p>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-gray-100">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">ETH Balance:</span>
                        <div className="flex items-center space-x-1">
                          <FaEthereum className="text-gray-600" />
                          <span className="font-medium">{ethBalance}</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">EduToken:</span>
                        <span className="font-medium">
                          {eduBalance || '0'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {network && network.chainId !== 17000n && (
        <div className="text-center py-2 bg-orange-100 text-orange-700">
          ⚠️ You're not on Holesky Testnet! Some features may not work properly.
        </div>
      )}
    </header>
  );
};

export default Header;