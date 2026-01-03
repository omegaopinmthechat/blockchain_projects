// SPDX-License-Identifier: MIT
pragma solidity ^0.8.31;

contract CertificateHashVerifier {

    address public university;

    // hash => exists
    mapping(bytes32 => bool) private certificateHashes;

    event CertificateHashStored(bytes32 hash);

    constructor() {
        university = msg.sender;
    }

    modifier onlyUniversity() {
        require(msg.sender == university, "Only university allowed");
        _;
    }

    // Store certificate hash
    function storeCertificateHash(bytes32 _hash) external onlyUniversity {
        require(!certificateHashes[_hash], "Hash already exists");
        certificateHashes[_hash] = true;
        emit CertificateHashStored(_hash);
    }

    // Public verification
    function verifyCertificate(bytes32 _hash) external view returns (bool) {
        return certificateHashes[_hash];
    }
}
