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

  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(collabLearnAddress, collabLearnABI, signer);
        setContract(contract);
        const accounts = await provider.send("eth_requestAccounts", []);
        setAccount(accounts[0]);
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
    } catch (error) {
      console.error("Error creating exchange:", error);
      throw error;
    }
    setLoading(false);
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
    } catch (error) {
      console.error("Error matching exchange:", error);
      throw error;
    }
    setLoading(false);
  };

    const handleAcceptExchange = async (exchangeId) => {
        setLoading(true);
        try {
        const tx = await contract.acceptExchange(exchangeId);
        await tx.wait();
        // No need to refresh here - MyExchanges will handle it
        } catch (error) {
        console.error("Error accepting exchange:", error);
        throw error; // This will be caught in MyExchanges
        } finally {
        setLoading(false);
        }
    };
  
    const handleDeclineExchange = async (exchangeId) => {
        setLoading(true);
        try {
        const tx = await contract.declineExchange(exchangeId);
        await tx.wait();
        // No need to refresh here - MyExchanges will handle it
        } catch (error) {
        console.error("Error declining exchange:", error);
        throw error; // This will be caught in MyExchanges
        } finally {
        setLoading(false);
        }
    };

  const handleRateExchange = async (exchangeId, rating) => {
    setLoading(true);
    try {
      const tx = await contract.rateExchange(exchangeId, rating);
      await tx.wait();
    } catch (error) {
      console.error("Error rating exchange:", error);
      throw error;
    }
    setLoading(false);
  };

  const handleClaimExpired = async (exchangeId) => {
    setLoading(true);
    try {
      const tx = await contract.claimExpired(exchangeId);
      await tx.wait();
    } catch (error) {
      console.error("Error claiming expired exchange:", error);
      throw error;
    }
    setLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex gap-4 mb-6">
        <button 
          onClick={() => setView('browse')} 
          className={`px-4 py-2 ${view === 'browse' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Browse Exchanges
        </button>
        <button 
          onClick={() => setView('create')} 
          className={`px-4 py-2 ${view === 'create' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Create Exchange
        </button>
        <button 
          onClick={() => setView('my')} 
          className={`px-4 py-2 ${view === 'my' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          My Exchanges
        </button>
      </div>

      {loading && <div className="text-center p-4">Loading...</div>}

      {view === 'browse' && (
        <ActiveExchanges 
          contract={contract}
          account={account}
          onMatch={handleMatchExchange}
        />
      )}

      {view === 'create' && (
        <CreateExchange 
          contract={contract}
          onCreate={handleCreateExchange}
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
        />
      )}
    </div>
  );
};

export default Exchange;