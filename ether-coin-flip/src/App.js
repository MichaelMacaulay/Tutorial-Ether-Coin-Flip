import React, { useState } from "react";
import "./App.css";
import ABI from "./components/ABI.json";
import { ethers } from "ethers";
import Dashboard from "./components/Dashboard.js";

const contractAddress = "0xd3037A0CFfADA943253A0CCc84593cd7b79E1ABd";
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

let provider, signer;

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

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [contractInstance, setContractInstance] = useState(null);

  const connectWallet = async () => {
    try {
      await initializeProvider();
      setIsConnected(true);
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  };

  async function initializeProvider() {
    if (typeof window.ethereum !== "undefined") {
      try {
        provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        signer = provider.getSigner();
        const contract = new ethers.Contract(contractAddress, abi, signer);
        await switchToBaseSepolia();
        setContractInstance(contract); // Store contract in state
      } catch (error) {
        console.error("Error initializing provider:", error);
      }
    } else {
      alert("MetaMask is not installed. Please install MetaMask.");
    }
  }

  function StartCoinFlipButton({ contract }) {
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

  return (
    <div className="App">
      <h1>Ether Coin Flip</h1>
      {!isConnected ? (
        <button onClick={connectWallet}>Connect Wallet</button>
      ) : (
        <>
          <StartCoinFlipButton contract={contractInstance} />
          <Dashboard contract={contractInstance} />
        </>
      )}
    </div>
  );
}

export default App;
