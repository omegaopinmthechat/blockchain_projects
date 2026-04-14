const ganache = require("ganache");
const { Web3 } = require("web3");

function isIntegerType(solidityType) {
  return /^u?int(8|16|24|32|40|48|56|64|72|80|88|96|104|112|120|128|136|144|152|160|168|176|184|192|200|208|216|224|232|240|248|256)?$/.test(
    solidityType
  );
}

function isValidAddress(value) {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

function parseArrayInput(rawValue) {
  if (Array.isArray(rawValue)) {
    return rawValue;
  }

  if (typeof rawValue !== "string") {
    throw new Error("Array arguments must be sent as array or JSON string.");
  }

  const trimmed = rawValue.trim();
  if (!trimmed) {
    return [];
  }

  if (trimmed.startsWith("[")) {
    const parsed = JSON.parse(trimmed);
    if (!Array.isArray(parsed)) {
      throw new Error("Array JSON input is invalid.");
    }
    return parsed;
  }

  return trimmed
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function toFunctionSignature(abiFn) {
  return `${abiFn.name}(${(abiFn.inputs || []).map((input) => input.type).join(",")})`;
}

function parsePrimitiveValue(rawValue, solidityType) {
  if (solidityType === "string") {
    return String(rawValue ?? "");
  }

  if (solidityType === "address") {
    const value = String(rawValue || "").trim();
    if (!isValidAddress(value)) {
      throw new Error(`Invalid address value: ${value}`);
    }
    return value;
  }

  if (solidityType === "bool") {
    if (typeof rawValue === "boolean") {
      return rawValue;
    }

    const value = String(rawValue || "")
      .trim()
      .toLowerCase();

    if (["true", "1", "yes", "y"].includes(value)) {
      return true;
    }

    if (["false", "0", "no", "n"].includes(value)) {
      return false;
    }

    throw new Error(`Invalid bool value: ${rawValue}`);
  }

  if (isIntegerType(solidityType)) {
    if (typeof rawValue === "bigint") {
      if (solidityType.startsWith("uint") && rawValue < 0n) {
        throw new Error(`Unsigned integer cannot be negative: ${rawValue.toString()}`);
      }
      return rawValue.toString();
    }

    const value = String(rawValue ?? "").trim();
    if (!/^-?\d+$/.test(value)) {
      throw new Error(`Invalid integer value: ${rawValue}`);
    }
    if (solidityType.startsWith("uint") && value.startsWith("-")) {
      throw new Error(`Unsigned integer cannot be negative: ${rawValue}`);
    }
    return value;
  }

  if (solidityType.startsWith("bytes")) {
    const value = String(rawValue ?? "").trim();
    if (value.startsWith("0x")) {
      return value;
    }
    return Web3.utils.utf8ToHex(value);
  }

  return rawValue;
}

function coerceByType(rawValue, inputAbi) {
  const type = inputAbi?.type || "";
  const components = inputAbi?.components || [];

  const arrayMatch = type.match(/^(.*)\[(\d*)\]$/);
  if (arrayMatch) {
    const itemType = arrayMatch[1];
    const expectedLen = arrayMatch[2] ? Number(arrayMatch[2]) : null;
    const list = parseArrayInput(rawValue);

    if (expectedLen !== null && list.length !== expectedLen) {
      throw new Error(`Expected ${expectedLen} item(s) for ${type}, got ${list.length}.`);
    }

    const itemAbi = { type: itemType, components };
    return list.map((item) => coerceByType(item, itemAbi));
  }

  if (type === "tuple") {
    let tupleInput = rawValue;
    if (typeof rawValue === "string") {
      const trimmed = rawValue.trim();
      tupleInput = trimmed ? JSON.parse(trimmed) : [];
    }

    if (Array.isArray(tupleInput)) {
      return components.map((component, index) => coerceByType(tupleInput[index], component));
    }

    if (tupleInput && typeof tupleInput === "object") {
      return components.map((component) => coerceByType(tupleInput[component.name], component));
    }

    throw new Error("Tuple arguments must be array/object/JSON string.");
  }

  return parsePrimitiveValue(rawValue, type);
}

function normalizeArgs(rawArgs, abiInputs = []) {
  if (!Array.isArray(rawArgs)) {
    throw new Error("Arguments must be sent as an array.");
  }

  if (rawArgs.length !== abiInputs.length) {
    throw new Error(`Expected ${abiInputs.length} argument(s), got ${rawArgs.length}.`);
  }

  return abiInputs.map((input, index) => coerceByType(rawArgs[index], input));
}

function toSerializable(value) {
  if (typeof value === "bigint") {
    return value.toString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => toSerializable(item));
  }

  if (value && typeof value === "object") {
    const named = {};
    const numericKeys = [];

    for (const [key, item] of Object.entries(value)) {
      if (/^\d+$/.test(key)) {
        numericKeys.push(key);
      } else {
        named[key] = toSerializable(item);
      }
    }

    if (Object.keys(named).length > 0) {
      return named;
    }

    return numericKeys
      .sort((a, b) => Number(a) - Number(b))
      .map((key) => toSerializable(value[key]));
  }

  return value;
}

function normalizeLegacyReceiptEvents(receipt) {
  const rawEvents = receipt?.events;
  if (!rawEvents) {
    return [];
  }

  const eventEntries = Array.isArray(rawEvents)
    ? rawEvents.map((item, index) => [String(index), item])
    : Object.entries(rawEvents);

  const normalized = [];

  for (const [entryKey, eventValue] of eventEntries) {
    const items = Array.isArray(eventValue) ? eventValue : [eventValue];

    for (const item of items) {
      if (!item || typeof item !== "object") {
        continue;
      }

      const eventName = item.event || entryKey || "UnknownEvent";

      normalized.push({
        event: eventName,
        signature: item.signature || null,
        returnValues: toSerializable(item.returnValues || {}),
        logIndex:
          item.logIndex === undefined || item.logIndex === null
            ? null
            : Number(item.logIndex),
      });
    }
  }

  return normalized.sort((a, b) => {
    if (a.logIndex === null && b.logIndex === null) {
      return 0;
    }
    if (a.logIndex === null) {
      return 1;
    }
    if (b.logIndex === null) {
      return -1;
    }
    return a.logIndex - b.logIndex;
  });
}

function buildEventTopicLookup(contract) {
  const eventEntries = (contract?.options?.jsonInterface || []).filter(
    (entry) => entry.type === "event"
  );

  const lookup = new Map();

  for (const eventAbi of eventEntries) {
    const signatureText = `${eventAbi.name}(${(eventAbi.inputs || [])
      .map((input) => input.type)
      .join(",")})`;
    const topic = Web3.utils.sha3(signatureText);

    if (topic) {
      lookup.set(topic.toLowerCase(), eventAbi);
    }
  }

  return lookup;
}

function decodeReceiptLogs(receipt, contract, web3) {
  const logs = Array.isArray(receipt?.logs) ? receipt.logs : [];
  if (logs.length === 0) {
    return [];
  }

  const topicLookup = buildEventTopicLookup(contract);
  const decodedEvents = [];

  for (let index = 0; index < logs.length; index += 1) {
    const log = logs[index] || {};
    const topics = Array.isArray(log.topics) ? log.topics : [];
    const topic0 = typeof topics[0] === "string" ? topics[0].toLowerCase() : null;
    const eventAbi = topic0 ? topicLookup.get(topic0) : null;

    if (!eventAbi) {
      decodedEvents.push({
        event: "UnknownEvent",
        signature: topic0,
        returnValues: {},
        logIndex:
          log.logIndex === undefined || log.logIndex === null ? index : Number(log.logIndex),
      });
      continue;
    }

    try {
      const decodeTopics = eventAbi.anonymous ? topics : topics.slice(1);
      const decoded = web3.eth.abi.decodeLog(eventAbi.inputs || [], log.data || "0x", decodeTopics);

      const returnValues = {};
      (eventAbi.inputs || []).forEach((input, inputIndex) => {
        const preferredKey = input.name && input.name.length > 0 ? input.name : String(inputIndex);
        const fallbackKey = String(inputIndex);
        const rawValue = decoded[preferredKey] !== undefined ? decoded[preferredKey] : decoded[fallbackKey];
        const outputKey = input.name && input.name.length > 0 ? input.name : `arg${inputIndex}`;
        returnValues[outputKey] = toSerializable(rawValue);
      });

      decodedEvents.push({
        event: eventAbi.name,
        signature: topic0,
        returnValues,
        logIndex:
          log.logIndex === undefined || log.logIndex === null ? index : Number(log.logIndex),
      });
    } catch (_err) {
      decodedEvents.push({
        event: eventAbi.name,
        signature: topic0,
        returnValues: {},
        logIndex:
          log.logIndex === undefined || log.logIndex === null ? index : Number(log.logIndex),
      });
    }
  }

  return decodedEvents.sort((a, b) => a.logIndex - b.logIndex);
}

function normalizeReceiptEvents(receipt, contract, web3) {
  const decodedFromLogs = decodeReceiptLogs(receipt, contract, web3);
  if (decodedFromLogs.length > 0) {
    return decodedFromLogs;
  }

  return normalizeLegacyReceiptEvents(receipt);
}

function resolveFunctionAbi(contract, functionName, args = []) {
  const abiFunctions = contract.options.jsonInterface?.filter(
    (entry) => entry.type === "function"
  );

  const requested = (functionName || "").trim();
  if (!requested) {
    throw new Error("Function name is required.");
  }

  // Support overload-safe selectors such as transfer(address,uint256)
  if (requested.includes("(") && requested.endsWith(")")) {
    const bySignature = abiFunctions.find((entry) => toFunctionSignature(entry) === requested);
    if (!bySignature) {
      throw new Error(`Function signature \"${requested}\" not found in ABI.`);
    }
    return bySignature;
  }

  const byName = abiFunctions.filter((entry) => entry.name === requested);

  if (byName.length === 0) {
    throw new Error(`Function \"${requested}\" not found in ABI.`);
  }

  if (byName.length === 1) {
    return byName[0];
  }

  const byArgCount = byName.filter((entry) => (entry.inputs || []).length === args.length);
  if (byArgCount.length === 1) {
    return byArgCount[0];
  }

  throw new Error(
    `Function \"${requested}\" is overloaded. Use full signature: ${byName
      .map((entry) => toFunctionSignature(entry))
      .join(" | ")}`
  );
}

/**
 * Deploys a contract to an in-memory Ganache instance
 * and optionally calls a function on it.
 *
 * @param {string} bytecode
 * @param {Array}  abi
 * @param {Array}  constructorArgs  - arguments for constructor
 * @returns {{ success, contractAddress, deployTxHash, deployer, balance, logs }}
 */
async function deployContract(bytecode, abi, constructorArgs = []) {
  // Spin up a fresh in-memory EVM every time
  const provider = ganache.provider({
    chain: {
      hardfork: "shanghai",
    },
    logging: { quiet: true },
    wallet: {
      totalAccounts: 5,
      defaultBalance: 1000, // each account gets 1000 ETH (fake)
    },
  });

  const web3 = new Web3(provider);
  const accounts = await web3.eth.getAccounts();
  const deployer = accounts[0];

  const contract = new web3.eth.Contract(abi);

  let normalizedConstructorArgs;
  try {
    const constructorAbi = abi.find((entry) => entry.type === "constructor");
    normalizedConstructorArgs = normalizeArgs(constructorArgs, constructorAbi?.inputs || []);
  } catch (err) {
    await provider.disconnect();
    return {
      success: false,
      error: `Constructor arguments are invalid: ${err.message}`,
    };
  }

  let deployTx;
  try {
    deployTx = await contract
      .deploy({ data: bytecode, arguments: normalizedConstructorArgs })
      .send({ from: deployer, gas: 5_000_000 });
  } catch (err) {
    await provider.disconnect();
    return {
      success: false,
      error: `Deployment failed: ${err.message}`,
    };
  }

  const contractAddress = deployTx.options.address;
  const balance = await web3.eth.getBalance(deployer);

  return {
    success: true,
    contractAddress,
    deployer,
    balance: web3.utils.fromWei(balance, "ether") + " ETH",
    accounts,
    web3,       // caller can reuse this for function calls
    contract: deployTx,
    provider,   // caller must disconnect when done
  };
}

/**
 * Calls a single function on a deployed contract.
 *
 * @param {object} deployResult  - result from deployContract()
 * @param {string} functionName
 * @param {Array}  args
 * @param {string} sender        - address to send from
 * @param {string} value         - ETH to send (in wei), default "0"
 * @returns {{ success, result, gasUsed, error }}
 */
async function callFunction(deployResult, functionName, args = [], sender, value = "0") {
  const { web3, contract } = deployResult;
  const from = sender || deployResult.deployer;

  let abiFn;
  try {
    abiFn = resolveFunctionAbi(contract, functionName, args);
  } catch (err) {
    return { success: false, error: err.message };
  }

  let normalizedArgs;
  try {
    normalizedArgs = normalizeArgs(args, abiFn.inputs || []);
  } catch (err) {
    return { success: false, error: `Invalid function arguments: ${err.message}` };
  }

  const fnSignature = toFunctionSignature(abiFn);
  const method = contract.methods[fnSignature](...normalizedArgs);

  const isReadOnly =
    abiFn.stateMutability === "view" || abiFn.stateMutability === "pure";

  try {
    if (isReadOnly) {
      const result = await method.call({ from });
      return {
        success: true,
        result: toSerializable(result),
        gasUsed: null,
        functionSignature: fnSignature,
        type: "call",
      };
    } else {
      const receipt = await method.send({
        from,
        gas: 3_000_000,
        value,
      });

      const events = normalizeReceiptEvents(receipt, contract, web3);

      return {
        success: true,
        result: null,
        gasUsed: String(receipt.gasUsed),
        txHash: receipt.transactionHash,
        functionSignature: fnSignature,
        type: "transaction",
        events,
      };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

module.exports = { deployContract, callFunction };
