const MarketplaceContract = artifacts.require("MarketplaceContract");
const EscrowContract = artifacts.require("EscrowContract");
const CourierContract = artifacts.require("CourierContract");

module.exports = function (deployer) {
  // Link all contracts together after deployment
  return Promise.all([
    MarketplaceContract.deployed(),
    EscrowContract.deployed(),
    CourierContract.deployed()
  ]).then(([marketplaceInstance, escrowInstance, courierInstance]) => {
    // MarketplaceContract needs to know EscrowContract and CourierContract addresses
    return marketplaceInstance.setEscrowContractAddress(escrowInstance.address)
      .then(() => marketplaceInstance.setCourierContractAddress(courierInstance.address))
      // EscrowContract needs to know MarketplaceContract address
      .then(() => escrowInstance.setMarketplaceAddress(marketplaceInstance.address))
      // CourierContract needs to know MarketplaceContract and EscrowContract addresses
      .then(() => courierInstance.setMarketplaceAddress(marketplaceInstance.address))
      .then(() => courierInstance.setEscrowContractAddress(escrowInstance.address));
  });
};
