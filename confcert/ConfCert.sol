// SPDX-License-Identifier: MIT
pragma solidity ^0.8.31;

contract ConfCert {
    uint256 public nextId = 1000; // to start the bolck from 1001

    struct Certificate { // What a certificate will have
        uint256 id;
        string studentName;
        string ipfsCID; //CID -> content identifier
        address issuer;
    }

    mapping(uint256 => Certificate) public certificates;
//     Create a storage table called certificates where
//     each certificate ID (uint256) maps to one Certificate record
//     certificates[1001] → Certificate{1001, "Amar", "bafy...", 0xABC...}
//     certificates[1002] → Certificate{1002, "Rahul", "bafy...", 0xDEF...}


    event CertificateIssued(uint256 id, string studentName, string ipfsCID);

    function issueCertificate(
        string memory _studentName,
        string memory _ipfsCID
    ) public {
        nextId++;

        certificates[nextId] = Certificate(
            nextId,
            _studentName,
            _ipfsCID,
            msg.sender
        );

        emit CertificateIssued(nextId, _studentName, _ipfsCID);
    }

    function getCertificate(uint256 _id)
    public
    view
    returns (string memory, string memory, address)
    {
        require(_id > 0 && _id <= nextId, "Certificate does not exist");

        Certificate memory cert = certificates[_id];
        return (cert.studentName, cert.ipfsCID, cert.issuer);
    }

}
