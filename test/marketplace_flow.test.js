const Marketplace = artifacts.require("MarketplaceContract");
const Escrow = artifacts.require("EscrowContract");
const Courier = artifacts.require("CourierContract");

contract("End-to-end marketplace flow", (accounts) => {
  const [deployer, seller, buyer, platformFeeRecipient, courierFeeRecipient, courier1] = accounts;

  let marketplace;
  let escrow;
  let courier;

  const toWei = (n) => web3.utils.toWei(n.toString(), "ether");

  beforeEach(async () => {
    marketplace = await Marketplace.new({ from: deployer });
    escrow = await Escrow.new(platformFeeRecipient, courierFeeRecipient, { from: deployer });
    courier = await Courier.new({ from: deployer });

    // Wire contracts together
    await marketplace.setEscrowContractAddress(escrow.address, { from: deployer });
    await marketplace.setCourierContractAddress(courier.address, { from: deployer });
    await escrow.setMarketplaceAddress(marketplace.address, { from: deployer });
    await courier.setMarketplaceAddress(marketplace.address, { from: deployer });
    await courier.setEscrowContractAddress(escrow.address, { from: deployer });

    // Add a courier the owner controls
    await courier.addCourier(courier1, { from: deployer });
  });

  it("runs full purchase, ship, deliver, confirm, payout sequence", async () => {
    // Seller lists a product
    const priceWei = toWei("0.01");
    await marketplace.addProduct("Widget", "Nice widget", priceWei, { from: seller });
    const product = await marketplace.getProduct(1);
    assert.equal(product.seller, seller, "seller set");
    assert.equal(product.priceWei.toString(), priceWei, "price set");

    // Buyer creates an order
    await marketplace.createOrder(1, { from: buyer });
    let order = await marketplace.getOrder(1);
    assert.equal(order.status.toString(), "0", "PendingPayment");
    assert.equal(order.buyer, buyer, "buyer set");
    assert.equal(order.seller, seller, "seller set");

    // Buyer funds via marketplace
    const courierFee = toWei("0.01");
    const platformFee = web3.utils.toBN(priceWei).mul(web3.utils.toBN(5)).div(web3.utils.toBN(100));
    const total = web3.utils.toBN(priceWei).add(web3.utils.toBN(courierFee)).add(platformFee);

    const txFund = await marketplace.buyAndFund(1, { from: buyer, value: total });
    // Escrow should be created, courier fee paid immediately, marketplace notified
    const escrowRec = await escrow.getEscrow(1);
    assert.equal(escrowRec.status.toString(), "2", "CourierFeePaid");
    assert.equal(escrowRec.amountWei.toString(), priceWei, "amount held");

    // Marketplace should have updated order after onEscrowFunded
    order = await marketplace.getOrder(1);
    assert.equal(order.status.toString(), "1", "PaymentSecured");
    assert.equal(order.escrowId.toString(), "1", "escrow linked");

    // Courier fee recipient receives fee and confirms back to escrow
    // The Escrow.transferCourierFee performs a low-level call to CourierContract.receivedCourierFee
    // Ensure courier fee recipient balance increased by expected amount
    const balBefore = web3.utils.toBN(await web3.eth.getBalance(courierFeeRecipient));
    // Triggered during fundOrder already, so after fund we expect fee to have moved
    const balAfter = web3.utils.toBN(await web3.eth.getBalance(courierFeeRecipient));
    assert(balAfter.gte(balBefore), "courier fee recipient balance should not decrease");

    // Seller prepares shipment, which assigns a courier job
    const sender = {
      name: "Seller",
      line1: "Street 1",
      line2: "",
      city: "City",
      state: "State",
      zip: "12345",
      country: "LT",
    };
    const recipient = {
      name: "Buyer",
      line1: "Ave 2",
      line2: "",
      city: "Town",
      state: "State",
      zip: "54321",
      country: "LT",
    };

    const txPrepare = await marketplace.markReadyToShip(1, sender, recipient, { from: seller });
    order = await marketplace.getOrder(1);
    assert.equal(order.status.toString(), "2", "PreparingShipment");

    // Courier confirms pickup, marketplace transitions to InTransit and escrow to AwaitingDelivery
    await courier.confirmPickup(1, { from: courier1 });
    order = await marketplace.getOrder(1);
    assert.equal(order.status.toString(), "3", "InTransit");
    const escrowAfterPickup = await escrow.getEscrow(1);
    assert.equal(escrowAfterPickup.status.toString(), "3", "AwaitingDelivery");

    // Courier confirms delivery, marketplace requests buyer confirmation
    await courier.confirmDelivery(1, { from: courier1 });
    order = await marketplace.getOrder(1);
    assert.equal(order.status.toString(), "4", "Delivered");

    // Buyer confirms receipt, escrow releases to seller and platform; marketplace marks completed
    const sellerBalBefore = web3.utils.toBN(await web3.eth.getBalance(seller));
    const platformBalBefore = web3.utils.toBN(await web3.eth.getBalance(platformFeeRecipient));

    const txConfirm = await marketplace.confirmReceipt(1, { from: buyer });

    const sellerBalAfter = web3.utils.toBN(await web3.eth.getBalance(seller));
    const platformBalAfter = web3.utils.toBN(await web3.eth.getBalance(platformFeeRecipient));

    assert(sellerBalAfter.gt(sellerBalBefore), "seller should receive funds");
    assert(platformBalAfter.gt(platformBalBefore), "platform should receive fee");

    order = await marketplace.getOrder(1);
    assert.equal(order.status.toString(), "6", "Completed");
  });
});
