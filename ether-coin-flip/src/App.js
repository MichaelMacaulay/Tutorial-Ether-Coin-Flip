import React, { useState } from "react";
import "./App.css";
import ABI from "./components/ABI.json";
import { ethers } from "ethers";

const contractAddress = "0x12Eb0E4591fD62B3e8af390C81e5E111b1CE5003";
const abi = ABI;

// Using Base Sepolia
const baseSepoliaChainId = "0x149E4";

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

    if (currentChainId !== baseSepoliaChainId) {
      try {
        await provider.send("wallet_switchEthereumChain", [
          { chainId: baseSepoliaChainId },
        ]);
      } catch (switchError) {
        if (switchError.code === 4902) {
          try {
            await provider.send("wallet_addEthereumChain", [baseSepoliaParams]);
          } catch (addError) {
            console.error("Failed to add Base Sepolia network:", addError);
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
      provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      signer = provider.getSigner();
      contract = new ethers.Contract(contractAddress, abi, signer);
      await switchToBaseSepolia();
    } catch (error) {
      console.error("Error initializing provider:", error);
    }
  } else {
    alert("MetaMask is not installed. Please install MetaMask.");
  }
}

function StartCoinFlipButton() {
  const [wager, setWager] = useState("");

  const startCoinFlip = async () => {
    if (!contract) {
      console.error("Contract is not initialized");
      return;
    }

    console.log(`Starting Coin Flip`);
    console.log(`Wager Amount: ${wager} ETH`);

    try {
      const transaction = await contract.newCoinFlip({
        value: ethers.utils.parseEther(wager),
      });
      await transaction.wait();
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
        onChange={(e) => setWager(e.target.value)}
      />
      <button onClick={startCoinFlip}>Start Coin Flip</button>
    </div>
  );
}

function EndCoinFlipButton() {
  const [coinFlipId, setCoinFlipId] = useState("");
  const [endWager, setEndWager] = useState("");

  const endCoinFlip = async () => {
    if (!contract) {
      console.error("Contract is not initialized");
      return;
    }

    console.log(`Ending Coin Flip`);
    console.log(`Coin Flip ID: ${coinFlipId}`);
    console.log(`Ending Wager Amount: ${endWager} ETH`);

    try {
      const transaction = await contract.endCoinFlip(coinFlipId, {
        value: ethers.utils.parseEther(endWager),
      });
      await transaction.wait();
      console.log(
        `Coin flip with ID ${coinFlipId} ended with a wager of ${endWager} ETH!`
      );
    } catch (error) {
      console.error("Error ending coin flip:", error);
    }
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Enter Coin Flip ID"
        value={coinFlipId}
        onChange={(e) => setCoinFlipId(e.target.value)}
      />
      <input
        type="number"
        placeholder="Enter Wager Amount (ETH)"
        value={endWager}
        onChange={(e) => setEndWager(e.target.value)}
      />
      <button onClick={endCoinFlip}>End Coin Flip</button>
    </div>
  );
}

function App() {
  const [isConnected, setIsConnected] = useState(false);

  const connectWallet = async () => {
    try {
      await initializeProvider();
      setIsConnected(true);
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
        <>
          <StartCoinFlipButton />
          <EndCoinFlipButton />
        </>
      )}
    </div>
  );
}

export default App;
