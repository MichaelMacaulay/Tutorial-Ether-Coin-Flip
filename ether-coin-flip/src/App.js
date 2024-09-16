import React, { useState } from "react";
import "./App.css";
import ABI from "./components/ABI.json";

const ethers = require("ethers");


// A Web3Provider wraps a standard Web3 provider, which is
// what MetaMask injects as window.ethereum into each page
const provider = new ethers.providers.Web3Provider(window.ethereum);

// MetaMask requires requesting permission to connect users accounts
async function initializeProvider() {
  await provider.send("eth_requestAccounts", []);

  // The MetaMask plugin also allows signing transactions to
  // send ether and pay to change state within the blockchain.
  // For this, you need the account signer...
  const signer = provider.getSigner();

  // You can now use the signer to interact with the contract
  const contract = new ethers.Contract(contractAddress, abi, signer);
}

initializeProvider();

// Contract details
const contractAddress = "0x12Eb0E4591fD62B3e8af390C81e5E111b1CE5003";
const abi = ABI;


// MetaMask requires requesting permission to connect users accounts
await provider.send("eth_requestAccounts", []);

// The MetaMask plugin also allows signing transactions to
// send ether and pay to change state within the blockchain.
// For this, you need the account signer...
const signer = provider.getSigner();

function StartCoinFlipButton() {
  const [wager, setWager] = useState(""); // State to store the wager amount

  const startCoinFlip = () => {
    console.log(`Coin flip started with a wager of ${wager} ETH!`);
    
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
  return (
    <div>
      <h1>Ether Coin Flip</h1>
      <StartCoinFlipButton />
    </div>
  );
}

export default App;
