import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import crypto from 'crypto-js';

const ActiveExchanges = ({ contract, account, onMatch, showNotification }) => {
  const [activeExchanges, setActiveExchanges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [matchData, setMatchData] = useState({ exchangeId: '', contentLink: '', description: '' });
  const [actionLoading, setActionLoading] = useState(false);
  const [secretKey] = useState('2023d35c9a72bd3af1450859417805315f1ab8c706c60021eb7876ce36144af4');
  const [commitments, setCommitments] = useState({});

  const encryptData = (data) => {
    const encrypt = crypto.AES.encrypt(data, secretKey).toString();
    return encodeURIComponent(encrypt);
  }

  const generateSecret = () => {
    return ethers.hexlify(ethers.randomBytes(32));
  };

  const loadActiveExchanges = async () => {
    if(!contract) return;
    setLoading(true);
    try {
      const activeIds = await contract.getActiveExchanges();
      if(!activeIds) { 
        setActiveExchanges([]); 
        return; 
      }
      
      const exchanges = await Promise.all(
        activeIds.map(id => getExchangeData(contract, id))
      );
      setActiveExchanges(exchanges.filter(e => e));
    } catch (error) {
      console.error("Error loading active exchanges:", error);
      alert('Failed to load exchanges', 'error');
    } finally {
      setLoading(false);
    }
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
      };
    } catch (error) {
      console.error(`Error loading exchange ${exchangeId}:`, error);
      return null;
    }
  };

  const handleCommitToMatch = async (exchangeId) => {
    if (!matchData.contentLink || !matchData.description) {
      alert('Please fill in all fields', 'error');
      return;
    }

    setActionLoading(true);
    try {
      const secret = generateSecret();
      const encryptedContentLink = encryptData(matchData.contentLink);
      
      // Ensure we're using the checksum address
      const checksumAddress = ethers.getAddress(account);
      
      // Create commitment hash using abi.encodePacked
      const commitment = ethers.keccak256(
        ethers.solidityPacked(
          ['uint256', 'address', 'bytes32'],
          [
            exchangeId,
            checksumAddress,
            secret
          ]
        )
      );

      const tx = await contract.commitToMatchExchange(commitment);
      await tx.wait();

      setCommitments(prev => ({
        ...prev,
        [exchangeId]: { 
          secret,
          contentLink: encryptedContentLink,
          description: matchData.description,
          committed: true
        }
      }));

      alert('Commitment successful! You can now complete the match.', 'success');
    } catch (error) {
      console.error("Error committing to match:", error);
      alert(`Commit failed: ${error.reason || error.message}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevealAndMatch = async (exchangeId) => {
    if (!commitments[exchangeId]) {
      alert('No commitment found for this exchange', 'error');
      return;
    }

    setActionLoading(true);
    try {
      const { secret, contentLink, description } = commitments[exchangeId];
      
      // Use the secret directly as it's already in the correct format from generateSecret()
      const tx = await contract.matchExchange(
        exchangeId,
        contentLink,
        description,
        secret // secret is already in bytes32 format from generateSecret()
      );
      await tx.wait();
      
      // Clear commitment data
      setCommitments(prev => {
        const newState = {...prev};
        delete newState[exchangeId];
        return newState;
      });
      
      setMatchData({ exchangeId: '', contentLink: '', description: '' });
      await loadActiveExchanges();
      alert('Exchange matched successfully!', 'success');
    } catch (error) {
      console.error("Error revealing and matching:", error);
      alert(`Match failed: ${error.reason || error.message}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    loadActiveExchanges();
  }, [contract]);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">Active Exchanges</h2>
      
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : activeExchanges.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No active exchanges available
        </div>
      ) : (
        activeExchanges.map(ex => (
          <div key={ex.id} className="border p-4 rounded-lg shadow-sm">
            <h3 className="font-bold text-lg">{ex.initiatorDesc}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div>
                <p className="text-gray-600"><span className="font-medium">Requires:</span> {ex.requirement}</p>
                <p><span className="font-medium">Stake:</span> {ex.stake} EDU</p>
              </div>
              
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Your content link"
                  className="border p-2 w-full rounded"
                  value={matchData.exchangeId === ex.id ? matchData.contentLink : ''}
                  onChange={e => setMatchData({...matchData, exchangeId: ex.id, contentLink: e.target.value})}
                  disabled={actionLoading || commitments[ex.id]?.committed}
                />
                <textarea
                  placeholder="Your description"
                  className="border p-2 w-full rounded"
                  value={matchData.exchangeId === ex.id ? matchData.description : ''}
                  onChange={e => setMatchData({...matchData, exchangeId: ex.id, description: e.target.value})}
                  disabled={actionLoading || commitments[ex.id]?.committed}
                  rows={3}
                />
                {commitments[ex.id]?.committed ? (
                  <button
                    onClick={() => handleRevealAndMatch(ex.id)}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <span className="flex items-center justify-center">
                        <span className="animate-spin inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                        Processing...
                      </span>
                    ) : 'Complete Match'}
                  </button>
                ) : (
                  <button
                    onClick={() => handleCommitToMatch(ex.id)}
                    className={`w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors ${
                      (!matchData.contentLink || !matchData.description || matchData.exchangeId !== ex.id) ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    disabled={!matchData.contentLink || !matchData.description || matchData.exchangeId !== ex.id || actionLoading}
                  >
                    {actionLoading ? (
                      <span className="flex items-center justify-center">
                        <span className="animate-spin inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                        Processing...
                      </span>
                    ) : 'Commit to Match'}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ActiveExchanges;