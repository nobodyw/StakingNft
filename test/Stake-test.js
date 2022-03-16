const { expect } = require("chai");
const { ethers } = require("hardhat");
const Assert = require('assert');
const { BigNumber, Contract } = require("ethers");
const { expectRevert } = require('@openzeppelin/test-helpers');

describe("Test Contract StakeNft.sol", function () {

  context("Stake ERC721 and Withdraw",function(){
    beforeEach(async function(){
      ///deploy Custom nft (ERC721)
      Customnft = await ethers.getContractFactory("Customnft");
      customnft = await Customnft.deploy();
      ///deploy StakeNft (Contract Staking + _mint ERC20 Customtoken.sol)
      StakeNft = await ethers.getContractFactory("StakeNft");
      stakenft = await StakeNft.deploy(customnft.address);

      [owner, user1] = await ethers.getSigners();
      ///create 1 nft for owner and 2 nft for user1
      await customnft.connect(owner).createItem("URI DATA");
      await customnft.connect(user1).createItem("URI DATA");
      await customnft.connect(user1).createItem("URI DATA");
      await customnft.connect(user1).createItem("URI DATA");
      ///customNft approve new item in StakeNft Contract
      await customnft.connect(owner).approve(stakenft.address,1);
      await customnft.connect(user1).approve(stakenft.address,2);
      await customnft.connect(user1).approve(stakenft.address,3);
      await customnft.connect(user1).approve(stakenft.address,4);
      ///Stake the new item in StakeNft Contract
      await stakenft.connect(owner).stake(1);
      await stakenft.connect(user1).stake(2);
      await stakenft.connect(user1).stake(3);
      await stakenft.connect(user1).stake(4);
    });
      /* ========== TEST FUNCTION stake ========== */
    it("Function stake: Check if the owner of the ERC721 has been changed", async function(){
      Assert.equal(
        await customnft.ownerOf(1),
        stakenft.address,
        "The nft was not sent to the staking contract");
    });
    it("Function stake: Check if getBalance of owner return 1", async function(){
      Assert.equal(
        await stakenft.getBalance(),
        ethers.utils.formatUnits(1,0),
        "The balance is incorrect");
    });
    it("Function stake: Check Data Event Staked", async function(){
      const eventFilter = stakenft.filters.Staked();
      const event = await stakenft.queryFilter(eventFilter);
      const eventData = event[0].args;

      Assert.equal(
        eventData._ownerOfItem,
        owner.address,
        "the previous owner should be Owner"
      );
      Assert.equal(
        eventData._tokenId,
        ethers.utils.formatUnits(1,0),
        "The tokenId should be one"
      );
      Assert.equal(
        eventData._totalSupply,
        ethers.utils.formatUnits(1,0),
        "TotalSupply should be one"
      );
    });
      /* ========== TEST FUNCTION withdraw ========== */
    it("Function withdraw: Check balance after withdraw one element", async function(){
      //withdraw first element of array in _balances[msg.senders]
      await stakenft.connect(user1).withdraw(1);
      Assert.equal(
        await stakenft.connect(user1).getBalance(),
        ethers.utils.formatUnits(2,0),
        'The balance should be 2 (3-1 = 2)'
      );
    });
    it("Function withdraw: Check address of ERC721 after withdraw", async function(){
      await stakenft.connect(user1).withdraw(1);
      Assert.equal(
        await customnft.connect(user1).ownerOf(2),
        user1.address,
        'The ERC721 should be at user1'
      );
    });
    it("Function withdraw: check reset initialTimeOfEntry", async function(){
      await stakenft.connect(user1).withdraw(1);
      await stakenft.connect(user1).withdraw(1);
      await stakenft.connect(user1).withdraw(1);

      const eventFilter = stakenft.filters.Withdraw();
      const event = await stakenft.queryFilter(eventFilter);
      const eventData = event[2].args;
      Assert.equal(
        eventData._stakingTime,
        ethers.utils.formatUnits(0,0),
        'stakingTime should be initialised 0'
      );
    });
    it("Function withdraw: Check Data Event Withdraw", async function(){
      await stakenft.connect(user1).withdraw(1);
      const eventFilter = stakenft.filters.Withdraw();
      const event = await stakenft.queryFilter(eventFilter);
      const eventData = event[0].args;
      Assert.equal(
        eventData._ownerOfItem,
        user1.address,
        'ownerOfItem Should be user1 address'
      );
      Assert.equal(
        eventData._numberNft,
        ethers.utils.formatUnits(0,0),
        'numberNft Should be 0'
      );
      Assert.equal(
        eventData.__totalSupply,
        ethers.utils.formatUnits(3,0),
        'totalSupply Should be 3'
      );
    });
      /* ========== TEST FUNCTION withdrawByTokenId ========== */
      it("Function withdrawByTokenId: Check balance after withdraw one element", async function(){
        //withdraw element with tokenId is 2
        await stakenft.connect(user1).withdrawByTokenId(2);
        Assert.equal(
          await stakenft.connect(user1).getBalance(),
          ethers.utils.formatUnits(2,0),
          'The balance should be 2 (3-1 = 2)'
        );
      });
      it("Function withdrawByTokenId: Check address of ERC721 after withdraw", async function(){
        await stakenft.connect(user1).withdrawByTokenId(2);
        Assert.equal(
          await customnft.connect(user1).ownerOf(2),
          user1.address,
          'The ERC721 should be at user1'
        );
      });
      it("Function withdrawByTokenId: check reset initialTimeOfEntry", async function(){
        await stakenft.connect(user1).withdrawByTokenId(2);
        await stakenft.connect(user1).withdrawByTokenId(3);
        await stakenft.connect(user1).withdrawByTokenId(4);
  
        const eventFilter = stakenft.filters.WithdrawByTokenId();
        const event = await stakenft.queryFilter(eventFilter);
        const eventData = event[2].args;
        Assert.equal(
          eventData._stakingTime,
          ethers.utils.formatUnits(0,0),
          'stakingTime should be initialised 0'
        );
      });
      it("Function withdrawByTokenId: Check Data Event Withdraw", async function(){
        await stakenft.connect(user1).withdrawByTokenId(2);
        const eventFilter = stakenft.filters.WithdrawByTokenId();
        const event = await stakenft.queryFilter(eventFilter);
        const eventData = event[0].args;
        Assert.equal(
          eventData._ownerOfItem,
          user1.address,
          'ownerOfItem Should be user1 address'
        );
        Assert.equal(
          eventData._tokenId,
          ethers.utils.formatUnits(2,0),
          'numberNft Should be 0'
        );
        Assert.equal(
          eventData.__totalSupply,
          ethers.utils.formatUnits(3,0),
          'totalSupply Should be 3'
        );
      });
      /* ========== TEST FUNCTION withdrawAll ========== */
      it("Function withdrawAll: Check balance after withdrawAll", async function(){
        await stakenft.connect(user1).withdrawAll();
        console.log(await stakenft.connect(user1).getBalance());
        Assert.equal(
          await stakenft.connect(user1).getBalance(),
          ethers.utils.formatUnits(0,0),
          'The balance should be 0'
        )
      });
      /* ========== TEST FUNCTION getReward ========== */
      it("Function getReward", async function(){
        await expectRevert(stakenft.connect(owner).getReward(),"You must wait a month before withdrawing your winnings");
      });
  });
});


  // context("Test stake function",function(){
  //   beforeEach(async function(){
  //       ///deploy Custom nft (ERC721)
  //       Customnft = await ethers.getContractFactory("Customnft");
  //       customnft = await Customnft.deploy();
  //       ///deploy StakeNft (Contract Staking + _mint ERC20 Customtoken.sol)
  //       StakeNft = await ethers.getContractFactory("StakeNft");
  //       stakenft = await StakeNft.deploy(customnft.address);
        
  //       [owner,user1] = await ethers.getSigners();
  //       ///create 2 nft for owner and 2 for user1
  //       await customnft.connect(owner).createItem("MyTOKENURI");
  //       await customnft.connect(owner).createItem("MyTOKENURI");
  //       await customnft.connect(user1).createItem("MyTOKENURI");
  //       await customnft.connect(user1).createItem("MyTOKENURI");


  //       ///get tokenId in events
  //       // const eventFilter = customnft.filters.newItem();
  //       // const events = await customnft.queryFilter(eventFilter);
  //       // const stakeNftUser1 = await stakenft.connect(user1).stake(events[1].args._tokenId);

  //       ///approve and stake nft in stakenft Contract
  //       await customnft.connect(owner).approve(stakenft.address,1);
  //       await customnft.connect(owner).approve(stakenft.address,2);
  //       await customnft.connect(user1).approve(stakenft.address,3);
  //       await customnft.connect(user1).approve(stakenft.address,4);

  //       await stakenft.connect(owner).stake(1);
  //       await stakenft.connect(owner).stake(2);
  //       await stakenft.connect(user1).stake(3);
  //       await stakenft.connect(user1).stake(4);

  //       console.log(
  //         await stakenft.connect(owner).earned(owner.address),
  //         await stakenft.connect(user1).earned(user1.address),
  //         );
  //         await network.provider.send("evm_increaseTime", [2419200]);
  //         await stakenft.connect(owner).getReward();
  //       console.log(
  //         await stakenft.balanceOf(stakenft.address),
  //         await stakenft.balanceOf(owner.address)
  //         );

  //   });

  //   it("transferNFT", async function(){

  //   });
  // });

