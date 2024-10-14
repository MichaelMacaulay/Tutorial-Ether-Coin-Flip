import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { gql, request } from 'graphql-request';
import { ethers } from 'ethers';

const query = gql`
  {
    startedCoinFlips(where: { isActive: true }, first: 10) {
      id
      theCoinFlipID
      theBetStarter
      theStartingWager
      blockNumber
      blockTimestamp
      transactionHash
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

  const handleEndCoinFlip = async (coinFlipID, startingWager) => {
    if (!contract) {
      console.error("Contract is not initialized");
      return;
    }

    try {
      // Parse coinFlipID to integer
      const coinFlipIDInt = parseInt(coinFlipID);
      // Ensure startingWager is a string representing the amount in wei
      const wagerValue = ethers.BigNumber.from(startingWager.toString()); // Safely create BigNumber

      console.log(`Ending Coin Flip ID: ${coinFlipIDInt} with Wager: ${ethers.utils.formatEther(wagerValue)} ETH`);

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

  return (
    <main>
      {status === 'loading' && <div>Loading active coin flips...</div>}
      {status === 'error' && <div>Error occurred querying the subgraph.</div>}
      {status === 'success' && data?.startedCoinFlips.length > 0 ? (
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
            {data.startedCoinFlips.map((flip) => (
              <tr key={flip.id}>
                <td>{flip.theCoinFlipID}</td>
                <td>{flip.theBetStarter}</td>
                <td>{ethers.utils.formatEther(flip.theStartingWager)} ETH</td>
                <td>
                  <button
                    onClick={() =>
                      handleEndCoinFlip(
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
        <p>No active coin flips available.</p>
      )}
    </main>
  );
}
