import React, { useState } from "react";
import "./App.css";
import ABI from "./components/ABI.json";
import { ethers } from "ethers";

const contractAddress = "0x12Eb0E4591fD62B3e8af390C81e5E111b1CE5003";
const abi = ABI;

// Using Base Sepolia
const baseSepoliaChainId = "84532";

const baseSepoliaParams = {
  chainId: baseSepoliaChainId,
  chainName: "Base Sepolia",
  nativeCurrency: {
    name: "Sepolia ETH",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: ["https://sepolia.base.org"],
  blockExplorerUrls: ["https://base-sepolia.blockscout.com/"],
};

let provider, signer, contract;

// Switch user to Base Sepolia network
async function switchToBaseSepolia() {
  try {
    const currentChainId = await provider.send("eth_chainId", []);

    // If user is not on Base Sepolia network, request to switch/add network
    if (currentChainId !== baseSepoliaChainId) {
      try {
        // Request to switch to Base Sepolia
        await provider.send("wallet_switchEthereumChain", [
          { chainId: baseSepoliaChainId },
        ]);
      } catch (switchError) {
        // If the error code is 4902, it means the chain is not added to MetaMask
        if (switchError.code === 4902) {
          try {
            // Request to add Base Sepolia
            await provider.send("wallet_addEthereumChain", [baseSepoliaParams]);
          } catch (addError) {
            console.error(
              "Failed to add Base Sepolia network to MetaMask:",
              addError
            );
          }
        } else {
          console.error("Failed to switch to Base Sepolia:", switchError);
        }
      }
    }
  } catch (error) {
    console.error("Failed to get chain ID or switch network:", error);
  }
}

async function initializeProvider() {
  if (typeof window.ethereum !== "undefined") {
    try {
      // Initialize ethers provider
      provider = new ethers.providers.Web3Provider(window.ethereum);

      // Request accounts from MetaMask
      await provider.send("eth_requestAccounts", []);

      // Get the signer and contract instance
      signer = provider.getSigner();
      contract = new ethers.Contract(contractAddress, abi, signer);

      // Switch to Base Sepolia network after connecting
      await switchToBaseSepolia();
    } catch (error) {
      console.error("Error initializing provider:", error);
    }
  } else {
    alert("MetaMask is not installed. Please install MetaMask and try again.");
  }
}

function StartCoinFlipButton() {
  const [wager, setWager] = useState(""); // State to store the wager amount

  const startCoinFlip = async () => {
    if (!contract) {
      console.error("Contract is not initialized");
      return;
    }

    try {
      const transaction = await contract.startCoinFlip({
        value: ethers.utils.parseEther(wager), // Sends the wager in ETH
      });
      await transaction.wait(); // Waits for the transaction to be confirmed
      console.log(`Coin flip started with a wager of ${wager} ETH!`);
    } catch (error) {
      console.error("Error starting coin flip:", error);
    }
  };

  return (
    <div>
      <input
        type="number"
        placeholder="Enter Wager Amount (ETH)"
        value={wager}
        onChange={(e) => setWager(e.target.value)} // Updates the state with input value
      />
      <button onClick={startCoinFlip}>Start Coin Flip</button>
    </div>
  );
}

function App() {
  const [isConnected, setIsConnected] = useState(false);

  const connectWallet = async () => {
    try {
      await initializeProvider();
      setIsConnected(true); // Set state to indicate the wallet is connected
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  };

  return (
    <div>
      <h1>Ether Coin Flip</h1>
      {!isConnected ? (
        <button onClick={connectWallet}>Connect Wallet</button>
      ) : (
        <StartCoinFlipButton />
      )}
    </div>
  );
}

export default App;
