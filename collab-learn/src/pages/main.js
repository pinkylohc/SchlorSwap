import { ethers } from 'ethers';
import { collabLearnABI, collabLearnAddress } from '../utils/contract';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

function MainPage({ 
  account, 
  ethBalance, 
  eduBalance, 
  provider, 
  signer, 
  network,
  hasClaimed,
  canClaimTokens,
  setEduBalance,
  setEthBalance,
  setHasClaimed,
  setCanClaimTokens
}) {
  const [buyAmount, setBuyAmount] = useState('0.01');
  const [isLoading, setIsLoading] = useState(false);
  const [claimStatus, setClaimStatus] = useState('');
  const navigate = useNavigate();

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
      
      const tx = await contract.claimInitialTokens();
      setClaimStatus('Transaction sent. Waiting for confirmation...');
      
      await tx.wait();
      
      setHasClaimed(true);
      setCanClaimTokens(false);
      setClaimStatus('Success! You claimed your EDU tokens');
      
      const balance = await contract.balanceOf(account);
      setEduBalance(ethers.formatUnits(balance, 18));
    } catch (error) {
      console.error("Error claiming tokens:", error);
      
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
      
      const ethBal = await provider.getBalance(account);
      setEthBalance(ethers.formatEther(ethBal).substring(0, 6));
    } catch (error) {
      console.error("Error buying tokens:", error);
      alert(`Error buying tokens: ${error.message}`);
    }
    setIsLoading(false);
  };

  const features = [
    { 
      title: "Resource Marketplace", 
      description: "Buy and sell educational materials", 
      path: "/marketplace",
      icon: "📚",
      bgColor: "bg-blue-100",
      textColor: "text-blue-800"
    },
    { 
      title: "Knowledge Exchange", 
      description: "Trade resources with other learners", 
      path: "/exchange",
      icon: "🔄",
      bgColor: "bg-purple-100",
      textColor: "text-purple-800"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">ScholarSwap</h1>
          <p className="text-xl text-gray-600 mx-auto">
            A decentralized platform for trading educational resources using blockchain technology
          </p>
        </div>
        
        {/* Network Warning */}
        {network && network.chainId !== 17000n && (
          <div className="mb-8 p-4 bg-orange-100 text-orange-700 rounded-lg border border-orange-200 max-w-2xl mx-auto">
            ⚠️ You're not on Holesky Testnet! Please switch to Holesky to use this application.
          </div>
        )}
        
        {/* Balance Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-12 max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Your Wallet</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Account Info */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <p className="font-medium text-gray-700">
                  {account ? `${account.substring(0, 6)}...${account.substring(account.length - 4)}` : 'Not connected'}
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">ETH Balance:</span>
                  <span className="font-medium">{ethBalance} ETH</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">EDU Tokens:</span>
                  <span className="font-medium">{eduBalance} EDU</span>
                </div>
              </div>
            </div>
            
            {/* Token Actions */}
            <div className="space-y-6">
              <div className="space-y-2">
                <button
                  onClick={claimTokens}
                  disabled={hasClaimed || isLoading || !account || !canClaimTokens}
                  className={`w-full py-3 px-4 rounded-lg flex items-center justify-center ${
                    hasClaimed || !canClaimTokens || !account
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  } transition-colors`}
                >
                  {hasClaimed 
                    ? '🎁 Tokens Claimed' 
                    : isLoading 
                      ? '⏳ Processing...' 
                      : '🎁 Claim 10 Free EDU (For First Time Access)'}
                </button>
                
                {claimStatus && (
                  <p className={`text-sm text-center ${
                    claimStatus.includes('Success') 
                      ? 'text-green-600'
                      : claimStatus.includes('Error') || claimStatus.includes('Cannot')
                        ? 'text-red-600'
                        : 'text-gray-600'
                  }`}>
                    {claimStatus}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center bg-gray-100 rounded-lg overflow-hidden">
                  <input
                    type="number"
                    value={buyAmount}
                    onChange={(e) => setBuyAmount(e.target.value)}
                    min="0.01"
                    step="0.01"
                    className="flex-1 p-3 bg-transparent outline-none"
                    placeholder="ETH amount"
                  />
                  <span className="px-3 text-gray-500">ETH</span>
                </div>
                <button
                  onClick={buyTokens}
                  disabled={isLoading || !account}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center"
                >
                  {isLoading ? '⏳ Processing...' : '💳 Buy EDU Tokens'}
                </button>
                <p className="text-xs text-center text-gray-500">
                  0.001 ETH = 1 EDU 
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Features Gallery */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Platform Features</h2>
          {!account && (
          <div className="flex items-center justify-center mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <span className="font-medium">Wallet not connected!</span> Please connect your wallet to access these features.
              </p>
            </div>
          </div>
        )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index}
                className={`${feature.bgColor} p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-all cursor-pointer transform hover:-translate-y-1`}
                onClick={() => navigate(feature.path)}
              >
                <div className="flex items-start space-x-4">
                  <span className="text-3xl">{feature.icon}</span>
                  <div>
                    <h3 className={`${feature.textColor} font-bold text-lg mb-1`}>{feature.title}</h3>
                    <p className="text-gray-700">{feature.description}</p>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <span className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors">
                    Explore →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainPage;