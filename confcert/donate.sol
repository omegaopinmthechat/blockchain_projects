// SPDX-License-Identifier: MIT
pragma solidity ^0.8.31;

contract CharityDonation {

    address public admin;

    mapping(address => uint256) public donations;
    mapping(address => bool) public approvedCharities;

    uint256 public totalDonations;

    event DonationReceived(address indexed donor, uint256 amount);
    event CharityAdded(address charity);
    event CharityRemoved(address charity);
    event FundsWithdrawn(address indexed to, uint256 amount);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin allowed");
        _;
    }

    modifier onlyCharity() {
        require(approvedCharities[msg.sender], "Not an approved charity");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function donate() external payable {
        require(msg.value > 0, "Donation must be greater than 0");

        donations[msg.sender] += msg.value;
        totalDonations += msg.value;

        emit DonationReceived(msg.sender, msg.value);
    }

    function addCharity(address _charity) external onlyAdmin {
        require(_charity != address(0), "Invalid address");
        approvedCharities[_charity] = true;
        emit CharityAdded(_charity);
    }

    function removeCharity(address _charity) external onlyAdmin {
        approvedCharities[_charity] = false;
        emit CharityRemoved(_charity);
    }

    function withdraw(address _to, uint256 amount) external onlyCharity {
        require(_to != address(0), "Invalid recipient");
        require(amount <= address(this).balance, "Insufficient balance");

        (bool success, ) = payable(_to).call{value: amount}("");
        require(success, "Transfer failed");

        emit FundsWithdrawn(_to, amount);
    }

    function contractBalance() public view returns (uint256) {
        return address(this).balance;
    }
}
