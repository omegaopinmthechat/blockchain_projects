// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract LandRegistry {

    address public registrar;

    constructor() {
        registrar = msg.sender;
    }

    modifier onlyRegistrar() {
        require(msg.sender == registrar, "Only registrar allowed");
        _;
    }

    struct OwnerRecord {
        string ownerName;
        string nationalId;
        string deedCID;
        uint256 timestamp;
    }

    struct Land {
        uint256 plotId;
        string location;
        bool exists;
        string currentOwnerName;
        string currentOwnerNationalId;
    }

    mapping(uint256 => Land) public lands;
    mapping(uint256 => OwnerRecord[]) private ownershipHistory;

    event LandRegistered(uint256 indexed plotId, string ownerName, string deedCID);
    event OwnershipTransferred(uint256 indexed plotId, string newOwnerName, string deedCID);

    // Register new land
    function registerLand(
        uint256 _plotId,
        string memory _location,
        string memory _ownerName,
        string memory _nationalId,
        string memory _deedCID
    ) public onlyRegistrar {

        require(!lands[_plotId].exists, "Land already exists");

        lands[_plotId] = Land({
            plotId: _plotId,
            location: _location,
            exists: true,
            currentOwnerName: _ownerName,
            currentOwnerNationalId: _nationalId
        });

        ownershipHistory[_plotId].push(
            OwnerRecord({
                ownerName: _ownerName,
                nationalId: _nationalId,
                deedCID: _deedCID,
                timestamp: block.timestamp
            })
        );

        emit LandRegistered(_plotId, _ownerName, _deedCID);
    }

    // Transfer ownership (Registrar controlled)
    function transferOwnership(
        uint256 _plotId,
        string memory _newOwnerName,
        string memory _newNationalId,
        string memory _newDeedCID
    ) public onlyRegistrar {

        require(lands[_plotId].exists, "Land does not exist");

        lands[_plotId].currentOwnerName = _newOwnerName;
        lands[_plotId].currentOwnerNationalId = _newNationalId;

        ownershipHistory[_plotId].push(
            OwnerRecord({
                ownerName: _newOwnerName,
                nationalId: _newNationalId,
                deedCID: _newDeedCID,
                timestamp: block.timestamp
            })
        );

        emit OwnershipTransferred(_plotId, _newOwnerName, _newDeedCID);
    }

    function getOwnershipHistory(uint256 _plotId)
        public
        view
        returns (OwnerRecord[] memory)
    {
        require(lands[_plotId].exists, "Land does not exist");
        return ownershipHistory[_plotId];
    }

    function getCurrentOwner(uint256 _plotId)
        public
        view
        returns (string memory, string memory)
    {
        require(lands[_plotId].exists, "Land does not exist");
        return (
            lands[_plotId].currentOwnerName,
            lands[_plotId].currentOwnerNationalId
        );
    }
}
