const hre = require("hardhat");

async function main() {
  const CustomNft = await hre.ethers.getContractFactory("Customnft");
  const customnft = await CustomNft.deploy();

  await customnft.deployed();

  console.log("Customnft deployed to:", customnft.address);

  const StakeNft = await hre.ethers.getContractFactory("StakeNft");
  const stakenft = await StakeNft.deploy();

  await stakenft.deployed(customnft.address);

  console.log("stakenft deployed to:", stakenft.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
