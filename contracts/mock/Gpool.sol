// SPDX-License-Identifier: NOLICENSE

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract  Gpool is Context, ERC20 {

    constructor () public ERC20("Genneris token", "GPOOL") {
        _mint(_msgSender(), 1000 * (10 ** uint256(decimals())));
    }

    // mint for everyone
    function mint(address account, uint256 amount) public {
        _mint(account, amount * (10 ** uint256(decimals())));
    }


}
