const { ethers } = require("hardhat");
const Assert = require('assert');

describe("Test deploy contracts (StakeNft 'initERC20' and Customnft ERC721)", function () {
  context("deploy contract StakeNft",function(){
    beforeEach(async function(){
      [owner] = await ethers.getSigners();
      Customnft = await ethers.getContractFactory("Customnft");
      customnft = await Customnft.connect(owner).deploy();

      StakeNft = await ethers.getContractFactory("StakeNft");
      stakenft = await StakeNft.deploy(customnft.address);
    });

    it("The initialSupply of StakeNft Should return 1000 on 18 decimals", async function(){
      const supplyToken = await stakenft.balanceOf(stakenft.address);

      Assert.equal(
        ethers.utils.formatUnits(supplyToken,18),
        1000,
        'Supply token of Customtoken not return 1000');
    });
  });

  context("deploy contract Customnft ERC721 and Owner of contract mint 1 Item ERC721", function(){
    beforeEach(async function(){
      [owner] = await ethers.getSigners();
      Customnft = await ethers.getContractFactory("Customnft");
      customnft = await Customnft.connect(owner).deploy();
    });

    it("shoud return one item for owner",async function(){
      await customnft.connect(owner).createItem("URI DATA");
      const balanceOwner = await customnft.connect(owner).balanceOf(owner.address);
      Assert.equal(
        ethers.utils.formatUnits(balanceOwner,0),
        1,
        'Balance Of Owner should be return 1'
      );
    });
  });
});
