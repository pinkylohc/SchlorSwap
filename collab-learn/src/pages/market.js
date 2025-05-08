import { ethers } from 'ethers';
import { useState, useEffect } from 'react';
import { collabLearnABI, collabLearnAddress } from '../utils/contract';
import crypto from 'crypto-js';

function Marketplace({ account, updateBalances }) {
  const [listings, setListings] = useState([]);
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState({
    page: false,
    purchase: null,
    create: false
  });
  const [view, setView] = useState('browse');
  const [newListing, setNewListing] = useState({
    contentLink: '',
    description: '',
    price: ''
  });
  const [secretKey] = useState('2023d35c9a72bd3af1450859417805315f1ab8c706c60021eb7876ce36144af4');
  const [purchaseConfirmation, setPurchaseConfirmation] = useState({
    show: false,
    description: '',
    contentLink: ''
  });
  const [copied, setCopied] = useState(false);

  const encryptData = (data) => {
    const encrypt = crypto.AES.encrypt(data, secretKey).toString();
    return encodeURIComponent(encrypt);
  };

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

  const copyToClipboard = () => {
    navigator.clipboard.writeText(purchaseConfirmation.contentLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        try {
          setLoading(prev => ({...prev, page: true}));
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const contract = new ethers.Contract(collabLearnAddress, collabLearnABI, signer);
          setContract(contract);
          await loadListings(contract);
        } catch (error) {
          console.error("Error initializing:", error);
        } finally {
          setLoading(prev => ({...prev, page: false}));
        }
      }
    };
    init();
  }, []);

  async function loadListings(contract) {
    try {
      setLoading(prev => ({...prev, page: true}));
      const count = await contract.listingCount();
      const listingPromises = [];
      
      for (let i = 1; i <= count; i++) {
        listingPromises.push(contract.listings(i));
      }
      
      const allListings = await Promise.all(listingPromises);
      setListings(allListings.map((listing, index) => ({
        id: index + 1,
        seller: listing.seller,
        contentLink: listing.contentLink,
        description: listing.description,
        price: ethers.formatUnits(listing.price, 18),
      })));
    } catch (error) {
      console.error("Error loading listings:", error);
    } finally {
      setLoading(prev => ({...prev, page: false}));
    }
  }

  async function handlePurchase(listingId, price) {
    if (!contract || !account) return;
    
    try {
      setLoading(prev => ({...prev, purchase: listingId}));
      const tx = await contract.buyListing(listingId);
      await tx.wait();
      
      const purchasedListing = await contract.listings(listingId);
      const decryptedContent = decryptContent(purchasedListing.contentLink);
      
      setPurchaseConfirmation({
        show: true,
        description: purchasedListing.description,
        contentLink: decryptedContent
      });
      
      // Update both listings and all balances
      await Promise.all([
        loadListings(contract),
        updateBalances()
      ]);
      
    } catch (error) {
      console.error("Purchase failed:", error);
      alert(`Purchase failed: ${error.reason || error.message}`);
    } finally {
      setLoading(prev => ({...prev, purchase: null}));
    }
  }

  async function handleCreateListing() {
    if (!contract || !newListing.contentLink || !newListing.description || !newListing.price) return;
    
    try {
      setLoading(prev => ({...prev, create: true}));
      const encryptedContentLink = encryptData(newListing.contentLink);
      const tx = await contract.createListing(
        encryptedContentLink,
        newListing.description,
        ethers.parseUnits(newListing.price, 18)
      );
      await tx.wait();
      
      setNewListing({ contentLink: '', description: '', price: '' });
      
      await Promise.all([
        loadListings(contract),
        updateBalances()
      ]);
      
      setView('browse');
      alert('Listing created successfully!');
    } catch (error) {
      console.error("Create listing failed:", error);
      alert(`Create failed: ${error.reason || error.message}`);
    } finally {
      setLoading(prev => ({...prev, create: false}));
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-4 relative">
      {/* Full page loading overlay */}
      {loading.page && (
        <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-50">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-700">Loading marketplace...</p>
          </div>
        </div>
      )}

      {/* Purchase Confirmation Modal */}
      {purchaseConfirmation.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="text-left">
              <h3 className="font-bold text-xl mb-3 text-green-600">🎉 Purchase Successful!</h3>
              <p className="mb-4">
                You've purchased: <strong>{purchaseConfirmation.description}</strong>
              </p>
              
              <div className="bg-gray-100 p-3 rounded mb-4">
                <p className="text-sm text-gray-700 mb-2">Your resource link:</p>
                <div className="flex items-center gap-2">
                  <input
                    value={purchaseConfirmation.contentLink}
                    className="flex-1 p-2 border rounded bg-white text-sm"
                    readOnly
                  />
                  <button
                    onClick={copyToClipboard}
                    className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded text-sm"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <p className="text-xs text-red-500 mt-2">
                  ⚠️ Please copy this link now as it won't be shown again!
                </p>
              </div>
              
              <button
                onClick={() => setPurchaseConfirmation({ show: false, description: '', contentLink: '' })}
                className="w-full bg-gray-200 hover:bg-gray-300 py-2 px-4 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <h1 className="text-3xl font-bold mb-1">Educational Resources Marketplace</h1>
      <p className="text-gray-700 mb-6 text-lg leading-relaxed">
        Buy and sell notes, study materials, tutorial class, and other educational resources as file links or meeting links here.      
      </p>
      
      <div className="flex gap-4 mb-6">
        <button 
          onClick={() => setView('browse')} 
          className={`px-4 py-2 rounded ${view === 'browse' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          disabled={loading.page}
        >
          Browse Listings
        </button>
        <button 
          onClick={() => setView('create')} 
          className={`px-4 py-2 rounded ${view === 'create' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          disabled={loading.page}
        >
          Create Listing
        </button>
      </div>

      {view === 'browse' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map(listing => (
            <div key={listing.id} className="border rounded-lg p-4 shadow-sm relative">
              {loading.purchase === listing.id && (
                <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center rounded-lg">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              )}
              
              <h3 className="font-semibold text-lg mb-2">{listing.description}</h3>
              <p className="text-gray-600 mb-3">Price: {listing.price} EDU</p>
              
              {account && account.toLowerCase() !== listing.seller.toLowerCase() ? (
                <button
                  onClick={() => handlePurchase(listing.id, listing.price)}
                  disabled={!!loading.purchase || loading.page}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-blue-300 flex items-center justify-center"
                >
                  {loading.purchase === listing.id ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    'Purchase'
                  )}
                </button>
              ) : (
                <div className="text-center py-2 text-gray-800 border-2 bg-gray-300 rounded">
                  {account && account.toLowerCase() === listing.seller.toLowerCase() 
                    ? 'Your listing' 
                    : 'Please connect wallet'}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {view === 'create' && (
        <div className="max-w-md mx-auto border rounded-lg p-6 shadow-sm relative">
          {loading.create && (
            <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center rounded-lg">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
            </div>
          )}
          
          <h2 className="text-xl font-semibold mb-4">Create New Listing</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Resource Link</label>
              <input
                type="text"
                value={newListing.contentLink}
                onChange={(e) => setNewListing({...newListing, contentLink: e.target.value})}
                className="w-full px-3 py-2 border rounded"
                placeholder="File URL or zoom link"
                disabled={loading.create}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={newListing.description}
                onChange={(e) => setNewListing({...newListing, description: e.target.value})}
                className="w-full px-3 py-2 border rounded"
                rows="3"
                placeholder="Describe your resource..."
                disabled={loading.create}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Price (EDU)</label>
              <input
                type="number"
                value={newListing.price}
                onChange={(e) => setNewListing({...newListing, price: e.target.value})}
                className="w-full px-3 py-2 border rounded"
                placeholder="10"
                min="1"
                disabled={loading.create}
              />
            </div>
            
            <button
              onClick={handleCreateListing}
              disabled={loading.create || loading.page}
              className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:bg-green-300 flex items-center justify-center"
            >
              {loading.create ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </span>
              ) : (
                'Create Listing'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
export default Marketplace;