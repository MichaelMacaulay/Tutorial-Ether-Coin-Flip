// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {VRFV2PlusWrapperConsumerBase} from "@chainlink/contracts@1.2.0/src/v0.8/vrf/dev/VRFV2PlusWrapperConsumerBase.sol";
import {ConfirmedOwner} from "@chainlink/contracts@1.2.0/src/v0.8/shared/access/ConfirmedOwner.sol";
import {LinkTokenInterface} from "@chainlink/contracts@1.2.0/src/v0.8/shared/interfaces/LinkTokenInterface.sol";
import {VRFV2PlusClient} from "@chainlink/contracts@1.2.0/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";

contract EtherCoinFlip is VRFV2PlusWrapperConsumerBase, ConfirmedOwner {
    struct EtherCoinFlipStruct {
        uint256 ID;
        address payable betStarter;
        uint256 startingWager;
        address payable betEnder;
        uint256 endingWager;
        uint256 etherTotal;
        address payable winner;
        address payable loser;
    }

    uint256 public numberOfCoinFlips = 1;
    mapping(uint256 => EtherCoinFlipStruct) public EtherCoinFlipStructs;

    event StartedCoinFlip(uint256 indexed theCoinFlipID, address indexed theBetStarter, uint256 theStartingWager);
    event FinishedCoinFlip(uint256 indexed theCoinFlipID, address indexed winner, address indexed loser);
    event RequestSent(uint256 requestId, uint32 numWords);
    event RequestFulfilled(uint256 requestId, uint256[] randomWords, uint256 payment);

    struct RequestStatus {
        uint256 paid;
        bool fulfilled;
        uint256[] randomWords;
        uint256 coinFlipID;
    }

    mapping(uint256 => RequestStatus) public s_requests; /* requestId --> requestStatus */
    uint256 public lastRequestId;

    // VRF Parameters
    uint32 public callbackGasLimit = 100000;
    uint16 public requestConfirmations = 3;
    uint32 public numWords = 1;
    address public linkAddress = 0x779877A7B0D9E8603169DdbD7836e478b4624789;
    address public wrapperAddress = 0x195f15F2d49d693cE265b4fB0fdDbE15b1850Cc1;

    constructor() ConfirmedOwner(msg.sender) VRFV2PlusWrapperConsumerBase(wrapperAddress) {}

    function newCoinFlip() public payable returns (uint256 coinFlipID) {
        require(msg.value > 0, "Wager must be greater than 0");
        address payable player1 = payable(msg.sender);
        coinFlipID = numberOfCoinFlips;
        numberOfCoinFlips += 1;
        EtherCoinFlipStructs[coinFlipID] = EtherCoinFlipStruct(
            coinFlipID,
            player1,
            msg.value,
            payable(address(0)),
            0,
            0,
            payable(address(0)),
            payable(address(0))
        );
        emit StartedCoinFlip(coinFlipID, player1, msg.value);
    }

    function endCoinFlip(uint256 coinFlipID, bool enableNativePayment) public payable {
        EtherCoinFlipStruct storage currentCoinFlip = EtherCoinFlipStructs[coinFlipID];
        address payable player2 = payable(msg.sender);

        require(
            msg.value >= (currentCoinFlip.startingWager * 99 / 100) &&
            msg.value <= (currentCoinFlip.startingWager * 101 / 100),
            "Ending wager must be within 1% of the starting wager"
        );
        require(currentCoinFlip.betEnder == payable(address(0)), "Coin flip already ended");
        require(coinFlipID == currentCoinFlip.ID, "Invalid coin flip ID");

        currentCoinFlip.betEnder = player2;
        currentCoinFlip.endingWager = msg.value;
        currentCoinFlip.etherTotal = currentCoinFlip.startingWager + currentCoinFlip.endingWager;

        uint256 requestId = requestRandomness(enableNativePayment, coinFlipID);
        lastRequestId = requestId;
    }

    function requestRandomness(bool enableNativePayment, uint256 coinFlipID) internal returns (uint256 requestId) {
        bytes memory extraArgs = VRFV2PlusClient._argsToBytes(
            VRFV2PlusClient.ExtraArgsV1({nativePayment: enableNativePayment})
        );
        uint256 reqPrice;

        if (enableNativePayment) {
            (requestId, reqPrice) = requestRandomnessPayInNative(
                callbackGasLimit,
                requestConfirmations,
                numWords,
                extraArgs
            );
        } else {
            (requestId, reqPrice) = requestRandomness(
                callbackGasLimit,
                requestConfirmations,
                numWords,
                extraArgs
            );
        }

        s_requests[requestId] = RequestStatus({
            paid: reqPrice,
            randomWords: new uint256,
            fulfilled: false,
            coinFlipID: coinFlipID
        });

        emit RequestSent(requestId, numWords);
        return requestId;
    }

    function fulfillRandomWords(uint256 _requestId, uint256[] memory _randomWords) internal override {
        require(s_requests[_requestId].paid > 0, "Request not found");
        RequestStatus storage request = s_requests[_requestId];
        request.fulfilled = true;
        request.randomWords = _randomWords;

        EtherCoinFlipStruct storage currentCoinFlip = EtherCoinFlipStructs[request.coinFlipID];
        uint256 randomResult = _randomWords[0];

        if ((randomResult % 2) == 0) {
            currentCoinFlip.winner = currentCoinFlip.betStarter;
            currentCoinFlip.loser = currentCoinFlip.betEnder;
        } else {
            currentCoinFlip.winner = currentCoinFlip.betEnder;
            currentCoinFlip.loser = currentCoinFlip.betStarter;
        }

        (bool success, ) = currentCoinFlip.winner.call{value: currentCoinFlip.etherTotal}("");
        require(success, "Transfer failed.");

        emit FinishedCoinFlip(currentCoinFlip.ID, currentCoinFlip.winner, currentCoinFlip.loser);
        emit RequestFulfilled(_requestId, _randomWords, request.paid);
    }

    function withdrawLink() public onlyOwner {
        LinkTokenInterface link = LinkTokenInterface(linkAddress);
        require(link.transfer(msg.sender, link.balanceOf(address(this))), "Unable to transfer LINK");
    }

    function withdrawNative(uint256 amount) external onlyOwner {
        (bool success, ) = payable(owner()).call{value: amount}("");
        require(success, "withdrawNative failed");
    }

    receive() external payable {}
}
