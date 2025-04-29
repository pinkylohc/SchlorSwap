# CollabLearn

CollabLearn is a decentralized application (DApp) built on Ethereum that facilitates educational resource sharing, marketplace transactions, and community engagement through a tokenized system. Users can earn and stake tokens, participate in discussions, and access various educational resources.

## Features

- **EduToken**: An ERC20 token used for transactions within the platform.
- **Token Purchase**: Users can buy EduTokens with Ether.
- **Initial Token Claim**: New users can claim free initial tokens.
- **Reputation System**: Users can earn reputation points based on their activities and interactions.
- **Marketplace**: Users can list and buy educational resources.
- **Discussion Forum**: Users can participate in discussions and vote on posts.
- **Lucky Draw**: Users can earn rewards for participation.

## Smart Contract Overview

The core functionality of CollabLearn is implemented in the `CollabLearn` smart contract, which includes:

- **Token Management**: Functions for minting, transferring, and approving tokens.
- **Resource Listing**: Users can list educational resources for sale.
- **Reputation Tracking**: A system to manage user reputation scores.
- **Marketplace Transactions**: Functions to buy and sell resources.

### Contract Functions

- `claimInitialTokens()`: Claim initial tokens for new users.
- `buyTokens()`: Purchase EduTokens with Ether.
- `listResource()`: List educational resources for sale.
- `buyResource()`: Purchase a listed resource.
- `withdraw()`: Withdraw Ether from the contract (only owner).
- `setTokenPrice()`: Update the price of EduTokens (only owner).

## React.js Frontend

The frontend is built using React.js and allows users to interact with the CollabLearn smart contract. Key components include:

- **Token Purchase Form**: Interface for buying EduTokens.
- **Resource Listing**: UI for users to list and view educational resources.
- **Discussion Forum**: Interface for reading and posting discussions.
- **User Dashboard**: Displays user balance, claimed tokens, and reputation score.

### Getting Started

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/yourusername/collablearn.git
   cd collablearn