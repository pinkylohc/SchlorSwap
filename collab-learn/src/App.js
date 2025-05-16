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
  const [canClaimTokens, setCanClaimTokens] = useState(true);

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
      
      try {
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
      } catch (contractError) {
        console.log("Contract not deployed or not accessible:", contractError);
        setEduBalance('0');
        setHasClaimed(false);
      }

    } catch (error) {
      console.error("Wallet connection error:", error);
      alert(`Error connecting wallet: ${error.message}`);
    }
  };


  const updateBalances = async () => {
    if (!provider || !account) return;
    
    try {
      // Update ETH balance
      const ethBal = await provider.getBalance(account);
      setEthBalance(ethers.formatEther(ethBal).substring(0, 6));
      
      // Update EDU balance
      const contract = new ethers.Contract(
        collabLearnAddress,
        collabLearnABI,
        signer
      );
      const eduBal = await contract.balanceOf(account);
      setEduBalance(ethers.formatUnits(eduBal, 18));
    } catch (error) {
      console.error("Error updating balances:", error);
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

  useEffect(() => {
    if (!provider || !account) return;
  
    // Set up an interval to update balances every second
    const interval = setInterval(() => {
      updateBalances();
    }, 1000); // 1000ms = 1 second
  
    // Clear the interval when the component unmounts or dependencies change
    return () => clearInterval(interval);
  }, [provider, account]); 

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
        <Route 
          path="/marketplace" 
          element={
            <Marketplace
              account={account}
              updateBalances={updateBalances}
            />
          } 
        />

        <Route path="/exchange" element={<FileExchange/>} />
      </Routes>
    </Router>
  );
}

export default App;