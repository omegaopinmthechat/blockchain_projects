// SPDX-License-Identifier: MIT
pragma solidity ^0.8.31;

contract ConfCert {
    uint256 public nextId = 1000;

    struct Certificate {
        uint256 id;
        string studentName;
        string ipfsCID;
        address issuer;
    }

    mapping(uint256 => Certificate) public certificates;

    event CertificateIssued(uint256 id, string studentName, string ipfsCID);

    // Single certificate 
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

    // BULK CERTIFICATE UPLOAD
    function issueCertificatesBatch(
        string[] memory _studentNames,
        string[] memory _ipfsCIDs
    ) public {
        require(
            _studentNames.length == _ipfsCIDs.length,
            "Input array length mismatch"
        );

        for (uint256 i = 0; i < _studentNames.length; i++) {
            nextId++;

            certificates[nextId] = Certificate(
                nextId,
                _studentNames[i],
                _ipfsCIDs[i],
                msg.sender
            );

            emit CertificateIssued(nextId, _studentNames[i], _ipfsCIDs[i]);
        }
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
