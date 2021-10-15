const hre = require('hardhat');

const usdc = "0xd87ba7a50b2e7e660f678a895e4b72e7cb4ccd9c";
const gpool = "0x8D7341D4889ec78990b7B7ad4FbdDC4B3AC516fA";
const uniswapV3Router = "0xe592427a0aece92de3edee1f18e0157c05861564";
const admins = [
    "0x882D4b497Fb7Bf077109835812688509eC8EFBa7",
    "0x2138fB8E376A6e38fff50D151826C4875c3AfFD0",
    "0x4D9C8d834f27dd7721846631dE82859cAFc3fA19",
]
const args =[uniswapV3Router, gpool, usdc, admins];

async function deploy() {
  //get the contract to deploy
  const contract = await hre.ethers.getContractFactory("contracts/GStakingManager.sol:GStakingManager"); 
  const deployedContract = await contract.deploy(...args);
  await deployedContract.deployTransaction.wait(5);
  await hre.run("verify:verify",{
    address: deployedContract.address,
    contract :"contracts/GStakingManager.sol:GStakingManager",
    constructorArguments : [...args]
  })
  .then(()=>{
    console.log(`Link of contract: https://goerli.etherscan.io/address/${deployedContract.address}`);
  })
}

deploy()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
