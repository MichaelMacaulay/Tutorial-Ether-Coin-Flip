// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

contract EtherCoinFlip {

    struct EtherCoinFlipStruct {
        uint256 ID;
        address payable betStarter;
        uint256 startingWager;
        address payable betEnder;
        uint256 endingWager;
        uint256 etherTotal;
        address payable winner;
        address payable loser;
        bool isActive; 
    }

    uint256 numberOfCoinFlips = 1;
    mapping(uint256 => EtherCoinFlipStruct) public EtherCoinFlipStructs;

    event StartedCoinFlip(uint256 indexed theCoinFlipID, address indexed theBetStarter, uint256 theStartingWager);
    event FinishedCoinFlip(uint256 indexed theCoinFlipID, address indexed winner, address indexed loser);

    function newCoinFlip() public payable returns (uint256 coinFlipID) {
        address payable player1 = payable(msg.sender);
        coinFlipID = numberOfCoinFlips++;
        EtherCoinFlipStructs[coinFlipID] = EtherCoinFlipStruct(
            coinFlipID,
            player1,
            msg.value,
            payable(address(0)),
            0,
            0,
            payable(address(0)),
            payable(address(0)),
            true
        );
        emit StartedCoinFlip(coinFlipID, player1, msg.value);
    }

    function endCoinFlip(uint256 coinFlipID) public payable {
        EtherCoinFlipStruct storage currentCoinFlip = EtherCoinFlipStructs[coinFlipID];
        require(currentCoinFlip.isActive, "Coin flip already finished");
        address payable player2 = payable(msg.sender);
        require(
            msg.value >= (currentCoinFlip.startingWager * 99 / 100) &&
            msg.value <= (currentCoinFlip.startingWager * 101 / 100),
            "Ending wager must be within 1% of the starting wager"
        );
        require(coinFlipID == currentCoinFlip.ID, "Invalid coin flip ID");

        currentCoinFlip.betEnder = player2;
        currentCoinFlip.endingWager = msg.value;
        currentCoinFlip.etherTotal = currentCoinFlip.startingWager + currentCoinFlip.endingWager;

        bytes32 randomHash = keccak256(abi.encodePacked(block.chainid, block.gaslimit, block.number, block.timestamp, msg.sender));
        uint256 randomResult = uint256(randomHash);

        if ((randomResult % 2) == 0) {
            currentCoinFlip.winner = currentCoinFlip.betStarter;
            currentCoinFlip.loser = currentCoinFlip.betEnder;
        } else {
            currentCoinFlip.winner = currentCoinFlip.betEnder;
            currentCoinFlip.loser = currentCoinFlip.betStarter;
        }

        (bool sent, ) = currentCoinFlip.winner.call{value: currentCoinFlip.etherTotal}("");
        require(sent, "Failed to send Ether to the winner");

        currentCoinFlip.isActive = false;

        emit FinishedCoinFlip(currentCoinFlip.ID, currentCoinFlip.winner, currentCoinFlip.loser);
    }

    function getActiveCoinFlips() public view returns (EtherCoinFlipStruct[] memory) {
        uint256 activeCount = 0;

        for (uint256 i = 1; i < numberOfCoinFlips; i++) {
            if (EtherCoinFlipStructs[i].isActive) {
                activeCount++;
            }
        }

        EtherCoinFlipStruct[] memory activeFlips = new EtherCoinFlipStruct[](activeCount);
        uint256 currentIndex = 0;

        for (uint256 i = 1; i < numberOfCoinFlips; i++) {
            if (EtherCoinFlipStructs[i].isActive) {
                activeFlips[currentIndex] = EtherCoinFlipStructs[i];
                currentIndex++;
            }
        }

        return activeFlips;
    }
}