import { useState, useEffect, useCallback } from 'react';
import { BrowserProvider, ethers } from 'ethers';
import { FiUser, FiChevronDown, FiLogOut } from 'react-icons/fi';
import { FaBook, FaEthereum } from 'react-icons/fa';
import { collabLearnABI, collabLearnAddress } from '../utils/contract';

const Header = () => {
  const [account, setAccount] = useState('');
  const [ethBalance, setEthBalance] = useState('0');
  const [eduBalance, setEduBalance] = useState(null);
  const [network, setNetwork] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);

  const connectWallet = useCallback(async () => {
    try {
      if (!window.ethereum) {
        alert('Please install MetaMask!');
        return;
      }

      const newProvider = new BrowserProvider(window.ethereum);
      setProvider(newProvider);
      
      const accounts = await newProvider.send("eth_requestAccounts", []);
      const signer = await newProvider.getSigner();
      setSigner(signer);
      setAccount(accounts[0]);
      setIsConnected(true);

      const network = await newProvider.getNetwork();
      setNetwork(network);

      const ethBalance = await newProvider.getBalance(accounts[0]);
      setEthBalance(ethers.formatEther(ethBalance).substring(0, 6));

      const contract = new ethers.Contract(
        collabLearnAddress, 
        collabLearnABI, 
        signer
      );

      try {
        const eduBalance = await contract.balanceOf(accounts[0]);
        setEduBalance(ethers.formatUnits(eduBalance, 18));
        
      } catch (error) {
        console.error("Error fetching EDU balance:", error);
        setEduBalance("0");
      }

    } catch (error) {
      console.error("Wallet connection error:", error);
      alert(`Error connecting wallet: ${error.message}`);
    }
  }, []);

  useEffect(() => {
    const checkExistingConnection = async () => {
      if (window.ethereum?.selectedAddress) {
        const provider = new BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          connectWallet();
        }
      }
    };

    checkExistingConnection();
  }, [connectWallet]);

  useEffect(() => {
    if (!window.ethereum || !provider) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        provider.getBalance(accounts[0]).then(balance => {
          setEthBalance(ethers.formatEther(balance).substring(0, 6));
        });
      } else {
        disconnectWallet();
      }
    };

    const handleChainChanged = () => window.location.reload();

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [provider]);

  const disconnectWallet = () => {
    setAccount('');
    setEthBalance('0');
    setEduBalance(null);
    setIsConnected(false);
    setIsHovering(false);
    setProvider(null);
  };


  const shortenAddress = (addr) => {
    return addr ? `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}` : '';
  };

  return (
    <header className="bg-gradient-to-r from-blue-600 to-purple-700 text-white p-4 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <FaBook className="text-2xl" />
          <div className="text-2xl font-bold">CollabLearn</div>
        </div>

        <div className="relative">
          {!isConnected ? (
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
                          {network?.name === 'sepolia' ? 'Sepolia Testnet' : network?.name || 'Unknown Network'}
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

                    <button
                      onClick={disconnectWallet}
                      className="w-full flex items-center justify-center space-x-2 mt-3 py-2 px-4 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <FiLogOut className="text-sm" />
                      <span className="text-sm">Disconnect</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {network && network.chainId !== 11155111n && (
        <div className="text-center py-2 bg-orange-100 text-orange-700">
          ⚠️ You're not on Sepolia Testnet! Some features may not work properly.
        </div>
      )}
    </header>
  );
};

export default Header;