import React, { useState, useEffect } from 'react';
import { BrowserProvider, ethers } from 'ethers';
import { collabLearnABI, collabLearnAddress } from '../utils/contract';

function Marketplace() {
  const [account, setAccount] = useState('');
  const [eduBalance, setEduBalance] = useState('0');
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [resources, setResources] = useState([]);
  const [purchasedResources, setPurchasedResources] = useState([]);
  const [myResources, setMyResources] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // New resource form
  const [newResource, setNewResource] = useState({
    price: '',
    title: '',
    description: '',
    link: ''
  });
  
  // Active tab state
  const [activeTab, setActiveTab] = useState('marketplace');
  
  // Initialize connection
  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        try {
          const provider = new BrowserProvider(window.ethereum);
          setProvider(provider);
          
          const accounts = await provider.send("eth_requestAccounts", []);
          if (accounts.length > 0) {
            const signer = await provider.getSigner();
            setSigner(signer);
            setAccount(accounts[0]);
            
            const contract = new ethers.Contract(
              collabLearnAddress,
              collabLearnABI,
              signer
            );
            setContract(contract);
            
            await loadData(contract, accounts[0]);
          }
        } catch (error) {
          console.error("Error initializing:", error);
        }
      }
    };
    
    init();
    
    window.ethereum?.on('accountsChanged', (accounts) => {
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        if (contract) loadData(contract, accounts[0]);
      } else {
        setAccount('');
      }
    });
  }, []);
  
  const loadData = async (contract, account) => {
    try {
      setIsLoading(true);
      
      const [balance, activeResources, purchased, myResources] = await Promise.all([
        contract.balanceOf(account),
        contract.getActiveResources(),
        contract.getPurchasedResources(account),
        contract.getSellerResources(account)
      ]);
      
      setEduBalance(ethers.formatUnits(balance, 18));
      setResources(activeResources);
      setPurchasedResources(purchased);
      
      // Get full resource details for my resources
      const myResourceDetails = await Promise.all(
        myResources.map(id => contract.resources(id))
      );
      setMyResources(myResourceDetails);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const listResource = async () => {
    if (!signer || !newResource.price || !newResource.title || !newResource.link) return;
    setIsLoading(true);
    
    try {
      const tx = await contract.listResource(
        ethers.parseUnits(newResource.price, 18),
        newResource.link,
        newResource.title,
        newResource.description
      );
      await tx.wait();
      
      await loadData(contract, account);
      
      // Reset form
      setNewResource({
        price: '',
        title: '',
        description: '',
        link: ''
      });
    } catch (error) {
      console.error("Error listing resource:", error);
      alert(`Error: ${error.reason || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const buyResource = async (resourceId, price, link) => {
    if (!signer) return;
    setIsLoading(true);
    
    try {
      // First approve the contract to spend tokens if needed
      const allowance = await contract.allowance(account, collabLearnAddress);
      const priceInWei = ethers.parseUnits(price.toString(), 18);
      
      if (allowance < priceInWei) {
        const approveTx = await contract.approve(
          collabLearnAddress,
          priceInWei
        );
        await approveTx.wait();
      }
      
      // Then buy the resource with the original link
      const tx = await contract.buyResource(resourceId, link);
      await tx.wait();
      
      await loadData(contract, account);
    } catch (error) {
      console.error("Error buying resource:", error);
      alert(`Error: ${error.reason || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const getPurchasedLink = async (resourceId) => {
    try {
      const link = await contract.getPurchasedLink(resourceId);
      alert(`Your resource link: ${link}`);
      return link;
    } catch (error) {
      console.error("Error getting link:", error);
      alert(`Error: ${error.reason || error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Wallet Info Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-4 md:mb-0">
              <h1 className="text-2xl font-bold text-gray-800">Education Marketplace</h1>
              <p className="text-gray-600">
                {account ? `Connected: ${account.substring(0, 6)}...${account.substring(38)}` : 'Not connected'}
              </p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-lg font-semibold text-blue-800">
                EDU Balance: {eduBalance}
              </p>
            </div>
          </div>
        </div>
        
        {/* Tabs Navigation */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            className={`py-2 px-4 font-medium ${activeTab === 'marketplace' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('marketplace')}
          >
            Marketplace
          </button>
          <button
            className={`py-2 px-4 font-medium ${activeTab === 'my-purchases' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('my-purchases')}
          >
            My Purchases
          </button>
          <button
            className={`py-2 px-4 font-medium ${activeTab === 'my-resources' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('my-resources')}
          >
            My Resources
          </button>
        </div>
        
        {/* Marketplace Tab */}
        {activeTab === 'marketplace' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* List New Resource Form */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Sell Your Resource</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={newResource.title}
                    onChange={(e) => setNewResource({...newResource, title: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                    placeholder="e.g., Calculus 101 Notes"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newResource.description}
                    onChange={(e) => setNewResource({...newResource, description: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                    placeholder="Describe your resource..."
                    rows="3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (EDU)
                  </label>
                  <input
                    type="number"
                    value={newResource.price}
                    onChange={(e) => setNewResource({...newResource, price: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                    placeholder="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Resource Link (Zoom, Google Drive, etc.)
                  </label>
                  <input
                    type="text"
                    value={newResource.link}
                    onChange={(e) => setNewResource({...newResource, link: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                    placeholder="https://..."
                  />
                </div>
                <button
                  onClick={listResource}
                  disabled={isLoading || !newResource.price || !newResource.title || !newResource.link}
                  className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Processing...' : 'List Resource'}
                </button>
              </div>
            </div>

            {/* Marketplace Listings */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Available Resources</h2>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : resources.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {resources.map((resource) => (
                      <div key={resource.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <h3 className="font-medium text-lg">{resource.title}</h3>
                        <p className="text-sm text-gray-500 mt-1 truncate">
                          {resource.description}
                        </p>
                        <div className="mt-3 flex justify-between items-center">
                          <div>
                            <p className="text-lg font-bold">
                              {ethers.formatUnits(resource.price, 18)} EDU
                            </p>
                            <p className="text-sm text-gray-500">
                              {resource.totalSales} sales
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            {/*<input
                              type="text"
                              id={`link-${resource.id}`}
                              placeholder="Enter link to purchase"
                              className="p-1 border rounded text-sm w-32"
                            />*/}
                            <button
                              onClick={() => {
                                const link = document.getElementById(`link-${resource.id}`).value;
                                buyResource(resource.id, resource.price, link);
                              }}
                              disabled={isLoading || resource.seller === account}
                              className={`py-1 px-3 rounded ${
                                resource.seller === account 
                                  ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                  : 'bg-blue-600 hover:bg-blue-700 text-white'
                              }`}
                            >
                              Buy
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 py-8 text-center">No resources available</p>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* My Purchases Tab */}
        {activeTab === 'my-purchases' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">My Purchased Resources</h2>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : purchasedResources.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {purchasedResources.map((resource) => (
                  <div key={resource.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h3 className="font-medium text-lg">{resource.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Purchased on: {new Date(resource.purchasedAt * 1000).toLocaleDateString()}
                    </p>
                    <div className="mt-3">
                      <button
                        onClick={() => getPurchasedLink(resource.id)}
                        className="text-blue-600 hover:underline"
                      >
                        Get Resource Link
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 py-8 text-center">You haven't purchased any resources yet</p>
            )}
          </div>
        )}
        
        {/* My Resources Tab */}
        {activeTab === 'my-resources' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">My Listed Resources</h2>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : myResources.length > 0 ? (
              <div className="space-y-4">
                {myResources.map((resource) => (
                  <div key={resource.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-lg">{resource.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {resource.description}
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                          {/*Listed on: {new Date(resource.createdAt * 1000).toLocaleDateString()}*/}
                        </p>
                        <p className="text-sm text-gray-500">
                          Total sales: {resource.totalSales}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">
                          {ethers.formatUnits(resource.price, 18)} EDU
                        </p>
                        <p className={`text-sm ${resource.isActive ? 'text-green-600' : 'text-red-600'}`}>
                          {resource.isActive ? 'Active' : 'Inactive'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 py-8 text-center">You haven't listed any resources yet</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Marketplace;