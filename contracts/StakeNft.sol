// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "./Customtoken.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "hardhat/console.sol";

contract StakeNft is IERC721Receiver, ReentrancyGuard{

    Customtoken public deployedToken;
    IERC721 public nft;

    uint public rewardsRate = 100;
    uint public lastUpdateTime;
    uint public rewardPerNftStored;

    mapping(address => uint) public userRewardPerNftPaid;
    mapping(address => uint) public rewards;

    uint private _totalSupply;
    mapping(address => uint[]) private _balances;
    mapping(address => uint) private initialTimeOfEntry;

    constructor(IERC721 _nft){
        nft = _nft;
        deployedToken = new Customtoken();
    }

    /**
     * @dev allows to deposit erc721 in this contract
     */
     function onERC721Received(address, address, uint256, bytes memory) public virtual override returns (bytes4) {
        return this.onERC721Received.selector;
    }

    /* ========== FUNCTIONS SET VALUE ========== */

    /**
     * @dev Add an ERC721 in the contract via tokenID, save timestamp of user.
     * @param _tokenId this is the identifier of the ERC721
     */
    function stake(uint256 _tokenId) external updateReward(msg.sender) nonReentrant{
        _totalSupply = _totalSupply + 1;
        _balances[msg.sender].push(_tokenId);
        nft.safeTransferFrom(msg.sender, address(this), _tokenId);
        ///Add a timestamp only if this is the first time the account stakes
        if(initialTimeOfEntry[msg.sender] == 0){
            initialTimeOfEntry[msg.sender] = block.timestamp;
        }
        emit Staked(msg.sender, _tokenId, initialTimeOfEntry[msg.sender], _totalSupply);
    }

    /**
     * @dev Allows you to withdraw an ERC721 from the contract, by passing the number of the nft that you have deposited
     * @param _numberNft _numberNft is the order number in which you filed your NFT
     */
    function withdraw(uint256 _numberNft) public updateReward(msg.sender) nonReentrant{
        _numberNft = _numberNft -1;
        _totalSupply = _totalSupply -1;
        nft.safeTransferFrom(address(this), msg.sender, _balances[msg.sender][_numberNft]);
        _balances[msg.sender][_numberNft] = _balances[msg.sender][_balances[msg.sender].length - 1];
        _balances[msg.sender].pop();
        ///If the user has removed all these nfts, resets initialTimeOfentry to 0
        if(_balances[msg.sender].length == 0){
            initialTimeOfEntry[msg.sender] = 0;
        }
        emit Withdraw(msg.sender, _numberNft, initialTimeOfEntry[msg.sender], _totalSupply);
    }

    /**
     * @dev allows you to remove an ERC721 from the contract, by passing the tokenId as a parameter
     * @param _tokenId this is the identifier of the ERC721
     */
    function withdrawByTokenId(uint256 _tokenId) public updateReward(msg.sender) nonReentrant{
        _totalSupply = _totalSupply -1;
        for(uint i = 0; i < _balances[msg.sender].length; i++){
            if(_balances[msg.sender][i] == _tokenId){
                nft.safeTransferFrom(address(this), msg.sender, _balances[msg.sender][i]);
                _balances[msg.sender][i] = _balances[msg.sender][_balances[msg.sender].length - 1];
                _balances[msg.sender].pop();
            }
        }
        ///If the user has removed all these nfts, resets initialTimeOfentry to 0
        if(_balances[msg.sender].length == 0){
            initialTimeOfEntry[msg.sender] = 0;
        }
        emit WithdrawByTokenId(msg.sender, _tokenId, initialTimeOfEntry[msg.sender], _totalSupply);
    }

    /**
     * @dev allows you to withdraw all your ERC721 in this contract
     */
    function withdrawAll() public updateReward(msg.sender) nonReentrant{
        for(uint i = 0; i < _balances[msg.sender].length; i++){
            _totalSupply = _totalSupply -1;
            nft.safeTransferFrom(address(this), msg.sender, _balances[msg.sender][i]);
            _balances[msg.sender].pop();
        }
        _balances[msg.sender].pop();
        initialTimeOfEntry[msg.sender] = 0;
        emit WithdrawAll(initialTimeOfEntry[msg.sender], _totalSupply);
    }

    
    function getReward() public nonReentrant updateReward(msg.sender) waitMonth(msg.sender){
        uint256 reward = rewards[msg.sender];
        require(reward >= 0,"You have no reward");
        rewards[msg.sender] = 0;
        deployedToken.transfer(msg.sender, reward);
        initialTimeOfEntry[msg.sender] = 0;
        emit rewardPaid(msg.sender, reward, initialTimeOfEntry[msg.sender]);
    }

    /* ========== VIEWS ========== */

    function getBalance() public view returns(uint){
        return _balances[msg.sender].length;
    }

    function rewardPerNft() public view returns (uint) {
        if (_totalSupply == 0) {
            return rewardPerNftStored;
        }
        return
            rewardPerNftStored +
            (((block.timestamp - lastUpdateTime) * rewardsRate * 1e18) / _totalSupply);
    }

    function earned(address account) public view returns (uint) {
        return
            ((_balances[account].length *
                (rewardPerNft() - userRewardPerNftPaid[account])) / 1e18) +
            rewards[account];
    }

    function balanceOf(address account) external view returns(uint){
        return deployedToken.balanceOf(account);
    }

    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }

    /* ========== MODIFIERS ========== */

    modifier waitMonth(address account){
        require(initialTimeOfEntry[account] + 4 weeks < block.timestamp,
            "You must wait a month before withdrawing your winnings");
        _;
    }

    modifier updateReward(address account) {
        rewardPerNftStored = rewardPerNft();
        lastUpdateTime = block.timestamp;

        rewards[account] = earned(account);
        userRewardPerNftPaid[account] = rewardPerNftStored;
        _;
    }


    /* ========== EVENTS ========== */
    event Staked(address _ownerOfItem, uint _tokenId, uint _stakingTime, uint _totalSupply);
    event Withdraw(address _ownerOfItem,uint256 _numberNft, uint _stakingTime, uint __totalSupply);
    event WithdrawByTokenId(address _ownerOfItem ,uint256 _tokenId, uint _stakingTime, uint __totalSupply);
    event WithdrawAll(uint _stakingTime, uint __totalSupply);
    event rewardPaid(address _userPaid, uint256 _rewardPaid, uint _stakingTime);
}