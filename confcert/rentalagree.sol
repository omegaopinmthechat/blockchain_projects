// SPDX-License-Identifier: MIT
pragma solidity ^0.8.31;

contract SmartRentalAgreement {

    struct Agreement {
        address landlord;
        address tenant;
        uint256 monthlyRent;
        uint256 securityDeposit;
        uint256 leaseStart;
        uint256 leaseEnd;
        uint256 lastRentClaimed;
        bool depositReleased;
        bool active;
    }

    uint256 public agreementCount;
    mapping(uint256 => Agreement) public agreements;

    uint256 constant RENT_INTERVAL = 30 days;
    uint256 constant CLAIM_WINDOW = 5 days;

    event AgreementCreated(
        uint256 agreementId,
        address landlord,
        address tenant
    );
    event RentDeposited(uint256 agreementId, uint256 amount);
    event RentClaimed(uint256 agreementId, uint256 amount);
    event DepositReleased(uint256 agreementId, uint256 amount);

    constructor() {}

    function createAgreement(
        address _tenant,
        uint256 _monthlyRent,
        uint256 _securityDeposit,
        uint256 _leaseDuration
    ) external {
        require(_tenant != msg.sender, "Tenant cannot be landlord");
        require(_monthlyRent > 0, "Invalid rent");

        agreementCount++;

        agreements[agreementCount] = Agreement({
            landlord: msg.sender,
            tenant: _tenant,
            monthlyRent: _monthlyRent,
            securityDeposit: _securityDeposit,
            leaseStart: block.timestamp,
            leaseEnd: block.timestamp + _leaseDuration,
            lastRentClaimed: block.timestamp,
            depositReleased: false,
            active: true
        });

        emit AgreementCreated(agreementCount, msg.sender, _tenant);
    }

    function depositFunds(uint256 _agreementId) external payable {
        Agreement storage a = agreements[_agreementId];

        require(a.active, "Inactive agreement");
        require(msg.sender == a.tenant, "Only tenant");
        require(
            msg.value == a.monthlyRent + a.securityDeposit,
            "Incorrect amount"
        );

        emit RentDeposited(_agreementId, msg.value);
    }

    function claimMonthlyRent(uint256 _agreementId) external {
        Agreement storage a = agreements[_agreementId];

        require(msg.sender == a.landlord, "Only landlord");
        require(block.timestamp <= a.leaseEnd, "Lease ended");
        require(
            block.timestamp >= a.lastRentClaimed + RENT_INTERVAL,
            "Rent not due"
        );
        require(
            block.timestamp <= a.lastRentClaimed + RENT_INTERVAL + CLAIM_WINDOW,
            "Claim window missed"
        );

        a.lastRentClaimed = block.timestamp;

        (bool sent, ) = a.landlord.call{value: a.monthlyRent}("");
        require(sent, "Rent transfer failed");

        emit RentClaimed(_agreementId, a.monthlyRent);
    }

    function releaseDeposit(uint256 _agreementId) external {
        Agreement storage a = agreements[_agreementId];

        require(msg.sender == a.landlord, "Only landlord");
        require(block.timestamp >= a.leaseEnd, "Lease active");
        require(!a.depositReleased, "Already released");

        a.depositReleased = true;
        a.active = false;

        (bool sent, ) = a.tenant.call{value: a.securityDeposit}("");
        require(sent, "Deposit transfer failed");

        emit DepositReleased(_agreementId, a.securityDeposit);
    }

    function contractBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
