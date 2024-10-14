import React from 'react';
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { gql, request } from 'graphql-request';

// GraphQL query to get active coin flips (adjust the fields as necessary)
const query = gql`
  {
    startedCoinFlips(where: { isActive: true }, first: 10) {
      theBetStarter
      theStartingWager
      blockNumber
      blockTimestamp
      transactionHash
    }
  }
`;

const url = process.env.REACT_APP_THE_GRAPH_API_URL;

export default function Dashboard() {
  const { data, status } = useQuery({
    queryKey: ['activeCoinFlips'],
    async queryFn() {
      return await request(url, query);
    },
  });

  return (
    <main>
      {status === 'loading' && <div>Loading active coin flips...</div>}
      {status === 'error' && <div>Error occurred querying the subgraph.</div>}
      {status === 'success' && data?.startedCoinFlips.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>Bet Starter</th>
              <th>Starting Wager (ETH)</th>
              <th>Block Number</th>
              <th>Block Timestamp</th>
              <th>Transaction Hash</th>
            </tr>
          </thead>
          <tbody>
            {data.startedCoinFlips.map((flip) => (
              <tr key={flip.id}>
                <td>{flip.theCoinFlipID}</td>
                <td>{flip.theBetStarter}</td>
                <td>{flip.theStartingWager / 1e18} ETH</td>
                <td>{flip.blockNumber}</td>
                <td>{new Date(flip.blockTimestamp * 1000).toLocaleString()}</td>
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

// Create a query client for react-query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // Data stays fresh for 1 minute
    },
  },
});
