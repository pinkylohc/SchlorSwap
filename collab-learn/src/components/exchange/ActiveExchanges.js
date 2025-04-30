import React, { useState } from 'react';
import { ethers } from 'ethers';
import crypto from 'crypto-js'; // Add this package for encryption


const ActiveExchanges = ({ contract, account, onMatch }) => {
  const [activeExchanges, setActiveExchanges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [matchData, setMatchData] = useState({ exchangeId: '', contentLink: '', description: '' });
  const [secretKey] = useState('2023d35c9a72bd3af1450859417805315f1ab8c706c60021eb7876ce36144af4'); 

  const encryptData = (data) => {
    const encrypt = crypto.AES.encrypt(data, secretKey).toString();
    return encodeURIComponent(encrypt);
  }

  const loadActiveExchanges = async () => {
    if(!contract) return;
    setLoading(true);
    try {
      const activeIds = await contract.getActiveExchanges();
      if(!activeIds == null) { setActiveExchanges([]); return; }
      const exchanges = await Promise.all(
        activeIds.map(id => getExchangeData(contract, id))
      );
      setActiveExchanges(exchanges.filter(e => e));
    } catch (error) {
      console.error("Error loading active exchanges:", error);
    }
    setLoading(false);
  };

  const getExchangeData = async (contract, exchangeId) => {
    try {
      const [summary, details] = await Promise.all([
        contract.getExchangeSummary(exchangeId),
        contract.getExchangeDetails(exchangeId)
      ]);

      return {
        id: exchangeId,
        initiator: summary.participants[0],
        stake: ethers.formatUnits(summary.numbers[0], 18),
        requirement: summary.requirement,
        initiatorDesc: details.descriptions[0],
        deadline: Number(summary.numbers[2])
      };
    } catch (error) {
      console.error(`Error loading exchange ${exchangeId}:`, error);
      return null;
    }
  };

  const handleMatch = async (exchangeId) => {
    try {
      const encryptedMatchLink = encryptData(matchData.contentLink);
      await onMatch(exchangeId, encryptedMatchLink, matchData.description);
      setMatchData({ exchangeId: '', contentLink: '', description: '' });
      loadActiveExchanges();
    } catch (error) {
      console.error("Error matching exchange:", error);
    }
  };

  React.useEffect(() => {
    loadActiveExchanges();
  }, [contract]);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">Active Exchanges</h2>
      {loading && <div className="text-center p-4">Loading...</div>}
      
      {activeExchanges.map(ex => (
        <div key={ex.id} className="border p-4 rounded-lg">
          <h3 className="font-bold">{ex.initiatorDesc}</h3>
          <p className="text-gray-600">Requires: {ex.requirement}</p>
          <p>Stake: {ex.stake} EDU</p>
          
          <div className="mt-2">
            <input
              type="text"
              placeholder="Your content link"
              className="border p-2 w-full mb-2"
              value={matchData.exchangeId === ex.id ? matchData.contentLink : ''}
              onChange={e => setMatchData({...matchData, exchangeId: ex.id, contentLink: e.target.value})}
            />
            <textarea
              placeholder="Your description"
              className="border p-2 w-full mb-2"
              value={matchData.exchangeId === ex.id ? matchData.description : ''}
              onChange={e => setMatchData({...matchData, exchangeId: ex.id, description: e.target.value})}
            />
            <button
              onClick={() => handleMatch(ex.id)}
              className="bg-green-600 text-white px-4 py-2 rounded"
              disabled={!matchData.contentLink || !matchData.description}
            >
              Match Exchange
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ActiveExchanges; 