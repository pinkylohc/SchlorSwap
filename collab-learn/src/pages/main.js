import React, { useState, useEffect } from 'react';
import { BrowserProvider, ethers } from 'ethers';
import { collabLearnABI, collabLearnAddress } from '../utils/contract';
import { useNavigate } from 'react-router-dom';

function MainPage() {
  const [account, setAccount] = useState('');
  const [eduBalance, setEduBalance] = useState('0');
  const [ethBalance, setEthBalance] = useState('0');
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [hasClaimed, setHasClaimed] = useState(false);
  const [canClaimTokens, setCanClaimTokens] = useState(false);
  const [buyAmount, setBuyAmount] = useState('0.01');
  const [isLoading, setIsLoading] = useState(false);
  const [network, setNetwork] = useState(null);
  const [claimStatus, setClaimStatus] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        const provider = new BrowserProvider(window.ethereum);
        setProvider(provider);
        
        try {
          const accounts = await provider.send("eth_requestAccounts", []);
          if (accounts.length > 0) {
            const signer = await provider.getSigner();
            setSigner(signer);
            setAccount(accounts[0]);
            
            // Get balances
            const ethBal = await provider.getBalance(accounts[0]);
            setEthBalance(ethers.formatEther(ethBal).substring(0, 6));
            
            const contract = new ethers.Contract(
              collabLearnAddress,
              collabLearnABI,
              signer
            );
            
            // Get token balance
            const eduBal = await contract.balanceOf(accounts[0]);
            setEduBalance(ethers.formatUnits(eduBal, 18));
            
            // Check claim status
            const claimedStatus = await contract.hasClaimed(accounts[0]);
            setHasClaimed(claimedStatus);
            
            const canClaim = await contract.canClaim(accounts[0]);
            setCanClaimTokens(canClaim);
            
            if (claimedStatus) {
              setClaimStatus('You have already claimed your initial tokens');
            } else if (!canClaim) {
              setClaimStatus('Cannot claim tokens at this time');
            }
            
            const network = await provider.getNetwork();
            setNetwork(network);
          }
        } catch (error) {
          console.error("Error initializing:", error);
        }
      }
    };
    
    init();
  }, []);

  const claimTokens = async () => {
    if (!signer || !canClaimTokens) return;
    
    setIsLoading(true);
    setClaimStatus('Processing your claim...');
    
    try {
      const contract = new ethers.Contract(
        collabLearnAddress,
        collabLearnABI,
        signer
      );
      
      // Double-check claim status before sending transaction
      const canStillClaim = await contract.canClaim(account);
      if (!canStillClaim) {
        setClaimStatus('Cannot claim tokens at this time');
        setIsLoading(false);
        return;
      }
      
      const tx = await contract.claimInitialTokens();
      setClaimStatus('Transaction sent. Waiting for confirmation...');
      
      await tx.wait();
      
      // Update statuses after successful claim
      setHasClaimed(true);
      setCanClaimTokens(false);
      setClaimStatus('Success! You claimed your EDU tokens');
      
      // Refresh balances
      const balance = await contract.balanceOf(account);
      setEduBalance(ethers.formatUnits(balance, 18));
    } catch (error) {
      console.error("Error claiming tokens:", error);
      
      // Handle specific error cases
      if (error.message.includes("Already claimed initial tokens")) {
        setClaimStatus('You have already claimed your initial tokens');
        setHasClaimed(true);
      } else if (error.message.includes("rejected")) {
        setClaimStatus('Transaction was rejected');
      } else {
        setClaimStatus(`Error: ${error.reason || error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const buyTokens = async () => {
    if (!signer || !buyAmount) return;
    setIsLoading(true);
    try {
      const contract = new ethers.Contract(
        collabLearnAddress,
        collabLearnABI,
        signer
      );
      const tx = await contract.buyTokens({
        value: ethers.parseEther(buyAmount)
      });
      await tx.wait();
      const balance = await contract.balanceOf(account);
      setEduBalance(ethers.formatUnits(balance, 18));
      
      // Update ETH balance
      const ethBal = await provider.getBalance(account);
      setEthBalance(ethers.formatEther(ethBal).substring(0, 6));
    } catch (error) {
      console.error("Error buying tokens:", error);
      alert(`Error buying tokens: ${error.message}`);
    }
    setIsLoading(false);
  };

  const galleryItems = [
    { title: "Course Marketplace", path: "/courses" },
    { title: "Learning Dashboard", path: "/dashboard" },
    { title: "Community Forum", path: "/forum" },
    { title: "Reward Center", path: "/rewards" }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Token Management</h1>
        
        {network && network.chainId !== 11155111n && (
          <div className="mb-6 p-4 bg-orange-100 text-orange-700 rounded-lg">
            ⚠️ You're not on Sepolia Testnet! Please switch to Sepolia to use this application.
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Your Token Balances</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-2">Wallet Information</h3>
              <p className="text-gray-700 mb-1">
                <span className="font-medium">Account:</span> {account ? `${account.substring(0, 6)}...${account.substring(account.length - 4)}` : 'Not connected'}
              </p>
              <p className="text-gray-700 mb-1">
                <span className="font-medium">ETH Balance:</span> {ethBalance}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">EDU Tokens:</span> {eduBalance}
              </p>
            </div>
            
            <div className="space-y-4">
              <button
                onClick={claimTokens}
                disabled={hasClaimed || isLoading || !account || !canClaimTokens}
                className={`w-full py-2 px-4 rounded-lg ${
                  hasClaimed 
                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                    : !canClaimTokens
                      ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                } transition-colors`}
              >
                {hasClaimed 
                  ? 'Already Claimed' 
                  : isLoading 
                    ? 'Processing...' 
                    : 'Claim 100 Free EDU Tokens'}
              </button>
              
              {claimStatus && (
                <p className={`text-sm ${
                  claimStatus.includes('Success') 
                    ? 'text-green-600'
                    : claimStatus.includes('Error') || claimStatus.includes('Cannot')
                      ? 'text-red-600'
                      : 'text-gray-600'
                }`}>
                  {claimStatus}
                </p>
              )}
              
              <div className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={buyAmount}
                    onChange={(e) => setBuyAmount(e.target.value)}
                    min="0.01"
                    step="0.01"
                    className="flex-1 p-2 border rounded-lg"
                    placeholder="ETH amount"
                  />
                  <span className="text-gray-600">ETH</span>
                </div>
                <button
                  onClick={buyTokens}
                  disabled={isLoading || !account}
                  className="py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  {isLoading ? 'Processing...' : 'Buy EDU Tokens'}
                </button>
                <p className="text-sm text-gray-500">
                  Current rate: 0.001 ETH = 1 EDU tokens
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Explore Features</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {galleryItems.map((item, index) => (
              <div 
                key={index}
                className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-lg hover:shadow-md transition-shadow cursor-pointer border border-gray-200"
                onClick={() => navigate(item.path)}
              >
                <h3 className="font-medium text-gray-800">{item.title}</h3>
                <p className="text-sm text-gray-600 mt-2">Click to explore →</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainPage;