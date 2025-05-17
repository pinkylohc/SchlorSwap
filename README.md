# SchlorSwap

CollabLearn is a decentralized application (DApp) built on Ethereum that facilitates educational resource sharing, marketplace transactions through a tokenized system. Users can earn and stake tokens, purchase or exchange various educational resources.

## Folder Structure

-**collab-learn**: The ReactJS frontend code folder
-**SchlorSwap.sol**: The smart contract code

## run the frontend code
```bash
   cd collab-learn
   npm install
   npm start
```

## Features

- **EduToken**: An ERC20 token used for transactions within the platform.
- **Token Purchase**: Users can buy EduTokens with Ether.
- **Initial Token Claim**: New users can claim free initial tokens.
- **Marketplace**: Users can list and buy educational resources.
- **Resource Exchange**: Users can exchange their educational resources with other.



## Smart Contract Overview

The core functionality of CollabLearn is implemented in the `SchlorSwap` smart contract, which includes:

- **Token Management**: Functions for minting, transferring, and approving tokens.
- **Resource Listing**: Users can list educational resources for sale.
- **Marketplace Transactions**: Functions to buy and sell resources.


## React.js Frontend

The frontend is built using React.js and allows users to interact with the CollabLearn smart contract. Key components include:

- **Token Purchase Form**: Interface for buying EduTokens.
- **MarketPlace**: UI for users to buy or sell resources.
- **Exchange Page**: Interface for exchange resource with other user

### Getting Started

1. **Clone the Repository**:
   ```bash
   https://github.com/pinkylohc/SchlorSwap.git
   cd collab-learn
   npm install
   npm start