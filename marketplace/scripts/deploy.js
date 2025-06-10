const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying HandmadeNFT contract...");

  // Get the contract factory
  const HandmadeNFT = await ethers.getContractFactory("HandmadeNFT");

  // Deploy the contract
  const handmadeNFT = await HandmadeNFT.deploy();

  // Wait for deployment to finish
  await handmadeNFT.deployed();

  console.log("HandmadeNFT deployed to:", handmadeNFT.address);
}

// Run the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 