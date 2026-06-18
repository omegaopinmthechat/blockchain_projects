"use strict";

const { Contract } = require("fabric-contract-api");

class BasicContract extends Contract {

  async InitLedger(ctx) {
    const assets = [
      { ID: "asset1", Color: "blue", Size: 5, Owner: "Alice", Value: 300 },
      { ID: "asset2", Color: "red", Size: 5, Owner: "Bob", Value: 400 },
      { ID: "asset3", Color: "green", Size: 10, Owner: "Carol", Value: 500 },
      { ID: "asset4", Color: "yellow", Size: 10, Owner: "Dave", Value: 600 },
    ];

    for (const asset of assets) {
      await ctx.stub.putState(asset.ID, Buffer.from(JSON.stringify(asset)));
      console.log(`Initialized asset: ${asset.ID}`);
    }
  }


  async CreateAsset(ctx, id, color, size, owner, value) {
    const exists = await this._assetExists(ctx, id);
    if (exists) {
      throw new Error(`Asset ${id} already exists`);
    }

    const asset = {
      ID: id,
      Color: color,
      Size: parseInt(size),
      Owner: owner,
      Value: parseInt(value),
    };

    await ctx.stub.putState(id, Buffer.from(JSON.stringify(asset)));
    return JSON.stringify(asset);
  }


  async ReadAsset(ctx, id) {
    const assetJSON = await ctx.stub.getState(id);
    if (!assetJSON || assetJSON.length === 0) {
      throw new Error(`Asset ${id} does not exist`);
    }
    return assetJSON.toString();
  }


  async UpdateAsset(ctx, id, color, size, owner, value) {
    const exists = await this._assetExists(ctx, id);
    if (!exists) {
      throw new Error(`Asset ${id} does not exist`);
    }

    const updated = {
      ID: id,
      Color: color,
      Size: parseInt(size),
      Owner: owner,
      Value: parseInt(value),
    };

    await ctx.stub.putState(id, Buffer.from(JSON.stringify(updated)));
    return JSON.stringify(updated);
  }


  async DeleteAsset(ctx, id) {
    const exists = await this._assetExists(ctx, id);
    if (!exists) {
      throw new Error(`Asset ${id} does not exist`);
    }
    await ctx.stub.deleteState(id);
  }


  async TransferAsset(ctx, id, newOwner) {
    const assetJSON = await ctx.stub.getState(id);
    if (!assetJSON || assetJSON.length === 0) {
      throw new Error(`Asset ${id} does not exist`);
    }

    const asset = JSON.parse(assetJSON.toString());
    const oldOwner = asset.Owner;
    asset.Owner = newOwner;

    await ctx.stub.putState(id, Buffer.from(JSON.stringify(asset)));
    return oldOwner; // return previous owner
  }


  async GetAllAssets(ctx) {
    const results = [];
    const iterator = await ctx.stub.getStateByRange("", "");

    let result = await iterator.next();
    while (!result.done) {
      const value = result.value.value.toString("utf8");
      try {
        results.push(JSON.parse(value));
      } catch {
        console.error(`Failed to parse asset: ${value}`);
      }
      result = await iterator.next();
    }

    return JSON.stringify(results);
  }


  async GetAssetHistory(ctx, id) {
    const results = [];
    const iterator = await ctx.stub.getHistoryForKey(id);

    let result = await iterator.next();
    while (!result.done) {
      const record = {
        txId: result.value.txId,
        timestamp: result.value.timestamp,
        isDelete: result.value.isDelete,
        value: result.value.value.toString("utf8"),
      };
      results.push(record);
      result = await iterator.next();
    }

    return JSON.stringify(results);
  }


  async _assetExists(ctx, id) {
    const assetJSON = await ctx.stub.getState(id);
    return assetJSON && assetJSON.length > 0;
  }
}

module.exports = BasicContract;
