const CourierContract = artifacts.require("CourierContract");

module.exports = function (deployer) {
  deployer.deploy(CourierContract);
};