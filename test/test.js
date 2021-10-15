// const { expect, use } = require('chai')
// const { ethers, waffle, web3 } = require("hardhat");
// const { ContractFactory, utils } = require('ethers');
// const { waffleChai } = require('@ethereum-waffle/chai');
// const { deployMockContract, provider } = waffle
// const IERC20ABI = require('../abi/erc20.json')
// const BN = require('bn.js');
// use(waffleChai);
// const web3Utils = require('web3-utils')

// describe("CorgiFarmManager Unit Test", async()=>{
//     async function setup(){
//         const CorgiFarmManagerFactory = await ethers.getContractFactory("contracts/CorgiFarmManager.sol:CorgiFarmManager");
//         const wallets = provider.getWallets();
//         const mockBusd = await deployMockContract(wallets[0], IERC20ABI);
//         const devAddress = wallets[1].address
//         const mockCorgi = await deployMockContract(wallets[0], IERC20ABI);
//         const startBlock  = 0 ;
//         const corgiPerBlock = 10 ;
//         let args=[mockCorgi.address, devAddress, corgiPerBlock, startBlock]
//         const corgiFarmManager = CorgiFarmManagerFactory.deploy(...args);
//         await corgiFarmManager.deployTransaction.wait(5);

//         return {
//             wallets,
//             corgiFarmManager,
//             mockBusd,
//             mockCorgi
//         }

//     }
    
//     async function deposit(_sender, amount, setupData, pendingReward=0){
//         if(typeof amount === 'number'){
//             amount = new BN(amount)
//         }
//         amount = web3Utils.toWei();
//         const {wallets, corgiFarmManager, mockBusd, mockCorgi} = setupData;
//         await mockBusd.mock.balanceOf.returns(0)
//         await mockCorgi.mock.balanceOf.returns(0)

//         const res = await corgiFarmManager.connect(provider.getSigner(_sender.address)).deposit(amount.toString());
//         const r = await res.wait()

//         const userInfo = await corgiFarmManager.userInfo(_sender.address)

//         return { userInfo, ...setupData , r}
//     }

//     async function withdraw(_sender, amount, setupData ) {
//         amount = web3Utils.toWei(amount)

//         const { corgiFarmManager, mockCorgi } = setupData

//         await mockCorgi.mock.balanceOf.returns(0)
//         await mockCorgi.mock.transfer.returns(true);
//         const res = await corgiFarmManager.connect(provider.getSigner(_sender.address)).withdraw(amount.toString());
//         const r = await res.wait()

//         const userInfo = await corgiFarmManager.userInfo(_sender.address)

//         return { userInfo, ...setupData, r }
//     }
// })