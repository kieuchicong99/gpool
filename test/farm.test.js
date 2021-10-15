const { expectRevert, time } = require('@openzeppelin/test-helpers');
const CorgiToken = artifacts.require('CorgiToken');
const CorgiFarmManager = artifacts.require('CorgiFarmManager');
const MockBEP20 = artifacts.require('BEP20');

contract('CorgiFarmManager', ([alice, bob, carol, dev, minter]) => {
    beforeEach(async () => {
        this.corgi = await CorgiToken.new({ from: minter });
        this.lp1 = await MockBEP20.new('LPToken', 'LP1', '1000000', { from: minter });
        this.lp2 = await MockBEP20.new('LPToken', 'LP2', '1000000', { from: minter });
        this.lp3 = await MockBEP20.new('LPToken', 'LP3', '1000000', { from: minter });
        this.manager = await CorgiFarmManager.new(this.corgi.address, dev, '1000', '100', { from: minter });
        await this.corgi.transferOwnership(this.manager.address, { from: minter });

        await this.lp1.transfer(bob, '2000', { from: minter });
        await this.lp2.transfer(bob, '2000', { from: minter });
        await this.lp3.transfer(bob, '2000', { from: minter });

        await this.lp1.transfer(alice, '2000', { from: minter });
        await this.lp2.transfer(alice, '2000', { from: minter });
        await this.lp3.transfer(alice, '2000', { from: minter });

        // send fund to corgiFarmManager
        await this.corgi.mint(this.manager.address, '100000', {from: minter});
    });

    // // pass
    // it('tc1:pool length', async () => {
    //     await this.manager.add('2000', this.lp1.address, true, { from: minter });
    //     await this.manager.add('1000', this.lp2.address, true, { from: minter });
    //     await this.manager.add('500', this.lp3.address, true, { from: minter });
    
    //     assert.equal((await this.manager.poolLength()).toString(), "4");
  
    //   })



    // // pass
    // it('tc2:check balance after deposit', async () => {
    //     await this.manager.add('2000', this.lp1.address, true, { from: minter });
    //     await this.manager.add('1000', this.lp2.address, true, { from: minter });
    //     await this.manager.add('500', this.lp3.address, true, { from: minter });
    
    //     // await time.advanceBlockTo('110');
    //     await this.lp1.approve(this.manager.address, '1000', { from: alice });
    //     // before deposit 
    //     assert.equal((await this.lp1.balanceOf(alice)).toString(), '2000');
    //     // deposit 20 to pool lp1
    //     await this.manager.deposit(1, '20', { from: alice });
    //     // after deposit 
    //     assert.equal((await this.lp1.balanceOf(alice)).toString(), '1980');
    // })

    // // pass
    // it('tc3:check pool info after user deposit', async () => {
    //     await this.manager.add('1', this.lp1.address, true, { from: minter });
    //     await this.manager.add('3', this.lp2.address, true, { from: minter });
    //     await this.manager.add('3', this.lp3.address, true, { from: minter });
    //     console.log("alice",alice);
    //     // await time.advanceBlockTo('110');
    //     await this.lp1.approve(this.manager.address, '1000', { from: alice });
    //     await this.lp2.approve(this.manager.address, '1000', { from: bob })
    //     // alice deposit 20 to pool lp1
    //     await this.manager.deposit(1, '20', { from: alice });
    //     // after deposit 
    //     let aliceInfo_lp1 = await this.manager.userInfo.call(1, alice)
    //     let aliceInfo_lp1_amount = aliceInfo_lp1.amount.toString();
    //     console.log("aliceInfo_lp1_amount",aliceInfo_lp1_amount)
    //     assert.equal(aliceInfo_lp1_amount, '20');

    //     // bob deposit 30 to pool lp2
    //     await this.manager.deposit(2, '30', {from: bob})
    //     // after deposit 
    //     let bobInfo_lp2 = await this.manager.userInfo.call(2, bob)
    //     let bobInfo_lp2_amount = bobInfo_lp2.amount.toString();
    //     console.log("bobInfo_lp2_amount",bobInfo_lp2_amount)
    //     assert.equal(bobInfo_lp2_amount, '30');
    //   })


    it('tc4:deposit/withdraw', async () => {
        time.advanceBlockTo('110');
        await this.manager.add('1000', this.lp1.address, true, { from: minter });
        await this.manager.add('1000', this.lp2.address, true, { from: minter });
        await this.manager.add('1000', this.lp3.address, true, { from: minter });

        await this.lp1.approve(this.manager.address, '100', { from: alice });
        await this.lp1.approve(this.manager.address, '100', { from: bob });
        await this.manager.deposit(1, '20', { from: alice });
        await this.manager.deposit(1, '0', { from: alice });
        await this.manager.deposit(1, '40', { from: alice });
        await this.manager.deposit(1, '0', { from: alice });
        await this.manager.deposit(1, '50', { from: bob });
        assert.equal((await this.lp1.balanceOf(alice)).toString(), '1940');
        await this.manager.withdraw(1, '10', { from: alice });
        assert.equal((await this.lp1.balanceOf(alice)).toString(), '1950');
        let managerBal = await this.corgi.balanceOf(this.manager.address);
        console.log("managerBal:", managerBal.toString());
        // assert.equal((await this.corgi.balanceOf(alice)).toString(), '999');
        assert.equal((await this.corgi.balanceOf(dev)).toString(), '100');

        // await this.lp1.approve(this.manager.address, '100', { from: bob });
        // assert.equal((await this.lp1.balanceOf(bob)).toString(), '2000');
        // await this.manager.deposit(1, '50', { from: bob });
        // assert.equal((await this.lp1.balanceOf(bob)).toString(), '1950');
        // await this.manager.deposit(1, '0', { from: bob });
        // assert.equal((await this.corgi.balanceOf(bob)).toString(), '125');
        // await this.manager.emergencyWithdraw(1, { from: bob });
        // assert.equal((await this.lp1.balanceOf(bob)).toString(), '2000');
    })

    // it('staking/unstaking', async () => {
    //   await this.manager.add('1000', this.lp1.address, true, { from: minter });
    //   await this.manager.add('1000', this.lp2.address, true, { from: minter });
    //   await this.manager.add('1000', this.lp3.address, true, { from: minter });

    //   await this.lp1.approve(this.manager.address, '10', { from: alice });
    //   await this.manager.deposit(1, '2', { from: alice }); //0
    //   await this.manager.withdraw(1, '2', { from: alice }); //1

    //   await this.corgi.approve(this.manager.address, '250', { from: alice });
    //   await this.manager.enterStaking('240', { from: alice }); //3
    //   assert.equal((await this.corgi.balanceOf(alice)).toString(), '10');
    //   await this.manager.enterStaking('10', { from: alice }); //4
    //   assert.equal((await this.corgi.balanceOf(alice)).toString(), '249');
    //   await this.manager.leaveStaking(250);
    //   assert.equal((await this.corgi.balanceOf(alice)).toString(), '749');

    // });


    // it('update multiplier', async () => {
    //   await this.manager.add('1000', this.lp1.address, true, { from: minter });
    //   await this.manager.add('1000', this.lp2.address, true, { from: minter });
    //   await this.manager.add('1000', this.lp3.address, true, { from: minter });

    //   await this.lp1.approve(this.manager.address, '100', { from: alice });
    //   await this.lp1.approve(this.manager.address, '100', { from: bob });
    //   await this.manager.deposit(1, '100', { from: alice });
    //   await this.manager.deposit(1, '100', { from: bob });
    //   await this.manager.deposit(1, '0', { from: alice });
    //   await this.manager.deposit(1, '0', { from: bob });

    //   await this.corgi.approve(this.manager.address, '100', { from: alice });
    //   await this.corgi.approve(this.manager.address, '100', { from: bob });
    //   await this.manager.enterStaking('50', { from: alice });
    //   await this.manager.enterStaking('100', { from: bob });

    //   await this.manager.updateMultiplier('0', { from: minter });

    //   await this.manager.enterStaking('0', { from: alice });
    //   await this.manager.enterStaking('0', { from: bob });
    //   await this.manager.deposit(1, '0', { from: alice });
    //   await this.manager.deposit(1, '0', { from: bob });

    //   assert.equal((await this.corgi.balanceOf(alice)).toString(), '700');
    //   assert.equal((await this.corgi.balanceOf(bob)).toString(), '150');

    //   await time.advanceBlockTo('265');

    //   await this.manager.enterStaking('0', { from: alice });
    //   await this.manager.enterStaking('0', { from: bob });
    //   await this.manager.deposit(1, '0', { from: alice });
    //   await this.manager.deposit(1, '0', { from: bob });

    //   assert.equal((await this.corgi.balanceOf(alice)).toString(), '700');
    //   assert.equal((await this.corgi.balanceOf(bob)).toString(), '150');

    //   await this.manager.leaveStaking('50', { from: alice });
    //   await this.manager.leaveStaking('100', { from: bob });
    //   await this.manager.withdraw(1, '100', { from: alice });
    //   await this.manager.withdraw(1, '100', { from: bob });

    // });

    // it('should allow dev and only dev to update dev', async () => {
    //     assert.equal((await this.manager.devAddress()).valueOf(), dev);
    //     await expectRevert(this.manager.dev(bob, { from: bob }), 'Permission for dev address');
    //     await this.manager.dev(bob, { from: dev });
    //     assert.equal((await this.manager.devAddress()).valueOf(), bob);
    //     await this.manager.dev(alice, { from: bob });
    //     assert.equal((await this.manager.devAddress()).valueOf(), alice);
    // })
});
