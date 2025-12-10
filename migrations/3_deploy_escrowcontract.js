const EscrowContract = artifacts.require("EscrowContract");
const CourierContract = artifacts.require("CourierContract");

module.exports = async function (deployer, network, accounts) {
  // Deploy EscrowContract with CourierContract address as courierFeeRecipient
  // Use accounts[0] as platformFeeRecipient
  const courierInstance = await CourierContract.deployed();
  await deployer.deploy(EscrowContract, accounts[0], courierInstance.address);
};
