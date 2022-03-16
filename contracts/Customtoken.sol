// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
*@title MichaelToken (MCHT) 
*@notice This is the token you will earn by stacking your ERC-721, contains 18 decimals
*/
contract Customtoken is ERC20{

    constructor() ERC20("MichaelToken", "MCHT") {
        _mint(msg.sender, 1000 * (10 ** 18));
    }
}