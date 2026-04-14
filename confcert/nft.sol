// SPDX-License-Identifier: MIT
pragma solidity ^0.8.31;

// msg.sender -> address calling the function

contract SimpleNFT {

    // tokenId => owner address
    // each NFT has a unique ID and owner
    mapping(uint256 => address) public ownerOf;

    // address => number of NFTs owned
    mapping(address => uint256) public balanceOf;

    // total number of NFTs created
    uint256 public totalSupply;

    // mint function -> creates a new NFT
    function mint() public {

        // create new token ID (1,2,3,...)
        uint256 tokenId = totalSupply + 1;

        // assign ownership to person who called function
        ownerOf[tokenId] = msg.sender;

        // increase balance of owner
        balanceOf[msg.sender]++;

        // increase total supply
        totalSupply++;
    }

    // transfer NFT to another address
    function transferNFT(address to, uint256 tokenId) public {
    require(ownerOf[tokenId] == msg.sender, "Not owner");

    ownerOf[tokenId] = to;

    balanceOf[msg.sender]--;
    balanceOf[to]++;
}

    // view function to check owner of a token
    function getOwner(uint256 tokenId) public view returns(address) {
        return ownerOf[tokenId];
    }
}