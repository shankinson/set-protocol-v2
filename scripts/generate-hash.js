const hre = require("hardhat");

async function main() {

  const b = "Version 1";
  const hash = hre.ethers.utils.hashMessage(b);
  console.log(`hash: ${hash}`);

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });