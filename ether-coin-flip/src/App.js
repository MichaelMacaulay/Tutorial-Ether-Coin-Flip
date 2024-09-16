import "./App.css";

function StartCoinFlipButton() {
  const startCoinFlip = () => {
    console.log("Coin flip started!");
    
  };

  return <button onClick={startCoinFlip}>Start Coin Flip</button>;
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
