import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function loadContractABI(contractName) {
  try {
    const abiPath = join(__dirname, '../../contracts', `${contractName}.json`);
    const abiFile = JSON.parse(readFileSync(abiPath, 'utf-8'));
    
    if (abiFile.abi && abiFile.abi.length > 0) {
      return abiFile.abi;
    }
  } catch (error) {
    console.warn(`Could not load ABI for ${contractName} from file, using minimal ABI`);
  }

  return getMinimalABI(contractName);
}

function getMinimalABI(contractName) {
  const minimalABIs = {
    MarketplaceContract: [
      {
        inputs: [{ name: 'title', type: 'string' }, { name: 'description', type: 'string' }, { name: 'priceWei', type: 'uint256' }],
        name: 'addProduct',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
      },
      {
        inputs: [{ name: 'productId', type: 'uint256' }],
        name: 'getProduct',
        outputs: [{ components: [{ name: 'id', type: 'uint256' }, { name: 'seller', type: 'address' }, { name: 'title', type: 'string' }, { name: 'description', type: 'string' }, { name: 'priceWei', type: 'uint256' }, { name: 'isActive', type: 'bool' }, { name: 'createdAt', type: 'uint256' }], name: '', type: 'tuple' }],
        stateMutability: 'view',
        type: 'function'
      },
      {
        inputs: [{ name: 'productId', type: 'uint256' }],
        name: 'createOrder',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
      },
      {
        inputs: [{ name: 'orderId', type: 'uint256' }],
        name: 'getOrder',
        outputs: [{ components: [{ name: 'id', type: 'uint256' }, { name: 'productId', type: 'uint256' }, { name: 'buyer', type: 'address' }, { name: 'seller', type: 'address' }, { name: 'escrowId', type: 'uint256' }, { name: 'courierJobId', type: 'uint256' }, { name: 'status', type: 'uint8' }, { name: 'createdAt', type: 'uint256' }], name: '', type: 'tuple' }],
        stateMutability: 'view',
        type: 'function'
      },
      {
        inputs: [{ name: 'orderId', type: 'uint256' }],
        name: 'buyAndFund',
        outputs: [],
        stateMutability: 'payable',
        type: 'function'
      },
      {
        inputs: [{ name: 'orderId', type: 'uint256' }, { components: [{ name: 'name', type: 'string' }, { name: 'line1', type: 'string' }, { name: 'line2', type: 'string' }, { name: 'city', type: 'string' }, { name: 'state', type: 'string' }, { name: 'zip', type: 'string' }, { name: 'country', type: 'string' }], name: 'sender', type: 'tuple' }, { components: [{ name: 'name', type: 'string' }, { name: 'line1', type: 'string' }, { name: 'line2', type: 'string' }, { name: 'city', type: 'string' }, { name: 'state', type: 'string' }, { name: 'zip', type: 'string' }, { name: 'country', type: 'string' }], name: 'recipient', type: 'tuple' }],
        name: 'markReadyToShip',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
      },
      {
        inputs: [{ name: 'orderId', type: 'uint256' }],
        name: 'confirmReceipt',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
      },
      {
        anonymous: false,
        inputs: [{ indexed: true, name: 'productId', type: 'uint256' }, { indexed: true, name: 'seller', type: 'address' }, { indexed: false, name: 'title', type: 'string' }, { indexed: false, name: 'priceWei', type: 'uint256' }],
        name: 'ProductAdded',
        type: 'event'
      },
      {
        anonymous: false,
        inputs: [{ indexed: true, name: 'orderId', type: 'uint256' }, { indexed: true, name: 'productId', type: 'uint256' }, { indexed: true, name: 'buyer', type: 'address' }, { indexed: false, name: 'seller', type: 'address' }],
        name: 'OrderCreated',
        type: 'event'
      },
      {
        anonymous: false,
        inputs: [{ indexed: true, name: 'orderId', type: 'uint256' }, { indexed: true, name: 'escrowId', type: 'uint256' }],
        name: 'EscrowFunded',
        type: 'event'
      },
      {
        anonymous: false,
        inputs: [{ indexed: true, name: 'orderId', type: 'uint256' }],
        name: 'ShipmentPrepared',
        type: 'event'
      },
      {
        anonymous: false,
        inputs: [{ indexed: true, name: 'buyer', type: 'address' }, { indexed: true, name: 'orderId', type: 'uint256' }],
        name: 'ShipmentInTransit',
        type: 'event'
      },
      {
        anonymous: false,
        inputs: [{ indexed: true, name: 'buyer', type: 'address' }, { indexed: true, name: 'orderId', type: 'uint256' }],
        name: 'requestConfirmation',
        type: 'event'
      },
      {
        anonymous: false,
        inputs: [{ indexed: true, name: 'seller', type: 'address' }, { indexed: true, name: 'orderId', type: 'uint256' }],
        name: 'FundsReleased',
        type: 'event'
      },
      {
        anonymous: false,
        inputs: [{ indexed: true, name: 'buyer', type: 'address' }, { indexed: true, name: 'orderId', type: 'uint256' }],
        name: 'TransactionCompleted',
        type: 'event'
      }
    ],
    EscrowContract: [
      {
        inputs: [{ name: 'orderId', type: 'uint256' }, { name: 'buyer', type: 'address' }, { name: 'seller', type: 'address' }, { name: 'priceWei', type: 'uint256' }, { name: 'courierFeeWei', type: 'uint256' }, { name: 'platformFeeWei', type: 'uint256' }],
        name: 'fundOrder',
        outputs: [],
        stateMutability: 'payable',
        type: 'function'
      },
      {
        inputs: [{ name: 'escrowId', type: 'uint256' }],
        name: 'getEscrow',
        outputs: [{ components: [{ name: 'id', type: 'uint256' }, { name: 'buyer', type: 'address' }, { name: 'seller', type: 'address' }, { name: 'orderId', type: 'uint256' }, { name: 'amountWei', type: 'uint256' }, { name: 'courierFeeWei', type: 'uint256' }, { name: 'platformFeeWei', type: 'uint256' }, { name: 'fundsSecured', type: 'bool' }, { name: 'courierFeeTransferred', type: 'bool' }, { name: 'releasedToSeller', type: 'bool' }, { name: 'status', type: 'uint8' }, { name: 'createdAt', type: 'uint256' }, { name: 'closedAt', type: 'uint256' }], name: '', type: 'tuple' }],
        stateMutability: 'view',
        type: 'function'
      },
      {
        inputs: [{ name: 'escrowId', type: 'uint256' }],
        name: 'onAwaitingDelivery',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
      },
      {
        inputs: [{ name: 'escrowId', type: 'uint256' }],
        name: 'releaseFundsToSeller',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
      },
      {
        anonymous: false,
        inputs: [{ indexed: true, name: 'orderId', type: 'uint256' }, { indexed: true, name: 'escrowId', type: 'uint256' }, { indexed: false, name: 'amountWei', type: 'uint256' }],
        name: 'CourierFeeConfirmed',
        type: 'event'
      }
    ],
    CourierContract: [
      {
        inputs: [{ name: 'orderId', type: 'uint256' }, { components: [{ name: 'name', type: 'string' }, { name: 'line1', type: 'string' }, { name: 'line2', type: 'string' }, { name: 'city', type: 'string' }, { name: 'state', type: 'string' }, { name: 'postalCode', type: 'string' }, { name: 'country', type: 'string' }], name: 'pickup', type: 'tuple' }, { components: [{ name: 'name', type: 'string' }, { name: 'line1', type: 'string' }, { name: 'line2', type: 'string' }, { name: 'city', type: 'string' }, { name: 'state', type: 'string' }, { name: 'postalCode', type: 'string' }, { name: 'country', type: 'string' }], name: 'dropoff', type: 'tuple' }],
        name: 'requestPickup',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
      },
      {
        inputs: [{ name: 'shipmentId', type: 'uint256' }],
        name: 'confirmPickup',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
      },
      {
        inputs: [{ name: 'shipmentId', type: 'uint256' }],
        name: 'confirmDelivery',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
      },
      {
        inputs: [{ name: 'shipmentId', type: 'uint256' }],
        name: 'shipmentById',
        outputs: [{ components: [{ name: 'id', type: 'uint256' }, { name: 'orderId', type: 'uint256' }, { name: 'courier', type: 'address' }, { components: [{ name: 'name', type: 'string' }, { name: 'line1', type: 'string' }, { name: 'line2', type: 'string' }, { name: 'city', type: 'string' }, { name: 'state', type: 'string' }, { name: 'postalCode', type: 'string' }, { name: 'country', type: 'string' }], name: 'pickup', type: 'tuple' }, { components: [{ name: 'name', type: 'string' }, { name: 'line1', type: 'string' }, { name: 'line2', type: 'string' }, { name: 'city', type: 'string' }, { name: 'state', type: 'string' }, { name: 'postalCode', type: 'string' }, { name: 'country', type: 'string' }], name: 'dropoff', type: 'tuple' }, { name: 'trackingNumber', type: 'uint256' }, { name: 'status', type: 'uint8' }, { name: 'createdAt', type: 'uint256' }, { name: 'pickedUpAt', type: 'uint256' }, { name: 'deliveredAt', type: 'uint256' }], name: '', type: 'tuple' }],
        stateMutability: 'view',
        type: 'function'
      },
      {
        anonymous: false,
        inputs: [{ components: [{ name: 'id', type: 'uint256' }, { name: 'orderId', type: 'uint256' }, { name: 'courier', type: 'address' }, { components: [{ name: 'name', type: 'string' }, { name: 'line1', type: 'string' }, { name: 'line2', type: 'string' }, { name: 'city', type: 'string' }, { name: 'state', type: 'string' }, { name: 'postalCode', type: 'string' }, { name: 'country', type: 'string' }], name: 'pickup', type: 'tuple' }, { components: [{ name: 'name', type: 'string' }, { name: 'line1', type: 'string' }, { name: 'line2', type: 'string' }, { name: 'city', type: 'string' }, { name: 'state', type: 'string' }, { name: 'postalCode', type: 'string' }, { name: 'country', type: 'string' }], name: 'dropoff', type: 'tuple' }, { name: 'trackingNumber', type: 'uint256' }, { name: 'status', type: 'uint8' }, { name: 'createdAt', type: 'uint256' }, { name: 'pickedUpAt', type: 'uint256' }, { name: 'deliveredAt', type: 'uint256' }], name: 'shipment', type: 'tuple' }, { indexed: true, name: 'courier', type: 'address' }],
        name: 'AssignedShipment',
        type: 'event'
      },
      {
        anonymous: false,
        inputs: [{ indexed: false, name: 'orderId', type: 'uint256' }, { indexed: false, name: 'escrowId', type: 'uint256' }, { indexed: false, name: 'amountWei', type: 'uint256' }],
        name: 'CourierFeeReceived',
        type: 'event'
      }
    ]
  };

  return minimalABIs[contractName] || [];
}
