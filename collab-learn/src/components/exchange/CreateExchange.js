import React, { useState } from 'react';
import { ethers } from 'ethers';
import crypto from 'crypto-js';

const CreateExchange = ({ contract, onCreate, showNotification }) => {
  const [formData, setFormData] = useState({
    contentLink: '',
    description: '',
    requirement: '',
    stake: ''
  });
  const [loading, setLoading] = useState(false);
  const [secretKey] = useState('2023d35c9a72bd3af1450859417805315f1ab8c706c60021eb7876ce36144af4'); 
  
  const encryptData = (data) => {
    const encrypt = crypto.AES.encrypt(data, secretKey).toString();
    return encodeURIComponent(encrypt);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.contentLink || !formData.description || !formData.requirement || !formData.stake) {
      alert('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const encryptedContentLink = encryptData(formData.contentLink);
      await onCreate(
        encryptedContentLink,
        formData.description,
        formData.requirement,
        ethers.parseUnits(formData.stake, 18)
      );
      setFormData({ contentLink: '', description: '', requirement: '', stake: '' });
    } catch (error) {
      console.error("Error creating exchange:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center">
      <form onSubmit={handleSubmit} className="w-full max-w-xl bg-white p-8 rounded-lg shadow-md border">
        <h2 className="text-2xl font-bold mb-6 text-center">Create New Exchange</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-2">Content Link*</label>
            <input
              required
              value={formData.contentLink}
              onChange={e => setFormData({...formData, contentLink: e.target.value})}
              className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your content link"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Description*</label>
            <textarea
              required
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows="3"
              placeholder="Describe your content"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Requirements*</label>
            <input
              required
              value={formData.requirement}
              onChange={e => setFormData({...formData, requirement: e.target.value})}
              className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="What are you looking for?"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Stake Amount (EDU)*</label>
            <input
              type="number"
              required
              value={formData.stake}
              onChange={e => setFormData({...formData, stake: e.target.value})}
              className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter stake amount"
              disabled={loading}
            />
          </div>
          <button 
            type="submit" 
            className={`w-full bg-blue-600 text-white px-4 py-3 rounded transition-colors flex items-center justify-center ${
              loading || !formData.contentLink || !formData.description || !formData.requirement || !formData.stake 
                ? 'opacity-70 cursor-not-allowed' 
                : 'hover:bg-blue-700'
            }`}
            disabled={loading || !formData.contentLink || !formData.description || !formData.requirement || !formData.stake}
          >
            {loading ? (
              <>
                <span className="animate-spin inline-block h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                Creating Exchange...
              </>
            ) : 'Create Exchange'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateExchange;