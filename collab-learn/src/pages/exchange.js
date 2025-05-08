import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { collabLearnABI, collabLearnAddress } from '../utils/contract';
import ActiveExchanges from '../components/exchange/ActiveExchanges';
import CreateExchange from '../components/exchange/CreateExchange';
import MyExchanges from '../components/exchange/MyExchanges';

const Exchange = () => {
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [view, setView] = useState('browse');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  const showNotification = (message, type = 'info') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
  };

  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        try {
          setLoading(true);
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const contract = new ethers.Contract(collabLearnAddress, collabLearnABI, signer);
          setContract(contract);
          const accounts = await provider.send("eth_requestAccounts", []);
          setAccount(accounts[0]);
          //showNotification('Wallet connected successfully', 'success');
        } catch (error) {
          console.error("Error initializing contract:", error);
          alert(`Connection error: ${error.message}`);
        } finally {
          setLoading(false);
        }
      }
    };
    init();
  }, []);

  const handleCreateExchange = async (contentLink, description, requirement, stakeAmount) => {
    setLoading(true);
    try {
      const tx = await contract.createExchange(
        contentLink,
        description,
        requirement,
        stakeAmount
      );
      await tx.wait();
      alert('Exchange created successfully!');
    } catch (error) {
      console.error("Error creating exchange:", error);
      alert(`Creation failed: ${error.reason || error.message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleMatchExchange = async (exchangeId, contentLink, description) => {
    setLoading(true);
    try {
      const tx = await contract.matchExchange(
        exchangeId,
        contentLink,
        description
      );
      await tx.wait();
      alert('Exchange matched successfully!');
    } catch (error) {
      console.error("Error matching exchange:", error);
      alert(`Matching failed: ${error.reason || error.message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptExchange = async (exchangeId) => {
    setLoading(true);
    try {
      const tx = await contract.acceptExchange(exchangeId);
      await tx.wait();
      alert('Exchange accepted successfully!');
    } catch (error) {
      console.error("Error accepting exchange:", error);
      alert(`Acceptance failed: ${error.reason || error.message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeclineExchange = async (exchangeId) => {
    setLoading(true);
    try {
      const tx = await contract.declineExchange(exchangeId);
      await tx.wait();
      alert('Exchange declined successfully!');
    } catch (error) {
      console.error("Error declining exchange:", error);
      alert(`Decline failed: ${error.reason || error.message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleRateExchange = async (exchangeId, rating) => {
    setLoading(true);
    try {
      const tx = await contract.rateExchange(exchangeId, rating);
      await tx.wait();
      alert('Rating submitted successfully!');
    } catch (error) {
      console.error("Error rating exchange:", error);
      alert(`Rating failed: ${error.reason || error.message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleClaimExpired = async (exchangeId) => {
    setLoading(true);
    try {
      const tx = await contract.claimExpired(exchangeId);
      await tx.wait();
      alert('Expired exchange claimed successfully!');
    } catch (error) {
      console.error("Error claiming expired exchange:", error);
      alert(`Claim failed: ${error.reason || error.message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 relative">
      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-4 right-4 p-4 rounded-md shadow-lg z-50 ${
          notification.type === 'error' ? 'bg-red-100 text-red-800' : 
          notification.type === 'success' ? 'bg-green-100 text-green-800' : 
          'bg-blue-100 text-blue-800'
        }`}>
          {notification.message}
        </div>
      )}

      {/* Global Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-40">
          <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p>Processing transaction...</p>
          </div>
        </div>
      )}
      <h1 className="text-3xl font-bold mb-1">Resource Exchange</h1>
      <p className="text-gray-700 mb-6 text-lg leading-relaxed">
        Exchange your resources with others in the community.
      </p>
      <div className="flex gap-4 mb-6">
        
        <button 
          onClick={() => setView('browse')} 
          className={`px-4 py-2 rounded transition-colors ${
            view === 'browse' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'
          }`}
          disabled={loading}
        >
          Browse Exchanges
        </button>
        <button 
          onClick={() => setView('create')} 
          className={`px-4 py-2 rounded transition-colors ${
            view === 'create' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'
          }`}
          disabled={loading}
        >
          Create Exchange
        </button>
        <button 
          onClick={() => setView('my')} 
          className={`px-4 py-2 rounded transition-colors ${
            view === 'my' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'
          }`}
          disabled={loading}
        >
          My Exchanges
        </button>
      </div>

      {view === 'browse' && (
        <ActiveExchanges 
          contract={contract}
          account={account}
          onMatch={handleMatchExchange}
          showNotification={showNotification}
        />
      )}

      {view === 'create' && (
        <CreateExchange 
          contract={contract}
          onCreate={handleCreateExchange}
          showNotification={showNotification}
        />
      )}

      {view === 'my' && (
        <MyExchanges 
          contract={contract}
          account={account}
          onAccept={handleAcceptExchange}
          onDecline={handleDeclineExchange}
          onRate={handleRateExchange}
          onClaimExpired={handleClaimExpired}
          showNotification={showNotification}
        />
      )}
    </div>
  );
};

export default Exchange;