import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { gql, request } from 'graphql-request';
import { ethers } from 'ethers';

const query = gql`
  {
    startedCoinFlips(first: 10) {
      id
      theCoinFlipID
      theBetStarter
      theStartingWager
      blockNumber
      blockTimestamp
      isActive
      transactionHash
    }
    finishedCoinFlips(first: 10) {
      id
      theCoinFlipID
      winner
      loser
      blockNumber
      blockTimestamp
    }
  }
`;

const url = process.env.REACT_APP_THE_GRAPH_API_URL;

export default function Dashboard({ contract }) {
  const { data, status } = useQuery({
    queryKey: ['activeCoinFlips'],
    async queryFn() {
      return await request(url, query);
    },
  });

  const endCoinFlip = async (coinFlipID, startingWager) => {
    if (!contract) {
      console.error("Contract is not initialized");
      return;
    }

    try {
      // Parse coinFlipID to integer
      const coinFlipIDInt = parseInt(coinFlipID);
      // Ensure startingWager is a string representing the amount in wei
      const wagerValue = ethers.BigNumber.from(startingWager.toString());

      alert(`Ending Coin Flip ID: ${coinFlipIDInt} with Wager: ${ethers.utils.formatEther(wagerValue)} ETH`);

      const transaction = await contract.endCoinFlip(coinFlipIDInt, {
        value: wagerValue,
      });
      await transaction.wait();

      console.log(`Coin flip with ID ${coinFlipIDInt} ended with a wager of ${ethers.utils.formatEther(wagerValue)} ETH!`);

      // Retrieve the details of the coin flip from the contract to check the winner/loser
      const coinFlipDetails = await contract.EtherCoinFlipStructs(coinFlipIDInt);
      const currentAddress = await contract.signer.getAddress();

      if (coinFlipDetails.winner.toLowerCase() === currentAddress.toLowerCase()) {
        alert("Congratulations! You won the coin flip!");
      } else {
        alert("Sorry, you lost the coin flip.");
      }

    } catch (error) {
      console.error("Error ending coin flip:", error);
      alert("Error ending coin flip. Please check the console for details.");
    }
  };

  // Function to filter active coin flips
  const getActiveCoinFlips = () => {
    if (!data) return [];

    const startedFlips = data.startedCoinFlips || [];
    const finishedFlips = data.finishedCoinFlips || [];

    const finishedIDs = new Set(finishedFlips.map(flip => flip.theCoinFlipID));

    // Filter out finished coin flips
    return startedFlips.filter(flip => !finishedIDs.has(flip.theCoinFlipID));
  };

  const activeCoinFlips = getActiveCoinFlips();

  return (
    <main>
      {status === 'loading' && <div>Loading active coin flips...</div>}
      {status === 'error' && <div>Error occurred querying the subgraph :/</div>}
      {status === 'success' && activeCoinFlips.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>Coin Flip ID</th>
              <th>Bet Starter</th>
              <th>Wager</th>
              <th>Action</th>
              <th>Transaction</th>
            </tr>
          </thead>
          <tbody>
            {activeCoinFlips.map((flip) => (
              <tr key={flip.id}>
                <td>{flip.theCoinFlipID}</td>
                <td>{flip.theBetStarter}</td>
                <td>{ethers.utils.formatEther(flip.theStartingWager)} ETH</td>
                <td>
                  <button
                    onClick={() =>
                      endCoinFlip(
                        flip.theCoinFlipID,
                        flip.theStartingWager
                      )
                    }
                  >
                    End Coin Flip
                  </button>
                </td>
                <td>
                  <a
                    href={`https://base-sepolia.blockscout.com/tx/${flip.transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View on Block Explorer
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No active coin flips available D:</p>
      )}
    </main>
  );
}
