// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract GStakingManager is AccessControl {
    using SafeERC20 for IERC20;

    bytes32 public constant ADMIN = keccak256("ADMIN");
    bytes32 public constant OWNER = keccak256("OWNER");

    uint256 public constant TIME_PER_BLOCK = 10;

    uint256 public BRONZE_RATE = 1;
    uint256 public SLIVER_RATE = 2;
    uint256 public GOLD_RATE = 3;

    uint32 public constant CONDITION_AMOUNT = 1000; // 1000$

    uint32 public constant CONDITION_SLIVER = 50 days;
    uint32 public constant CONDITION_GOLD = 100 days;

    IERC20 public assetToken;
    ISwapRouter public router;
    IERC20 public gpoolToken;
    IERC20 public usdc;
    IERC20 public goldLpToken;
    IERC20 public sliverLpToken;
    IERC20 public bronzeLpToken;
    uint256 public poolLength;

    struct Pool {
        IERC20 rewardToken;
        string nameToken;
        uint256 totalReward;
        uint256 openTime;
        uint256 closeTime;
        uint256 rewardPerBlock;
    }

    struct StakerInfo {
        uint256 stakingAmount;
        uint32 stakingTime;
        uint32 startStaking; // time start stake
        uint32 lastUnStaking; // time last unstake
    }

    enum Rank {
        BRONZE,
        SLIVER,
        GOLD,
        NORANK
    }

    mapping(address => StakerInfo) stakers;
    mapping(uint256 => Pool) pools;

    // event defination
    event DepositEvent(uint256 _amount, address _sender);
    event UnStakingEvent(uint256 _amount, address _sender);
    event ClaimRewardEvent(uint256 _amount, address _sender);
    event CreatePoolEvent(uint256 _poolId, Pool pool);
    event GetRewardEvent(uint256 _amount);
    event UpdatePoolRewardEvent(uint256 _poolId, uint256 _amountReward);
    event UpdatePoolTimeEvent(uint256 _poolId, uint32 _startTime, uint32 _endTime);
    //

    constructor(
        ISwapRouter _routerAddress,
        IERC20 _gpoolToken,
        IERC20 _usdc,
        address[] memory admins
    ) {
        require(admins.length == 3, "require 3 admin address");
        router = _routerAddress;
        gpoolToken = _gpoolToken;
        usdc = _usdc;

        _setupRole(ADMIN, admins[0]);
        _setupRole(ADMIN, admins[1]);
        _setupRole(ADMIN, admins[2]);
        
    }

    // address
    function setUp(
        IERC20 _gpoolToken,
        IERC20 _usdc,
        ISwapRouter _router
    ) public onlyRole(ADMIN) {
        gpoolToken = _gpoolToken;
        usdc = _usdc;
        router = _router;
    }

    // for test
    // set role 
    function setupRole(bytes32 _role, address _account) public {
        _setupRole(_role, _account);
    }

    // get staker info
    function getStakerInfo(address _staker) public view returns(StakerInfo memory){
        return stakers[_staker];
    }

    // staker deposit
    function deposit(uint256 _amount) public {
        gpoolToken.safeTransferFrom(msg.sender, address(this), _amount);
        stakers[msg.sender].stakingAmount += _amount;
        emit DepositEvent(_amount, msg.sender);
    }

    // staker unStaking
    function unStaking(uint256 _amount) public {
        require(_amount < stakers[msg.sender].stakingAmount, "not enough balance"); 
        gpoolToken.safeTransfer(msg.sender, _amount);
        stakers[msg.sender].stakingAmount -= _amount;
        emit UnStakingEvent(_amount, msg.sender);
    }

    // getBalance of staker in usd
    function getBalance(address _staker) internal returns (uint256) {
        StakerInfo memory staker = stakers[_staker];
        // require(msg.value > 0, "Must pass non 0 ETH amount");

        // using 'now' for convenience, for mainnet pass deadline from frontend!
        uint256 deadline = block.timestamp + 15;
        address tokenIn = address(gpoolToken);
        address tokenOut = address(usdc);
        uint24 fee = 3000;
        address recipient = _staker;
        uint256 amountIn = gpoolToken.balanceOf(_staker);
        uint256 amountOutMinimum = 1;
        uint160 sqrtPriceLimitX96 = 0;
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams(
            tokenIn,
            tokenOut,
            fee,
            recipient,
            deadline,
            amountIn,
            amountOutMinimum,
            sqrtPriceLimitX96
        );

        uint256 balanceInUSDC = router.exactInputSingle{ value: staker.stakingAmount }(params);

        return balanceInUSDC;
    }

    // increase poolength
    function increasePoolLength() public {
        poolLength++;
    }

    // caculateRewardPerBlock
    function calculateRewardPerBlock(
        uint256 startDate,
        uint256 endDate,
        uint256 totalReward
    ) internal pure returns (uint256) {
        uint256 blocks = (endDate - startDate) / (TIME_PER_BLOCK);
        uint256 rewardPerBlock = totalReward / blocks;
        return rewardPerBlock;
    }

    // create new pool reward
    function createPool(
        IERC20 _rewardToken,
        string calldata _nameToken,
        uint256 _totalReward,
        uint256 _openTime,
        uint256 _closeTime
    ) public onlyRole(ADMIN) {
        require(_closeTime > _openTime, "invalid time");
        require(_totalReward > 0, "invalid totalReward ");
        require(_rewardToken.balanceOf(msg.sender) >= _totalReward, "not enough balance");
        increasePoolLength();
        uint256 rewardPerBlock = calculateRewardPerBlock(_openTime, _closeTime, _totalReward);
        Pool memory pool = Pool({
            rewardToken: _rewardToken,
            nameToken: _nameToken,
            totalReward: _totalReward,
            openTime: _openTime,
            closeTime: _closeTime,
            rewardPerBlock: rewardPerBlock
        });
        pools[poolLength] = pool;
        emit CreatePoolEvent(poolLength, pool);
    }

    // withdrawAssetToken
    function withdrawAsset(IERC20 _tokenAddress, uint256 _amount) public onlyRole(ADMIN) {
        assetToken = _tokenAddress;
        require(assetToken.balanceOf(address(this)) > _amount, "not enound fund");
        assetToken.safeTransfer(msg.sender, _amount);
    }

    // update startTime, endTime of pool
    function updatePoolTime(
        uint256 _poolId,
        uint32 _startTime,
        uint32 _endTime
    ) public {
        pools[_poolId].openTime = _startTime;
        pools[_poolId].closeTime = _endTime;
        emit UpdatePoolTimeEvent(_poolId, _startTime, _endTime);
    }

    // get pool Info
    function getPoolInfo(uint256 _poolId) public view returns(Pool memory){
        return pools[_poolId];
    }

    // update total Reward of pool
    function updatePoolReward(uint256 _poolId, uint256 _amountReward) public {
        pools[_poolId].totalReward = _amountReward;
        emit UpdatePoolRewardEvent(_poolId, _amountReward);
    }

    // function getTier
    function getTier(address _staker) public view returns (Rank) {
        StakerInfo memory staker = stakers[_staker]; 
        Rank rank = Rank.NORANK;

        // condition for bronze
        if ( staker.startStaking == staker.lastUnStaking) {
            rank = Rank.BRONZE;
        }

        // condition for sliver
        if (
            staker.startStaking == staker.lastUnStaking &&
            staker.lastUnStaking + CONDITION_SLIVER <= block.timestamp &&
            staker.lastUnStaking + CONDITION_GOLD >= block.timestamp
        ) {
            rank = Rank.SLIVER;
        }

        // condition for gold
        if (staker.stakingAmount == staker.lastUnStaking && staker.lastUnStaking + CONDITION_GOLD < block.timestamp) {
            rank = Rank.GOLD;
        }
        return rank;
    }

    // user claim Reward
    function claimReward(uint256 _amount) public {
        require(getBalance(msg.sender) >= CONDITION_AMOUNT, "require min balance is 1000");

        // todo

        emit ClaimRewardEvent(_amount, msg.sender);
    }
}
