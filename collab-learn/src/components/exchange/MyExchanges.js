import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import crypto from 'crypto-js';

const MyExchanges = ({ contract, account, onAccept, onDecline, onRate, onClaimExpired }) => {
  const [myExchanges, setMyExchanges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [decryptedContents, setDecryptedContents] = useState({});
  const [secretKey] = useState('2023d35c9a72bd3af1450859417805315f1ab8c706c60021eb7876ce36144af4'); 

  const decryptContent = (encryptedContent) => {
    if (!encryptedContent) return null;
    try {
      const decodedContent = decodeURIComponent(encryptedContent);
      const bytes = crypto.AES.decrypt(decodedContent, secretKey);
      const data = bytes.toString(crypto.enc.Utf8);
      return data;
    } catch (error) {
      console.error("Decryption error:", error);
      return "Could not decrypt content";
    }
  };


  const loadContent = async (exchangeId) => {
    try {
      const [initiatorContent, counterpartyContent] = await contract.getExchangeContent(exchangeId);


      setDecryptedContents(prev => ({
        ...prev,
        [exchangeId]: {
          initiator: decryptContent(initiatorContent),
          counterparty: decryptContent(counterpartyContent)
        }
      }));

    } catch (error) {
      console.error("Error loading content:", error);
    }
  };

  const handleClaimAfterDeadline = async (exchangeId) => {
    setActionLoading(prev => ({ ...prev, [exchangeId]: true }));
    try {
      const tx = await contract.claimAfterRatingDeadline(exchangeId);
      await tx.wait();
      await loadMyExchanges();
    } catch (error) {
      console.error("Error claiming after deadline:", error);
    } finally {
      setActionLoading(prev => ({ ...prev, [exchangeId]: false }));
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
        counterparty: summary.participants[1],
        stake: ethers.formatUnits(summary.numbers[0], 18),
        status: ['Pending', 'Matched', 'Accepted', 'Completed', 'Expired'][Number(summary.status)],
        requirement: summary.requirement,
        initiatorDesc: details.descriptions[0],
        counterpartyDesc: details.descriptions[1],
        ratings: details.ratings,
        ratingDeadline: Number(details.ratingDeadline),
        deadline: Number(summary.numbers[2])
      };
    } catch (error) {
      console.error(`Error loading exchange ${exchangeId}:`, error);
      return null;
    }
  };

  const loadMyExchanges = async () => {
    setLoading(true);
    try {
      const userIds = await contract.getUserExchanges(account);
      const exchanges = await Promise.all(
        userIds.map(id => getExchangeData(contract, id))
      );
      setMyExchanges(exchanges.filter(e => e));

      // Load content for Accepted and Completed exchanges
      for (const ex of exchanges) {
        if (ex && (ex.status === 'Accepted' || ex.status === 'Completed')) {
          await loadContent(ex.id);
        }
      }
    } catch (error) {
      console.error("Error loading my exchanges:", error);
    }
    setLoading(false);
  };

  const handleAccept = async (exchangeId) => {
    setActionLoading(prev => ({ ...prev, [exchangeId]: true }));
    try {
      await onAccept(exchangeId);
      await loadContent(exchangeId);
      await loadMyExchanges();
    } catch (error) {
      console.error("Error accepting exchange:", error);
    } finally {
      setActionLoading(prev => ({ ...prev, [exchangeId]: false }));
    }
  };

  const handleDecline = async (exchangeId) => {
    setActionLoading(prev => ({ ...prev, [exchangeId]: true }));
    try {
      await onDecline(exchangeId);
      await loadMyExchanges();
    } catch (error) {
      console.error("Error declining exchange:", error);
    } finally {
      setActionLoading(prev => ({ ...prev, [exchangeId]: false }));
    }
  };

  const handleRate = async (exchangeId, rating) => {
    setActionLoading(prev => ({ ...prev, [exchangeId]: true }));
    try {
      await onRate(exchangeId, rating);
      await loadMyExchanges();
    } catch (error) {
      console.error("Error rating exchange:", error);
    } finally {
      setActionLoading(prev => ({ ...prev, [exchangeId]: false }));
    }
  };

  const handleClaimExpired = async (exchangeId) => {
    setActionLoading(prev => ({ ...prev, [exchangeId]: true }));
    try {
      await onClaimExpired(exchangeId);
      await loadMyExchanges();
    } catch (error) {
      console.error("Error claiming expired exchange:", error);
    } finally {
      setActionLoading(prev => ({ ...prev, [exchangeId]: false }));
    }
  };

  useEffect(() => {
    if (contract && account) {
      loadMyExchanges();
    }
  }, [contract, account]);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">My Exchanges</h2>
      {loading && <div className="text-center p-4">Loading exchanges...</div>}
      
      {myExchanges.length === 0 && !loading && (
        <div className="text-center p-4">You don't have any exchanges yet</div>
      )}

      {myExchanges.map(ex => (
        <div key={ex.id} className="border p-4 rounded-lg shadow-sm">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">{ex.initiatorDesc}</h3>
                  <p className="text-gray-600">Status: <span className="font-medium capitalize">{ex.status.toLowerCase()}</span></p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-blue-600">{ex.stake} EDU</p>
                  {ex.status === 'Pending' && (
                    <p className="text-sm text-gray-500">
                      Expires: {new Date(ex.deadline * 1000).toLocaleDateString()}
                    </p>
                  )}
                  {ex.status === 'Accepted' && (
                    <p className="text-sm text-gray-500">
                      Rate by: {new Date(ex.ratingDeadline * 1000).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              {ex.requirement && (
                <div className="mt-2">
                  <p className="font-medium">Requirements:</p>
                  <p className="text-gray-700">{ex.requirement}</p>
                </div>
              )}

              {/* Show decrypted content for Accepted or Completed exchanges */}
              {(ex.status === 'Accepted' || ex.status === 'Completed') && (
                <>
                  {decryptedContents[ex.id]?.initiator && (
                    <div className="mt-2">
                      <p className="font-medium">Your Content:</p>
                      <a 
                        href={decryptedContents[ex.id].initiator} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline break-all"
                      >
                        {decryptedContents[ex.id].initiator}
                      </a>
                    </div>
                  )}
                  
                  {decryptedContents[ex.id]?.counterparty && (
                    <div className="mt-2">
                      <p className="font-medium">Counterparty Content:</p>
                      <a 
                        href={decryptedContents[ex.id].counterparty} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline break-all"
                      >
                        {decryptedContents[ex.id].counterparty}
                      </a>
                    </div>
                  )}
                </>
              )}

              {ex.counterpartyDesc && (
                <div className="mt-2">
                  <p className="font-medium">Counterparty Offer:</p>
                  <p className="text-gray-700">{ex.counterpartyDesc}</p>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="ml-4 flex flex-col gap-2">
              {ex.status === 'Matched' && (account.toLowerCase() === ex.initiator.toLowerCase()) && (
                <>
                  <button
                    onClick={() => handleAccept(ex.id)}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                    disabled={actionLoading[ex.id]}
                  >
                    {actionLoading[ex.id] ? 'Processing...' : 'Accept'}
                  </button>
                  <button
                    onClick={() => handleDecline(ex.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                    disabled={actionLoading[ex.id]}
                  >
                    {actionLoading[ex.id] ? 'Processing...' : 'Decline'}
                  </button>
                </>
              )}

              {ex.status === 'Pending' && Date.now()/1000 > ex.deadline && (
                <button
                  onClick={() => handleClaimExpired(ex.id)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm"
                  disabled={actionLoading[ex.id]}
                >
                  Claim Expired
                </button>
              )}

              {(ex.status === 'Accepted' || ex.status === 'Completed') && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Rate Your Counterparty:</p>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(n => (
                      <button
                        key={n}
                        onClick={() => handleRate(ex.id, n)}
                        className={`text-xl ${ex.ratings[(account.toLowerCase() === ex.initiator.toLowerCase()) ? 0 : 1] >= n ? 'text-yellow-400' : 'text-gray-300'}`}
                        disabled={actionLoading[ex.id]}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {(ex.status === 'Accepted' && 
                Date.now()/1000 > ex.ratingDeadline && 
                (ex.ratings[0] === 0 || ex.ratings[1] === 0)) && (
                <button
                  onClick={() => handleClaimAfterDeadline(ex.id)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm"
                  disabled={actionLoading[ex.id]}
                >
                  {actionLoading[ex.id] ? 'Processing...' : 'Claim Stake'}
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MyExchanges;