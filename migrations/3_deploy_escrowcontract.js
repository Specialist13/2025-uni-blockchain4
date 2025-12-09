const EscrowContract = artifacts.require("EscrowContract");
const CourierContract = artifacts.require("CourierContract");

module.exports = function (deployer) {
  // Deploy EscrowContract with CourierContract address as courierFeeRecipient
  // Note: platformFeeRecipient address needs to be set (currently hardcoded)
  return CourierContract.deployed().then(courierInstance => {
    return deployer.deploy(EscrowContract, "0xCCE0d18fadeeC6Cdc256833865CCC349D0728C67", courierInstance.address);
  });
};
