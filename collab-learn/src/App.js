import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { BrowserProvider, ethers } from 'ethers';
import { collabLearnABI, collabLearnAddress } from './utils/contract';
import Header from './components/header';
import MainPage from './pages/main';
import Marketplace from './pages/market';
import FileExchange from './pages/exchange';
import './App.css';

function App() {
  const [account, setAccount] = useState('');
  const [ethBalance, setEthBalance] = useState('0');
  const [eduBalance, setEduBalance] = useState('0');
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [network, setNetwork] = useState(null);
  const [hasClaimed, setHasClaimed] = useState(false);
  const [canClaimTokens, setCanClaimTokens] = useState(false);

  const connectWallet = async () => {
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

      const network = await newProvider.getNetwork();
      setNetwork(network);

      // Get balances
      const ethBal = await newProvider.getBalance(accounts[0]);
      setEthBalance(ethers.formatEther(ethBal).substring(0, 6));
      
      const contract = new ethers.Contract(
        collabLearnAddress,
        collabLearnABI,
        signer
      );
      
      const eduBal = await contract.balanceOf(accounts[0]);
      setEduBalance(ethers.formatUnits(eduBal, 18));

      // Check claim status
      const claimedStatus = await contract.hasClaimed(accounts[0]);
      setHasClaimed(claimedStatus);
      
      const canClaim = await contract.canClaim(accounts[0]);
      setCanClaimTokens(canClaim);

    } catch (error) {
      console.error("Wallet connection error:", error);
      alert(`Error connecting wallet: ${error.message}`);
    }
  };

  // Check existing connection on mount
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
  }, []);

  // Handle account changes
  useEffect(() => {
    if (!window.ethereum || !provider) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length > 0) {
        connectWallet(); // Reconnect when accounts change
      } else {
        // Disconnect if no accounts
        setAccount('');
        setEthBalance('0');
        setEduBalance('0');
        setHasClaimed(false);
        setCanClaimTokens(false);
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

  return (
    <Router>
      <Header 
        account={account}
        ethBalance={ethBalance}
        eduBalance={eduBalance}
        network={network}
        connectWallet={connectWallet}
      />

      <Routes>
        <Route path="/" element={
          <MainPage 
            account={account}
            ethBalance={ethBalance}
            eduBalance={eduBalance}
            provider={provider}
            signer={signer}
            network={network}
            hasClaimed={hasClaimed}
            canClaimTokens={canClaimTokens}
            setEduBalance={setEduBalance}
            setEthBalance={setEthBalance}
            setHasClaimed={setHasClaimed}
            setCanClaimTokens={setCanClaimTokens}
          />
        } />
        <Route path="/marketplace" element={<Marketplace/>} />
        <Route path="/exchange" element={<FileExchange/>} />
      </Routes>
    </Router>
  );
}

export default App;