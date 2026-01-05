// SPDX-License-Identifier: MIT
pragma solidity ^0.8.31;

contract AssignmentVault {

    struct Submission {
        address student;
        address assignedTo;   
        string cid;         
        uint256 timestamp;
    }

    uint256 public submissionCount;

    mapping(uint256 => Submission) public submissions;

    event AssignmentStamped(
        uint256 indexed id,
        address indexed student,
        address indexed assignedTo,
        string cid,
        uint256 timestamp
    );

    function submitAssignment(
        address _assignedTo,
        string memory _cid
    ) public {
        require(_assignedTo != address(0), "Invalid recipient");
        require(bytes(_cid).length > 0, "CID required");

        submissionCount++;

        submissions[submissionCount] = Submission(
            msg.sender,
            _assignedTo,
            _cid,
            block.timestamp
        );

        emit AssignmentStamped(
            submissionCount,
            msg.sender,
            _assignedTo,
            _cid,
            block.timestamp
        );
    }

    function getSubmission(uint256 _id)
        public
        view
        returns (
            address student,
            address assignedTo,
            string memory cid,
            uint256 timestamp
        )
    {
        Submission memory s = submissions[_id];
        return (s.student, s.assignedTo, s.cid, s.timestamp);
    }
}
