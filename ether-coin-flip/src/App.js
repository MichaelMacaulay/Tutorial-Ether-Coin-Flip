import React, { useState } from "react";
import "./App.css";

function StartCoinFlipButton() {
  const [wager, setWager] = useState(""); // State to store the wager amount

  const startCoinFlip = () => {
    console.log(`Coin flip started with a wager of ${wager} ETH!`);
    // Here, you can add more logic to handle the wager in the future
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
